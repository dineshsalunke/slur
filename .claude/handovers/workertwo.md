Agent: workertwo · Lane: RFC-349 S19 quality hooks (#391) — NOT STARTED (claim cleared) · S20 #388 done · Updated: 2026-09-29 18:30

## Goal
S19 (#391): remove the `QualityGate` remount (rocks), add a `quality.sync` react-phase hook system, make surfaceRes/hdriRes reload-only with a picker note, and move QualityStepDown into NetCanvas.

## Done
- 80b9e8ef #388 follow-up: DIAL_SYNC_SYSTEM in the net, landing and deck schedules; DialSync leaf removed. The push also carried workerthree's 6acf1345 (#389).
- 9b5f38f2 #388 S20 (closed). Earlier: a3ee47ad S17, 8681e05 S8, f3382cb S3, cf8f95e S2.

## State
- S19 BASELINE, measured twice, identical (scratchpad `tier-remount.mjs`: headless swiftshader, /test-level, saved tier high, 120-frame medians):
  high 74 draws / 33.4 ms · low 49 draws / 33.3 ms · high again 74 · InstancedMesh 98 → 98 but **11 new objects** after high→low→high (= RockField remount).
  ms is swiftshader-bound (≈30 fps), so it does not read tier cost; draws do.
- Survey (verified by grep): the profile knobs are landing3d, surfaceRes, hdriRes, dprCap, msaa, post, rocks. post/msaa/dprCap are already per-frame reads (S18). The only QualityGate left is `game/scene/game-environment.tsx:12` (rocks). rear-view.tsx, nebula-baker.ts and nebula-noise-volume.ts no longer read quality → out of S19. landing3d stays out (supervisor agreed).
- surfaceRes is read in `game/scene/track-texture.ts:15` `res()`; hdriRes in `game/scene/hdri/hdri.state.ts:26-27` (the dev HDRI link loader).
- The engine `ClientFeature` (engine/define-client-feature.ts) has no `quality` slot; workerone holds engine/ for F2. Do not add one.

## Uncommitted
none.

## Held files (claim CLEARED by supervisor for S19)
quality/* (quality-gate/ to delete; new quality-latch/, quality-sync/; quality.constants.ts, quality.state.ts), game/scene/game-environment.tsx (swap only: import + 2 JSX lines — S19-only edit so workerthree/S19 rebase is clean), game/scene/track-texture.ts, game/scene/hdri/hdri.state.ts, routes/home/quality-picker/* , game/game-shell.tsx, the 3 schedule constants (one QUALITY_SYNC_SYSTEM line each; landing-schedule may also get a workerthree line, so ask the supervisor to sequence).
NOT cleared: game/net-canvas.tsx (workerone F2 #390). Keep QualityStepDown in game-shell.tsx until the supervisor hands net-canvas over; send the exact line when ready.

## Next
1. Build `quality/quality-sync/`: `.state.ts` holds registerQualityHook(apply(profile)) (applies on register) and syncQuality() (runs hooks once when quality().tier changes); `.constants.ts` holds QUALITY_SYNC_SYSTEM {id:'quality.sync', phase:'react'}; add a test, same shape as dial-sync.state.test.ts.
2. `quality/quality-latch/quality-latch.tsx` replaces QualityGate. Freeze `on` at mount with useState(() => qualityProfile()[feature]). If off at mount → null (supervisor: this must be covered by the reload note, or mount on first enable). If on → `<group ref={cb}>` and cb registers a hook setting group.visible = profile[feature]. No subscription.
3. quality.state.ts: freeze the load-time profile (first resolve) and add reloadNeeded() = the current tier's RELOAD_ONLY knobs (surfaceRes, hdriRes, and rocks when it was off at load) differ from load time. track-texture res() and hdri read the load-time profile.
4. Picker note: "Reload to apply" when reloadNeeded(); the picker already re-renders through useQuality.
5. Add QUALITY_SYNC_SYSTEM to the 3 schedules; delete quality-gate/.
6. Measure with tier-remount.mjs: expect newInstancedObjects 0, low draws ≈49. Then typecheck, biome, vitest, commit, send the supervisor the net-canvas line + RFC row text (include the stale file list), and close #391 after the step-down move lands.
7. Owner check on /test-level: switch tier mid-race → no hitch, no remount; the reload note appears for texture knobs.

## Open questions
- Owner (from #373): incoming-bolt button on /test-level? phone tick/seeker overlap fix?

## Lessons → memory
- none this seam.
