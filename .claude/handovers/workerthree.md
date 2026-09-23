Agent: workerthree · Lane: rail flow seam has no bloom (#229) · Updated: 2026-09-24 ~01:30

## Goal

Find why the rail flow seam (the marigold strip on top of each rail) barely blooms. Propose a fix. Build
nothing until the supervisor clears it.

## Done

- Diagnosis. Issue filed: #229. No code written.

## State

- Strip emissive = linear (1.826, 0.646, 0.035). Luminance 0.853. That is above `Bloom.threshold` 0.6 +
  smoothing 0.2. The threshold is not the cause.
- Cause: the strip is a flat 0.25u quad in the deck plane (`track-rail.tsx` strip quad, `RAIL_EMISSIVE_SHARE`
  0.125), at |x| = 33. The camera sees it edge-on. The core is 1 px and dashed (x 60, y 477, R 250).
- Bloom on − off, 1 px from the core: rail +79. Monolith seam (3 px core): +100.
- `Rail.railEmissive` 8: halo +131, but the core clips to 254 and stays 1 px wide.
- `Rail.railEmissive` 0 removes the line, so the line is the rail strip and not the rim cord.
- Projected widths of the fix options (0.7 px now, 3–4 px with a lip or cord) are [unmeasured], from geometry.
- Scratch dev server :5183 and headless Chrome :9333 are both killed.

## Uncommitted

- none

## Held files

- none yet. Proposed claim: `apps/client/app/game/scene/track-rail.tsx`, `track-rail.test.ts`,
  `track-geometry.ts` (one lip-height constant), `docs/ART_SCALE_REFERENCE.md` (one row).

## Next

1. Wait for the supervisor to clear the claim and for the owner to pick a fix option (#229).
2. Recommended option: an inboard vertical emissive lip on the strip, added to the strip group in
   `buildRailGeometry`. Add a test for the extra quad.
3. Re-tap headless `/test-level` with `ab=1`. Compare the 1 px halo against +79 now and +100 for the monolith.

## Open questions

- Owner: is the seam shape (a lip or cord in place of a flat strip) acceptable? It changes the 0.25u flat
  spec in `docs/ART_SCALE_REFERENCE.md` L42.

## Lessons → memory

- `.claude/memory/thin-emissive-needs-pixel-coverage.md`
