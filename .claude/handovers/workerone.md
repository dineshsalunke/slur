Agent: workerone · Lane: exhaust hue + EngineLight removal (#369) · Updated: 2026-09-29

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Make the nozzles and their deck reflection read as the marigold accent (#F5B024, 40°). Remove the
EngineLight (owner decision, removal pre-approved). The rest of the plan waits for owner approval.

## Done

- Filed #369. Investigation only. No code written.

## State

All numbers are measured in headless /test-level (quality=high, 968×1062, EngineLight 0 = new baseline,
cruising, KeyP frozen). Hue is the mean of each brightness band in a crop.

- The nozzle has three parts. The face plates are GLB material `Marigold_emission`. Its emissive is linear
  (0.913, 0.323, 0.018), which is sRGB ≈ #F59A24 at 34°, not the accent. The grille bars are
  `Engine_core`: emissive (1, 0.462, 0.027) × 1.7 × engineCruise 2.2, with a peach base colour
  (1, 0.665, 0.258). The U-shaped glow is the plume, at ~40°.
- Default brightest nozzle pixels: 29.8°, sat 0.53 (peach). The owner's screenshot reads 27.6°, sat 0.49.
- Isolation, brightest band: bloom 0 → 30.4 · plume off → 29.6 · Exhaust.hot = accent → 29.9 ·
  engineCruise 1 → 30.1 · env 0 → 34.6 · light 18 → 28.0 · tone None → 50.4 (clips yellow) ·
  ACES → 44.5 sat 0.36 · AgX → 37.5 sat 0.25.
- Blank Marigold_emission → 34.6. Blank Engine_core → 28.8.
- Candidate x5 = both materials: emissive = accent, base colour black, plus engineCruise 0.6 and
  engineIdle 0.35. Nozzle bands read 38.0 / 40.0 / 40.5°, and no pixels are left over 240 (no peach).
  x2 (same, but Marigold keeps an accent base colour) still has a 35° peach top band.
- The exhaust reflection is on hue at defaults. Bands from dim to bright: 39.8 / 41.2 / 41.0 / 37.2°. The
  top band loses saturation to Neutral (0.66). The dim tail keeps its 40° hue but is rgb(63,44,7),
  which is brown by lightness, not by hue.
- NOT reproduced: the owner's near-camera streak at 31° (sat 0.9 in every band). Headless reads
  40–41° at DPR 1 and 2, with light on and light off. [inferred] Stored tuning in the owner's tab, or a view I
  have not matched. The extension was not connected, so I could not read their `slur.tuning.v1`.
- Scratchpad `73454a4d…/scratchpad/hue/`: cap.mjs (variants via localStorage, `__mat`/`__js` route
  rewrites of ship-model.utils.ts), band.mjs (hue per brightness band), stat.mjs, shots/, crops c-*.png.

## Uncommitted

- none.

## Held files

- none until the plan is approved.

## Next

1. Wait for the owner's decision on the plan sent to slur-supervisor.
2. Build: remove the EngineLight, override the two nozzle materials from `accent()` in `collectSurfaces`, and
   change the engine idle and cruise defaults.
3. Re-measure x5 on the real code, then brief the owner on /test-level.

## Open questions

- Owner: does the near-camera streak still read orange after "reset tuning" in the dev panel?
- Owner: is the flatter, less white-hot nozzle (x5) acceptable?

## Lessons → memory

- Pending. Memory writes are on hold (supervisor is merging memories). To write later: "nozzle
  colour lives in two GLB materials; Marigold_emission is authored at 34°, and Vite-served code
  has no spaces inside parens, so route rewrites need a regex".
