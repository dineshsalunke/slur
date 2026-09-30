Agent: workertwo · Lane: meteor polish — #393 (done) + #392 (not started) · Updated: 2026-09-30 15:05

## Goal
#393: end the meteor's deck "reflection" with the rock. #392: land strikes near the followed ship,
ahead and inside the chase view (client-only VFX, no sim change). Measure before/after for both.

## Done
- 745fc30b #393 (pushed, issue closed). The cause was the impact pointLight in
  `meteor-strikes.utils.ts` `flash()`: it faded over 1.8 s while the rock collapses in 0.16 s.
  It now uses the glow's collapse fade (`1 - age/COLLAPSE`, squared). LIGHT_DECAY/LIGHT_END are removed.
  - A/B with the light pinned to 0: the wall lobes and the deck hot spot vanish. The burst ring and the scorch ember stay, so they are not the cause.
  - Light excess at the impact (32 px luma box) was +84/+31/+11 at 0.27/0.67/0.93 s. After: intensity 0 from 0.16 s; 0.27 s luma 91 vs 90 light-off.

## State
- #392 baseline [partial]: in a 12 s full-throttle run from spawn, 2 strikes landed 100 u and 262 u ahead of the ship. The second was at x −36, behind a wall. No frustum share measured yet.
- Probe driver: scratchpad `meteor/probe.mjs` (Playwright + system Chrome, env MODE/START/AHEAD/TAP/SECONDS/SHOTS). It may be gone after /clear; the recipe is in memory `stage-a-meteor-strike-on-test-level`.
- The owner has not done the /test-level check of #393 [unmeasured].

## Uncommitted
none.

## Held files (claim cleared by supervisor, 2026-09-30)
- apps/client/app/game/scene/meteor-schedule.ts, meteor-schedule.test.ts
- apps/client/app/game/scene/meteor-strikes/* (constants, utils, tsx)
- apps/client/app/dev/tuning-schema.ts — the 'Meteor.ahead' line only; commit it at once by pathspec (workerone F4a may need the file)

## Next
1. Measure the #392 baseline: a 45 s run, chance 1, recording per strike the impact-to-ship distance, the z ahead and whether it is in the frustum.
2. Plan (not built): keep `strikeAt`'s slot grid as the cadence, but return relative offsets (ahead fraction, side −1..1) rather than absolute x/z. In `schedule()`, place the impact at the focus pose: z = focusZ + v·flight + ahead (~30–80 u), x = focusX ± ~12, clamped to ±(HALF_WIDTH − EDGE). Take the focus from the camera (the chase camera follows the local ship and the spectated ship alike), with v from the camera's dz/dt. That avoids plumbing a spectator target through net-canvas (held by workerone). Update the tests: on the deck, ahead of focus, same determinism.
3. Measure after, commit by pathspec, push, close #392 with the SHA, and brief the owner check on /test-level.

## Open questions
- Owner (from #373): an incoming-bolt button on /test-level? A phone tick/seeker overlap fix?

## Lessons → memory
- .claude/memory/stage-a-meteor-strike-on-test-level.md (new; indexed in MEMORY.md).
