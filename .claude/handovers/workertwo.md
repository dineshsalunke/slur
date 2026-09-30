Agent: workertwo · Lane: meteor polish — #393 + #392 (both done) · Updated: 2026-09-30 15:35

## Goal
#393: end the meteor's deck "reflection" with the rock. #392: land strikes near the followed ship,
ahead and inside the chase view (client-only VFX, no sim change).

## Done
- 745fc30b #393 (pushed, closed). The impact pointLight now fades with the rock's 0.16 s collapse.
- 7a90abc6 #392 (pushed, closed). `strikeAt` keeps the slot grid as cadence and returns side/reach
  instead of x. `impactFor()` places the impact at camera x ± 10, camera z + v·flight + ahead·reach.
  `schedule()` takes the camera pose (chase or spectator), v = 0.5 s held-window camera dz/dt.
  `Meteor.ahead` 110 → 65 (max 200).

## State
- Before (55 u/s ghost-drive, chance 1): 9 strikes, 110–123 u from the ship, x up to ±41.
- After, 55 u/s: 9 strikes, 31–63 u, 9/9 in frustum. 110 u/s: 19 strikes, 2–94 u, 19/19 in frustum.
- Natural flight (ArrowUp only): the ship stalls at a wall near z 600; its one strike landed 159 u
  ahead, launched before the stop. Prediction cannot foresee a crash.
- The frustum test ignores walls. The smaller lateral spread (±10 vs ±41) is the occlusion fix [unmeasured].
- Owner /test-level check of #393 and #392 [unmeasured].

## Uncommitted
none.

## Held files
none — release meteor-schedule.ts + test, meteor-strikes/*, tuning-schema 'Meteor.ahead' line.

## Next
1. Wait for the supervisor's next lane.

## Open questions
- Owner (from #373): an incoming-bolt button on /test-level? A phone tick/seeker overlap fix?

## Lessons → memory
- .claude/memory/stage-a-meteor-strike-on-test-level.md (rewritten for the #392 placement + ghost-drive).
