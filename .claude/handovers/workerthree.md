Agent: workerthree · Lane: #310 remove rail lights + directional fill · Updated: 2026-09-27 10:40

## Goal

Remove the rail lights and the `Fill` directional light completely. Keep `NearFill`. Now also: find why
/test-level renders black / 1 fps for the owner after 31e3131 (supervisor, URGENT).

## Done

- `31e3131` removal: `rail-glow.ts`, `use-rail-mask.ts`, `back-fill/`, `RailLight.*` + `Fill.*` keys and
  panel groups, the rail mask in `trackRails()` (runs only now), monolith/finish-gate `railMask` props.
  `patchWallSpan` cache key is now `slur-monolith-wall-span`. Docs: ADD, ART_MATERIALS §7,
  perf-analysis SKILL.md + perf.mjs.
- `e65f313` handover.

## State

- Before (10:03, old code, bloom on, headless M1 Pro DPR 1 1600×900, frozen spawn, vsync off): 9.5 / 9.7 ms,
  125 draws, HUD "106 FPS · CPU 1.2". Taps: scratchpad `before-0.png`, `before-1.png`.
- 10:11 run: rep 0 black frame (`after-0.png`), rep 1 rendered (`after-1.png`, HUD "8 FPS · CPU 114").
  Whether bloom was on then is [unmeasured].
- 10:35, HEAD 12859b0, scene-effects.tsx == HEAD (bloom on), headless 800×450: scene renders, NOT black
  (`probe.png`). rAF 301 in 5 s, HUD "11 FPS · CPU 73.8 · MAX 457".
- 4 s CPU profile after 20 s warm-up: 3512 ms idle of ~4000. Hot: `getParameters` 40 ms, `getProgram`
  32 ms, `deckBreakupFragment` 13 ms, `setProgram` 13, `cloneUniforms` 10. `deckBreakupFragment` only runs
  in `onBeforeCompile`, so programs are being built in steady state [inferred: recompile loop].
- NaN count: not measured. The `EffectComposer.prototype.render` wrap (scratchpad `nan.mjs`) was never
  called in 10 s, so the page composer is not that prototype instance.
- Machine load 7–8 all session; another agent's `node --test` at 100% CPU (PID 19868).

## Uncommitted

none in the repo. Scratch drivers in the session scratchpad: `measure.mjs`, `diff.mjs`, `nan.mjs`,
`probe.mjs`, `prof.mjs`.

## Held files

The #310 files in `31e3131`. Phrase lane files (on hold): `packages/shared/src/sim/phrase/*`,
`sim/avoid-pilot.test.ts`, `sim/track-digest.test.ts` (phrase row).

## Next

1. Test the recompile lead: read `renderer.info.programs.length` over CDP at t and t+5 s. If it grows,
   log `customProgramCacheKey()` of the deck, deck-side and monolith materials. Since 31e3131 the deck and
   side keys start from the default `onBeforeCompile.toString()` (it was `'slur-rail-glow'`). Check
   `deck-breakup.ts:179-186`, `wall-breakup.ts:58-71`, `applyDeckFinish` (needsUpdate?).
2. If there is no recompile loop, do the NaN bisect with the right composer instance (find it through the
   R3F store: `canvas.__r3f` or the fiber root), then hide `scene.children` one by one.
3. Then the #310 A/B: `measure.mjs after`, then my source files at `31e3131^` in the working tree only,
   `measure.mjs before`, restore HEAD, `diff.mjs before-1.png:after-1.png` + noise pair.
4. `gh issue close 310` with SHA + numbers.

## Open questions

- Supervisor: is the owner's black frame present at a small window / DPR 1? Mine was not black at 10:35.

## Lessons → memory

none (the lead is not confirmed yet).
