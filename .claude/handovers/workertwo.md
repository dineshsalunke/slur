Agent: workertwo · Lane: deck material on monoliths + blocks (#228) · Updated: 2026-09-24

## Goal

Owner pick B: *"lets use the deck material on the blocks and monoliths please"*. Code, tunable, docs
and memory are done. `Monolith.plate` default is 2. Waiting on workerthree's seam-flicker report.

## Done

- `81c2b76`: monoliths use only the deck material. `use-rail-mask.ts` shared by `monoliths.tsx` and
  `finish-gate.tsx`.
- `9688d40`: sealed, fractured and debris blocks spread `floorSurface()` and follow `Deck.*` through
  `applyDeckFinish` (`deck-finish.ts`).
- `f6e9874`: `Monolith.plate` tunable (0–24, rebuild). `SurfaceParams.joints`: false makes `eachJoint`
  a no-op and drops the per-plate value jitter. `monolithSurface()` in `track-materials.ts`.
- `321a65f`: `docs/ART_MATERIALS.md` rev. 8 (header note, M2 + M3 notes, §2 rows, item 11 pointer,
  new §7 item 16, §8 log). `docs/ADD.md` §4. Memory `monoliths-are-metal-now.md` replaced by
  `deck-material-on-blocks-and-monoliths.md`; `MEMORY.md` line updated.
- `d54e4ef`: §7 item 12 superseded-in-part note (`Metal.mapTint` deleted, per item 16).
- `fd818e6`: `Monolith.plate` default 4 → 2 (owner). §7 item 16 line updated with the bake cost.

## State

- At `fd818e6`: vitest 244/244. At `f6e9874`: client tsc clean, comment ratchet passes. Biome: one
  pre-existing `noExcessiveLinesPerFile` warning on `track-texture.ts`.
- Stills (git-ignored), x 0 z 75, frozen, clean origin :5187, 1600×813, DPR 1:
  `.claude/frame-tap-refs/228-monolith-plate-2.png` (default; pillar grid twice as dense as the deck),
  `228-monolith-plate-4.png`, `228-monolith-plate-0.png` (plain brushed pillars).
- Extra bake at plate 2, cold `/test-level` load, headless swiftshader, V8 CPU profile at 100 µs, 2
  samples each: `build` (track-texture.ts) totals 49.4 / 54.8 ms at plate 4, 111.3 / 121.7 ms at
  plate 2. Extra ≈ 57–67 ms. Measured at scene mount on `/test-level`, not in a hosted room at GO
  [whether the hosted room bakes on the first race frame: unmeasured].
- Warm single bake, for comparison: 22.6–29.8 ms (4 samples).
- No scratch servers or Chrome running.

## Uncommitted

None.

## Held files

`apps/client/app/game/scene/monolith-group.tsx` — HELD, do not edit until workerthree's seam-flicker
report is in (supervisor). Also held: `apps/client/app/game/scene/{monoliths, monolith-frames,
finish-gate, use-rail-mask, unattached, rail-glow, track-blocks, block-debris, deck-finish,
sealed-block-shader, fractured-block-shader, metal, track-materials, track-texture}`,
`apps/client/app/dev/{tuning-schema, tuning-panel}.ts(x)`, `docs/ART_MATERIALS.md`, `docs/ADD.md`.

## Next

1. Wait for the supervisor: workerthree's monolith seam-flicker diagnosis.
2. Follow-up for whoever holds `track-floor.tsx`: it keeps an inline copy of `applyDeckFinish`. Fold it
   into `deck-finish.ts`.
3. Earlier lane (#227): still waiting on the worktree and the 145 ms bake questions. The plate-2 bake
   (~60 ms cold) adds to that load cost.

## Open questions

1. Owner: does R3 need a follow-up? Wear patches do not show on the close block (one sample).
2. Owner (still open): worktree for the `036645c` darkness stills; the 145 ms bake on the first race
   frame.

## Lessons → memory

none this seam. Prior: `.claude/memory/deck-material-on-blocks-and-monoliths.md`.
