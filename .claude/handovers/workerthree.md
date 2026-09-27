Agent: workerthree · Lane: #310 remove rail lights + directional fill (+ black-frame fix) · Updated: 2026-09-27 10:40

## Goal

Remove the rail lights and the `Fill` light (done). Fix the black frame / ~2 fps the owner saw after 31e3131.

## Done

- `31e3131` removed the rail lights and Fill.
- `e5f8e20` black-frame fix. New `scene/shader-patch.ts` `chainShaderPatch` tracks patch tags per
  material. `patchDeckBreakup`, `patchWallBreakup` and `patchWallSpan` use it. The attach ref callbacks in
  `track-floor.tsx` and `monolith-group.tsx` are stable `useCallback`s. Root cause:
  `patchRailGlow` used to reset the chain on every ref call. Without it the chain re-wrapped. The deck swap
  then threw and its cache key grew (program rebuilds). The monolith/gate body applied wall-span + breakup
  twice ('vWallWorld' redefinition → invisible bodies).

## State

- Headless Chrome, /test-level, 800×450, after e5f8e20: 0 shader errors, 45 programs flat over 20 s,
  60 FPS · CPU ~2 · MAX 18, bodies + gate crossbar visible (scratchpad `prog.png`).
- HEAD before the fix: programs flat at 64 in Chrome and no error logged. Chrome did not reproduce the
  owner's black frame. The owner's browser is Zen (Firefox engine).
- Owner verification in Zen: [unmeasured]. The supervisor relayed it.
- Playwright Firefox 1509 with playwright-core 1.60 hung at launch. It is not a usable Firefox repro here.
- Vite dev server PID 85264 at ~157% CPU, 2.1 GB RSS. Supervisor says leave it.

## Uncommitted

none (the handover and memory are committed with this seam).

## Held files

The #310 files in `31e3131` + `e5f8e20`. Phrase lane files (on hold): `packages/shared/src/sim/phrase/*`,
`sim/avoid-pilot.test.ts`, `sim/track-digest.test.ts` (phrase row).

## Next

1. Wait for the supervisor's word that the owner confirmed in Zen. Then `git push origin dev` and
   `gh issue close 310 -c "31e3131 removal + e5f8e20 shader-chain fix; <numbers>"`.
2. If the owner still sees problems, ask for the Zen console text, then check the other material
   patches (`sealed-block-shader.ts`, `fractured-block-shader.ts`, `ship-model.utils.ts` assign
   `onBeforeCompile` directly, so they cannot chain).
3. Optional #310 A/B (`measure.mjs` in scratchpad `57407bce…`) only if the owner asks for numbers.

## Open questions

- None for the owner. Push waits on the supervisor.

## Lessons → memory

`.claude/memory/chained-shader-patches-need-a-material-guard.md`
