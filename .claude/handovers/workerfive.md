Agent: workerfive · Lane: boost 75% + motion blur + camera pull-back #269 · Updated: 2026-09-26 14:30

## Goal
Boost gain 40% → 75%. A radial motion blur and a camera pull-back while boosting, after owner approval.

## Done
- 4a8e1a8 — fix(client): a frame tap answers once (#172). #172 closed.
- 9be7439 — feat(shared): BOOST_GAIN 0.4 → 0.75 (#269). Pushed; the SHA is commented on #269.

## State
- Tests after 9be7439: shared 406/406, server 53/53, client boost + exhaust 15/15. No test asserted 0.4.
- The shared dist was rebuilt with `tsc -b --force`; dist/combat/constants.js has 0.75.
- postprocessing 6.39 has no MotionBlur/velocity effect (checked in build/types/index.d.ts).
- Radial blur prototype (12 taps, CONVOLUTION Effect in the live EffectPass): headless, DPR 1, 1600×900,
  3 reps. Baseline 8.5–9.8 ms; blur 8.3–10.1 ms. The within-rep delta is −1.3 to +0.5 ms, which is noise. A
  screenshot confirms the effect rendered. DPR 2 cost [unmeasured].
- The chase pull-back hooks into chase.ts:28 (`back = Chase.back + stretch·Chase.backStretch`). Chase.back
  is 14u.
- exhaustDrive clamps vz/maxCruise at 1, so it already saturated at 40%.
- Scratch prototype: scratchpad blur-perf.mjs (session 595fb26d). Headless Chrome is closed (pgrep empty).

## Uncommitted
- none

## Held files
- none until the owner approves. The plan claims chase.ts, scene-effects.tsx, dev/tuning-schema.ts, a new
  game/scene/boost-blur/, and a new game/camera/boost-surplus.ts (+ test).

## Next
1. Wait for owner approval of the plan (sent to the supervisor 14:25).
2. On approval: claim the files, then build boostSurplus (pure + test), Chase.boostBack/boostFov and the
   BoostBlur effect. Verify with a headless tap mid-boost, commit, and comment the SHA on #269.

## Open questions
- Owner: pull-back distance (proposed 3u), FOV kick (proposed 0), blur strength and samples (proposed 12).

## Lessons → memory
- `.claude/memory/time-a-post-effect-without-repo-edits.md`
