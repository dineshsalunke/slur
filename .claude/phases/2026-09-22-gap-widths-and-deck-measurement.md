# Gap widths, deck measurement, and the two-agent collision

Branch `feat/test-level`. Continues `2026-09-22-deck-detail-and-metalness.md`. Next session works on
**the rails** — see §5.

## ⚠ Read first: a second agent shares this checkout

`ListAgents` reports a peer session **`monoliths`**, started ~2h before this session and still busy.
It is live in `apps/client/app/game/scene/` and `apps/client/app/dev/`. Files changed under this
session four times mid-task.

**Confirm the peer's status before you touch `apps/client`.** Files it owned this session:

| File | What it did |
|---|---|
| `app/dev/tunables.ts` + `tuning-*.tsx`, `use-tunables.ts` | New — the debug panel the last handover asked for |
| `game/scene/gradient-ibl.tsx` | Rewritten to read tunables; `IBL_INTENSITY` is gone |
| `game/scene/track-floor.tsx` | Material scalars now come from tunables |
| `game/scene/track-rim.tsx` | Set `CORD_INTENSITY` to 0 |
| `game/scene/emitter-array.ts` | Gained 3 comment lines |

`packages/shared` was untouched by the peer (mtimes 01:27 and earlier), which is why this session's
generator work went there safely.

## 1. Gap widths — 4u to 64u (owner's ask, done)

Owner: *"all the gaps in the level are pretty much 64u wide, we should have gaps ranging from 4u to
64u wide, for smaller gaps the longitudinally then can be longer."*

**The generator had exactly two gap shapes, both one segment (`SEG_LEN` 20u) deep:** `full`
(`FULL_GAP_FRAC` 0.4 → no floor, the whole 64u) and `partial` (a 16–20u corridor survives → hole is
the 44–48u complement). Nothing narrower than 44u existed and nothing was ever longer than 20u.

### The crack — a third gap family

`packages/shared/src/sim/track.ts`. A **crack** is a narrow longitudinal slot the player strafes
around instead of jumping over, spanning 2–4 segments. New constants in `constants.ts`:
`CRACK_FRAC` 0.45 · `CRACK_W_LANES_MIN` 1 · `CRACK_W_LANES_MAX` 5 · `CRACK_SEGS_MIN` 2 ·
`CRACK_SEGS_MAX` 4 · `CRACK_EDGE_MARGIN_LANES` 2.

Measured distribution over 5 seeds × 400 segments:

| hole width | longest run |
|---|---|
| 4u, 8u | 80u (4 segments) |
| 12u, 16u | 60u (3 segments) |
| 20u | 40u (2 segments) |
| 44u, 48u, 64u | 20u (1 segment, unchanged) |

Narrower runs longer, as asked: `segs = lerp( CRACK_SEGS_MAX, CRACK_SEGS_MIN, t )` over the width
range.

**Why the jump contract survives.** `track.test.ts:130` asserts *"every ship class clears a
one-segment gap"*. A crack is never jumped: both its floor spans run the full segment depth, so
`isHole()` — redefined by the gap-teeth work as *"no full-length span"* — returns **false** on a
crack segment. That also leaves `track.test.ts:250` (*"no two gaps in a row"*) passing untouched.
GDD §0's threadable clearance holds by construction: a ≤20u slot held 2 lanes off each wall always
leaves ≥22u of contiguous floor on one side.

### The defect worth remembering: overlapping cracks

The first cut let a crack start inside another crack. At seed 991 the 3-segment crack starting at
segment 387 covered 389, but 389 *also* qualified as a start with a different width — so segment 390
got a 20u slot spliced into the middle of a 16u one. A visible jog in the slot.

Resolved by making overlap **impossible** rather than resolving it after the fact: `crackStartAt()`
requires a quiet run of `CRACK_SEGS_MAX` segments with no gap roll before a crack may start, so two
starts can never be closer than the longest possible crack. No recursion, no scan window, exactly
deterministic — which matters because client and server materialize this independently (ADR-000).

Rejected: an "earliest start wins" backward scan (correct only one level deep; chains of suppression
break it) and a fixed-width forward scan with a `claimedUntil` cursor (deterministic but
window-dependent, and the window is an arbitrary constant nobody can justify later).

### Tests — `packages/shared/src/sim/gap-crack.test.ts` (new)

Six invariants: cracks exist and stay within the width band; a crack is never a hole; both shoulders
keep ≥ `CRACK_EDGE_MARGIN_LANES × CELL` and the widest run ≥ `MIN_LANE`; runs are 2–`CRACK_SEGS_MAX`
segments and narrower cracks run at least as long as wider ones; gap widths span `CELL` to
`2 × HALF_WIDTH`; a crack carries no blocks and no teeth.

`MIN_CLEAR` is **documented in GDD §0 but does not exist as a code symbol**. The test uses `MIN_LANE`
(8u, in `track.ts`), which is stricter than the 7u contract. Do not hand-type 7 — that is the exact
stale-number failure GDD §0 warns about.

### Not done

- **The 20u–44u band is empty.** Widening the crack range would fill it, but a 30u slot leaves ~17u
  each side, which is neither a strafe nor a jump. Flagged to the owner; no decision taken.
- **No ADR entry.** Generator internals are ADR-006/ADR-007; a third gap family probably owes
  `docs/DECISIONS.md` an entry. Not written.

## 2. Rim cord thinned (owner's ask, done)

`CORD_RADIUS` 0.12 → **0.08** in `game/scene/track-rim.tsx` — a 33% reduction, mid-range of the
owner's *"reduce the radius by 25 - 50%"*. The cord-length compensation and `track-rim.test.ts` both
read the constant symbolically, so nothing else changed.

**The owner has not seen it.** The peer set `CORD_INTENSITY = 0` in the same file, so the cords emit
nothing. Restore that before judging the width. Confirming it visually also needs a flight past
z=140u, which this session could not do — synthetic `w` keydowns dispatched into the page do not move
the ship, cause not investigated.

## 3. Deck lighting measured onto the reference — then superseded

Picked up the last handover's top item (*"re-measure before turning any other knob"*). The frame was
wrong on all three axes, not one:

| | reference | at session start | after the two edits |
|---|---|---|---|
| deck luminance | 29.3 | 13.0 | **28.7** |
| local contrast | 23.7% | 41.7% | **22.2%** |
| b/r | 1.18 | 2.00 | **1.30** |

Two constants did it:

1. **`METAL_PLATE = 0.7`** (new, `track-texture.ts`). `FLOOR_METALNESS` was 1 **and** the metalness
   map's plate base was also 1, so the plate face was a raw conductor with zero diffuse. The 0.7 the
   owner settled the session before never reached the surface. Contrast 41.7% → 27.2%, b/r 2.00 →
   1.62.
2. **`IBL_INTENSITY` 4 → 8**. With contrast under control there was headroom for fill, and fill was
   the missing 2.3× of luminance.

**The previous handover's rule — "fill is what destroys contrast" — was right but aimed at the wrong
knob.** Metalness was the contrast problem; the IBL was only ever the brightness problem.

### The peer's defaults override both

`METAL_PLATE = 0.7` survives in the metalness map. The rest does not:

- `gradient-ibl.tsx` now reads `num( 'ibl.intensity' )`, default **3**, against the measured 8.
- The deck material scalar is `num( 'deck.metalness' )`, default **0.55**, so effective plate
  metalness is 0.55 × 0.7 = **0.385**.

That second one re-introduces the trap the last handover documented: *"Both maps multiply the
material scalar, so `metalnessMap` can only pull metalness down. `FLOOR_METALNESS` must stay 1 and
the map must carry all the variation."* A 0.55 scalar caps the map's reach.

**Measured recommendation, for whoever sets the defaults:** `ibl.intensity` 8, deck metalness scalar
1, map plate base 0.7. Unmeasured at handover: the peer's 3 / 0.55.

## 4. `scripts/deck-survey.mjs` (new)

The last handover said the measurement script *"should be moved into the repo — it is the only reason
the session stopped guessing."* Done. Self-contained PNG decoder on `node:zlib`, no deps, no Python.

```
node scripts/deck-survey.mjs shot.png@0.10,0.55,0.90,0.98
```

Prints the reference row first, then one row per image: patch count, deck luminance, local contrast
(sd against each row's own mean, which cancels near/far falloff) and b/r. Warm and blown patches are
discarded, so rails and the ship drop out on their own.

Two method notes:

- **Browser-tool screenshots are JPEG; the script reads PNG.** Convert with macOS `sips`. The
  round-trip was calibrated on the reference itself: it costs 0.4 luminance and 0.4pp contrast.
  Negligible.
- **Box the deck only.** The default box reaches into the backdrop; black space drags luminance down
  and contrast up hard. `@0.10,0.55,0.90,0.98` was right for a 1492×812 spawn frame.

## 5. Next: the rails

Nothing here is started. What is known:

**As built.** `track-rails.ts` merges per-segment edge runs into `RailRun[]`, feeding both the
geometry and the emitter array. `track-boundary.tsx` `emitEdge()` emits **two quads** — a 1u top face
at `y + h` and an inboard side face. `BOUNDARY_W` = `BOUNDARY_H` = 1.0, placed at
`±HALF_WIDTH ± w/2` = **±32.5**, outboard of playable width.

**The gap against the design.** `ART_MATERIALS.md` records the owner's 2026-09-20 resolution as a
*"1u × 1u chamfered bar standing outboard at ±32.5"*. The x placement matches. **The chamfer does
not exist, and neither do the outboard or bottom faces** — the section is an open L, not a bar. That
is the first thing to settle.

**The unresolved design question, same sheet.** §M8's departure note: the package's board 24 panel 02
excludes *"raised rails or ornamental edge machinery"*, and the owner's bar departs from it. The
choice recorded is **raised-outboard versus flush-outboard**; the original embedded-and-inboard
reading is *"not available in any form"* because it costs playable width. The departure note written
for Codex lived in `.claude/art-pass/`, deleted 2026-09-21 — recover with `git show e56f643`.
Per `CLAUDE.md`, disagreement with the package never goes in `docs/art-direction/`.

**The emitter axis blocker, carried from `2026-09-22-gap-shape-and-rim.md`.** Every emitter slot
shares one `uEmitterAxis` uniform, set to world +z in view space each frame
(`track-floor.tsx:51`). The transverse front and back edges of a gap run along x, so they cannot be
lit by the current array. The fix named there: make the axis per-slot (`uEmitterAxes[ N ]` alongside
`uEmitters`/`uEmitterTint`; `STRIDE` is already 4) and feed the nearest rim cords next to
`buildRailRuns()`. This is the same mechanism the rails use, so rail work and cord-lighting work
touch the same file.

**Watch for.** `BOUNDARY_SURFACE.color` is `#15171a`, a near-black base that still takes environment
light, so raising the IBL desaturates the marigold toward pale yellow. The last handover's advice
stands: judge rail colour with bloom back on and let `emissiveIntensity` carry it. `rail.emissive`
is already a tunable (default 2).

## 6. Gate state at handover

- `pnpm test` — **green**: 96 shared (6 new), 4 server, 128 client.
- `pnpm typecheck` — shared and server **clean**; `apps/client` **fails with 3 errors, all in the
  peer's in-flight `app/dev/tunables.ts`** (lines 129, 176, 186).
- `pnpm lint` — fails on the comment ratchet: `emitter-array.ts gained comment lines: 0 → 3`. The
  peer's file. Everything this session touched is clean apart from the pre-existing
  `noExcessiveLinesPerFile` warning on `track.ts`.
- Nothing committed. The tree holds both agents' work — **stage by path.**

## 7. Still stripped, from two handovers back

The revert table in `2026-09-22-lighting-rebuild.md` is still outstanding: bloom + composer, fog, and
the sim freeze on `P`. **No emissive value is trustworthy until bloom is back** — which includes
every rail and rim-cord judgement the next session will want to make. Consider restoring bloom
first.
