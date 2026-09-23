Agent: workerthree · Lane: rail flow seam has no bloom (#229) · Updated: 2026-09-24 ~01:25

## Goal

Make the rail flow seam (the marigold strip on each rail) bloom. The owner picked an inboard lip and kept
the 0.25u strip.

## Done

- `3435610` diagnosis handover + memory `thin-emissive-needs-pixel-coverage.md`. Issue #229.
- `db2660c` the strip is now a 0.25u × 0.125u emissive lip (`RAIL_LIP_H`, `track-geometry.ts`), built in
  `buildRailGeometry` with top, inboard, outboard and end faces in material group 1. Metal stays flush.
  Tests updated plus a new inboard-face test. `ART_SCALE_REFERENCE.md` rail-height row rewritten.
- Results posted on #229.

## State

- Same pose as the baseline (headless /test-level spawn, 1600×900, DPR 1, ab=1), x=60, R, bloom on − off:
  flat strip 1 px dashed core, halo +81 above / +77 below. Lip 0.125u: 3–4 px solid core, +123 / +94,
  +79 at 5 px out. Lip 0.25u (tried, not shipped): 6–7 px, +157 / +111.
- Lip bloom-off core (255, 210, 54) against flat (250, 170, 94): red clips and the core leans yellow. Not tuned.
- Client tests 244/244. Client typecheck clean. Biome on my 3 files: 2 warnings, both older (unused
  `world`, and unused `LocalPlayer`/`Sim` imports in `track-rail.tsx`).
- Scratch :5183 and headless Chrome :9333 are killed.

## Uncommitted

- none

## Held files

- none. Release: track-rail.tsx, track-rail.test.ts, track-geometry.ts, ART_SCALE_REFERENCE.md.

## Next

1. Owner looks at the lip in a hosted room or /test-level.
2. If the yellow core bothers them: lower `Rail.railEmissive` a little, or give the lip its own material.

## Open questions

- Owner: is the yellow lean of the lip core acceptable?

## Lessons → memory

- none new this seam (`thin-emissive-needs-pixel-coverage.md` from 3435610 covers it)
