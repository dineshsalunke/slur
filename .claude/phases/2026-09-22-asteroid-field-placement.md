# Asteroid field — placement half

2026-09-22. Session "asteroids". Commit `adfd749` on `feat/test-level`.

## What shipped

Placement only. Three new files, nothing else touched:

- `apps/client/app/game/scene/asteroid-config.ts`
- `apps/client/app/game/scene/asteroid-field.ts`
- `apps/client/app/game/scene/asteroid-field.test.ts`

Green at commit: `pnpm lint` clean (7 pre-existing warnings in `track.ts`), `pnpm typecheck`
passes all three workspaces, 8/8 vitest.

**It is dead code.** No geometry, no renderer, nothing mounts it. No asteroids are visible.

## Reading of the golden reference

`docs/art-direction/golden-reference/cruise-lighting.png` uses rock for four separate jobs:

| Job | Read |
|---|---|
| Far belt | dense band of small silhouettes occluding the nebula, arching overhead |
| Mid drifters | 50–200u, readable facets, loose spacing, carries the parallax |
| Near flank | large, cropped at frame edges, warm marigold bounce on inboard faces |
| Gap rubble | small rocks inside deck cut-outs, in the void under the floor |

Form is angular convex chunks — hard flat facets, irregular silhouette, not spheres, not spiky.
Value is near-black, slightly cooler than monolith graphite, lit top-down cool from the backdrop.

**Zero emissive on any rock in the frame.** That is the argument for deferring veins.

## Decisions taken

1. **Bands are polar around the track axis**, not a left/right offset. One rule then covers both
   flanking rock and the overhead belt. `x = ±cos(θ)·R`, `y = sin(θ)·R`.
2. **Streaming window, not whole-track build.** Follows `track-blocks.tsx`, not `monoliths.tsx`.
   The monolith field builds every placement up front from `track.finishZ`, which is fine for a
   few dozen columns and wrong for a rock field.
3. **Decor only.** No collision, no `step.ts`, no server knowledge. `asteroidField` takes a
   z-window, not a `Track`, so the `packages/shared` churn cannot reach it.
4. **Static rocks, no tumble.** The reference is a still frame. Also makes decision 7 free.
5. **Veins deferred.** When they land they use the existing `ENVIRONMENTAL_MARIGOLD_INTENSITY`
   (`track-materials.ts:60` = `2.0 × 0.25` = 0.5), not a fresh number.
6. **Gap rubble deferred.** It reads as a track-opening detail and needs `track-openings.ts`.
7. **Size classes from `docs/ART_SCALE_REFERENCE.md` §5** — "Asteroid S | 10–50u", "M | 50–200u",
   "L | 200–400u".

## What the tests caught

- **Near-to-far ordering was broken.** Independent per-side z-jitter inverted order within a slot.
  Load-bearing, not cosmetic: the streaming instancer drops the tail, so a broken order means the
  *near* rocks vanish on overflow. Fixed with an explicit sort, asserted in the test.
- **The belt poked through the far plane.** `outerRadius 850 + maxSize/2 200 = 1050` vs `far: 1000`.
  Inner clearance had been checked, outer extent had not. `outerRadius` is now 700.
- **One test was wrong.** `|x| > size/2` to catch straddling — but a belt rock at 85° is *overhead*,
  small `x`, large `y`, which is intended. Replaced; the 3D clearance check already covered it.

## Verified this session (three 0.185.1)

Worth not re-deriving:

- **`needsUpdate` uploads the FULL backing array.** `WebGLAttributes.js:87-90` — empty
  `updateRanges` → `gl.bufferSubData( bufferType, 0, array )`, `count` ignored. Per-frame upload
  cost scales with LIMIT, not with visible instances.
- **The fix exists.** `BufferAttribute.js:181` `addUpdateRange( start, count )`, `:190`
  `clearUpdateRanges()`. Refill writes contiguously from 0, so one `addUpdateRange(0, count * 16)`.
- **`BLOCK_LIMIT = 160` is content-derived, not a perf ceiling.** `track.test.ts:346-353`. Nobody
  has measured the real ceiling.
- **Segment-range gating is worth it.** `SEG_LEN` 20 (`track.ts:117`), `maxCruise` 55
  (`constants.ts:69`) → the window's integer segment range advances 2.75×/s, not 60. Gate the
  refill on `(i0, i1)` changing, not on camera movement.
- **Tunables persistence.** First load persists nothing — `persist()` is reachable only from
  `announce()` (`tunables.ts:218-222`), which runs on a set; `restore()` (`:216`) applies a saved
  value only for keys already in the blob. So **appending a key is safe against a populated
  store**, but **the first slider move of ANY key freezes EVERY key**, and a later source-side
  default change is invisible until the store is cleared — which discards the owner's dialled set.

## Next steps

1. `asteroid-geometry.ts` — displaced icosahedron, non-indexed for flat facets, `band.detail` as
   the LOD. `detail 0` = 20 faces for the belt, `2` for the flank.
2. `asteroid-group.tsx` — one `<instancedMesh>` per (band, variant). Needs a full-transform
   `place()` (rotation + non-uniform scale); `put()` in `track-instancing.ts` is position+scale
   only. Ranged uploads, segment-range gating, emit in the order `asteroidField` returns.
3. `asteroids.tsx` — composes the three bands.
4. `rock.*` appended to `NUMBER_SPECS`. Append only — three sessions share that file.
5. One `<Asteroids track={track} />` line in `game-environment.tsx`.

## Open, needs the owner

**Camera far plane.** `test-level-canvas.tsx:37` is `far: 1000`. The belt's radial extent fits, but
a belt rock far down the z-window sits past it and will visibly pop. Real fix is ~2500. Not taken —
shared file, visible behaviour change. `slur-supervisor` is carrying it into the PR body as an open
item.

**Belt instance budget.** Build it adjustable and measure, rather than copying 160 — that number
came from block content, not from a measured perf ceiling.

## Coordination state at handover

Four sessions shared this tree: `asteroids` (this one), `monoliths` (blocks), `slur-supervisor`
(rail/seams, coordinating the landing), `controls` (ship banking, rail bounce).

`slur-supervisor` is holding the push until every dirty file in `packages/shared` has an owner.
Its file list is in `2026-09-22-rail-light-diagnosis-and-the-deck-seams.md`.

Nothing of this session's is entangled: the planned appends to `tunables.ts`,
`track-materials.ts` and `game-environment.tsx` were never made.
