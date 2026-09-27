Agent: workerthree · Lane: #310 remove rail lights + directional fill · Updated: 2026-09-27 10:15

## Goal

Remove the rail lights and the `Fill` directional light completely. Keep `NearFill`.

## Done

- `31e3131` removal: `rail-glow.ts`, `use-rail-mask.ts`, `back-fill/`, `RailLight.*` + `Fill.*` keys and
  panel groups, the rail mask in `trackRails()` (runs only now), monolith/finish-gate `railMask` props.
  `patchWallSpan` cache key is now `slur-monolith-wall-span`. Docs: ADD (rails paragraph), ART_MATERIALS
  (two superseded notes in §7), perf-analysis SKILL.md + perf.mjs (dead `rails`/`backfill`/`pointlights`).

## State

- Before (10:03, headless Chrome, M1 Pro, DPR 1, 1600×900, frozen spawn, vsync off): 9.5 / 9.7 ms
  median, 125 draws. Driver: scratchpad `measure.mjs` (Playwright, readPixels per frame).
- After: NOT YET MEASURED. A peer's uncommitted edit comments out bloom in `scene-effects.tsx` (10:05).
  Asked slur-supervisor who owns it.
- vitest 502/502. tsc clean outside workerone's track-editor files. biome clean on my 12 files.

## Uncommitted

none.

## Held files

The #310 files in `31e3131`. Phrase lane files (on hold): `packages/shared/src/sim/phrase/*`,
`sim/avoid-pilot.test.ts`, `sim/track-digest.test.ts` (phrase row).

## Next

1. When bloom is back on: run the after measurement (same driver), diff taps vs before-0/before-1
   noise floor, report to supervisor.
2. `gh issue close 310 -c "<what shipped + 31e3131 + numbers>"`.
3. Idle; phrase lane S4 stays on hold.

## Open questions

- Supervisor: owner of the bloom-off edit in `scene-effects.tsx`.

## Lessons → memory

none yet.
