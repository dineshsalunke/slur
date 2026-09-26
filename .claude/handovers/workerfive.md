Agent: workerfive · Lane: boost blur + camera pull-back #269, then close #283 · Updated: 2026-09-26 15:05

## Goal
OWNER APPROVED (via supervisor, 2026-09-26): radial zoom blur while boosting (12 samples, early-out at ~0),
camera pull-back `Chase.boostBack` 3u, `Chase.boostFov` tunable default 0. All three are driven by one
signal, `boostSurplus`. In the same lane: colocate scene-effects.tsx (#283 recipe), raise the #283 Grit rule
to error, get `pnpm lint` passing, and close #283.

## Done
- 4a8e1a8 — the frame tap answers once (#172). Closed.
- 9be7439 — BOOST_GAIN 0.4 → 0.75 (#269). The SHA is commented on #269.
- f95d8ad — handover + memory `time-a-post-effect-without-repo-edits.md`.
- No code for the blur or pull-back yet. This seam came before the first write.

## State (measured this session)
- `pnpm exec biome lint apps/client/app`: the only remaining #283 plugin hits are 3, all in
  `game/scene/scene-effects.tsx` (`AUTO_MSAA_MAX_DPR`, `AUTO_MSAA_SAMPLES`, `function msaaSamples`).
- The Grit rule is `biome-plugins/component-module-scope.grit`. It has `severity="warn"` on its last line;
  change that to `"error"`. biome.json only wires it through `overrides[0].plugins`.
- Importers of SceneEffects: `game/scene/world-scene.tsx:12` and `routes/home/landing-scene/landing-scene.tsx:10`.
  The landing scene has a `WorldProvider`, so `useWorld()` works in SceneEffects on both routes.
- Precedent: `.utils.ts` files may call `num()` (e.g. `scene/exhaust-field/exhaust-field.utils.ts`).
  ls-lint lists `.constants.ts`, `.utils.ts` and `.state.ts`.
- tuning-panel lists keys explicitly, under `useControls( 'Chase camera', {...} )` (~line 160). A Bloom
  group also exists; put Boost.blur near it or in its own 'Boost' group.
- The schema format is `'Chase.fov': { value: 70, min: 40, max: 120, step: 1, rebuild: false }`. Bloom keys
  are at lines 38–40, Chase keys at 126–133.
- chase.ts:26 `stretch = speed / maxCruise`; :28 `back = Chase.back + stretch·Chase.backStretch`; :38 fov.
- `DEFAULT_SIM_CONFIG.boostGain` is exported from @slur/shared (boost-streaks.tsx imports DEFAULT_SIM_CONFIG).
- Effect prototype that rendered correctly (screenshot verified), in scratch `blur-perf.mjs`:
  `new Effect('RadialBlur', frag, { attributes: EffectAttribute.CONVOLUTION, uniforms: Map{strength, center},
  defines: Map{SAMPLES} })`, placed FIRST in the EffectPass effect list, before bloom and tone mapping. Frag:
  `d = uv - center; m = smoothstep(0.12, 0.6, length(d)) * strength; if (m < 0.001) {outputColor =
  inputColor; return;}` then SAMPLES taps of `texture2D(inputBuffer, uv - d*m*0.08*t)` averaged.
- Cost at DPR 1 1600×900: not resolvable from noise (−1.3…+0.5 ms within rep).

## Uncommitted
- none

## Held files (all CLEARED by the supervisor)
- apps/client/app/game/camera/chase.ts (+ chase.test.ts), new camera/boost-surplus.ts (+ test)
- apps/client/app/dev/tuning-schema.ts, apps/client/app/dev/tuning-panel/tuning-panel.tsx (3 lines)
- game/scene/scene-effects.tsx → new folder game/scene/scene-effects/ (.tsx, .constants.ts, .utils.ts)
- importers game/scene/world-scene.tsx, routes/home/landing-scene/landing-scene.tsx
- new game/scene/boost-blur/ (boost-blur-effect.ts, boost-blur.constants.ts)
- biome-plugins/component-module-scope.grit

## Next (build plan)
1. `camera/boost-surplus.ts`: `boostSurplus(vz, maxCruise, gain = DEFAULT_SIM_CONFIG.boostGain)` =
   clamp01((vz − maxCruise)/(gain·maxCruise)), plus `localBoostSurplus(world)` (LocalPlayer+Sim+Net query;
   0 when absent or dead). Test: 0 at cruise, 1 at full boost, clamped, 0 without a local ship.
2. chase.ts: `const surplus = boostSurplus( speed, maxCruise )`, then
   `back += surplus·num('Chase.boostBack')` and `fov += surplus·num('Chase.boostFov')`. Add a chase test:
   the gap grows by ~3u at full boost.
3. Schema: `Chase.boostBack` {3, 0–10, 0.5}, `Chase.boostFov` {0, 0–20, 0.5}, `Boost.blur` {1, 0–2, 0.05}.
   Panel: the two go in 'Chase camera'; Boost.blur goes in its own 'Boost' group.
4. `scene/boost-blur/boost-blur-effect.ts`: `class BoostBlurEffect extends Effect` with `strength` and
   `center` setters. Constants file: SAMPLES=12, INNER 0.12, OUTER 0.6, REACH 0.08, FAR_AHEAD 500, and the
   scratch Vector3.
5. Move scene-effects into `scene/scene-effects/`: the constants (AUTO_MSAA_*) go to .constants, msaaSamples
   to .utils. Own a BoostBlurEffect via useMemo and put it FIRST in the composer
   (`<primitive object={blur} />` before bloom); dispose it in the existing effect cleanup. In useFrame:
   strength = localBoostSurplus(world)·num('Boost.blur'); center = project(camera.position + (0,0,FAR_AHEAD))
   to uv, clamped 0–1. Update the 2 importers.
6. Grit severity → "error". Run `pnpm lint`, `pnpm typecheck`, and the client + shared tests.
7. Verify headless (DPR 1, kill after): a tap mid-boost shows the blur and the pull-back. Re-time with scratch
   blur-perf.mjs adapted to the shipped effect (baseline = Boost.blur 0 via its own localStorage).
8. Commit by pathspec. Comment the SHA + frame cost on #269 with the NN-13 weighing (7 options; it is in the
   plan sent to the supervisor 14:25). Close #283 listing 87c758f c92a27e e234fcd + my SHA. Close #269 if
   the owner needs no sign-off, else comment and leave it open.

## Open questions
- none (plan approved as proposed)

## Lessons → memory
- none new this seam (`time-a-post-effect-without-repo-edits.md` written earlier, f95d8ad)
