Agent: workertwo · Lane: meteor polish — #393, #392, #398 (all done) · Updated: 2026-10-01

## Goal
#398: the camera shake on a meteor impact did not always fire.

## Done
- 745fc30b #393 (closed). The impact light fades with the rock's collapse.
- 7a90abc6 #392 (closed). Strikes land at camera x ± 10, camera z + v·flight + Meteor.ahead (65) × 0.7–1.3.
- c8d31137 #398 (closed). SHAKE_SIZE 3.5 → 1.5, SHAKE_REACH 80 → 140; launch() steps a pit impact
  forward 8 u (up to 4 tries) onto deck.

## State
- #398 before (55 u/s ghost-drive, 60 s, chance 1): 12/13 strikes landed, peak roll 0.05/0.12/0.35° min/median/max.
- #398 after: 13/13 landed, peak roll 0.50/0.88/1.74°, above 0.1° for ~0.5 s.
- Stale camX/Y/Z was not a cause: applyShake writes the pose every chase frame.
- The spectator camera never calls applyShake, so spectators get no shake. Out of scope (supervisor).
- Owner /test-level checks of #393, #392 and #398 [unmeasured].

## Uncommitted
none.

## Held files
none — meteor-strikes.utils.ts + constants released.

## Next
1. Wait for the supervisor's next lane.

## Open questions
- Owner (from #373): an incoming-bolt button on /test-level? A phone tick/seeker overlap fix?
- Owner: should spectators get camera shake too?

## Lessons → memory
- none new. Probe recipe (rotateZ wrap for shake) noted in stage-a-meteor-strike-on-test-level.md.
