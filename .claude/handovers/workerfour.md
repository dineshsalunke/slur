Agent: workerfour · Lane: #289 portal pickup (BC4) · Updated: 2026-09-26, night

## Goal

Build a portal pickup: two placed ends, tap = near, double tap = far, any racer can use it, 9 s lifetime.
The teleport runs in the shared `simulate()`, so prediction replays it (BC4).

## Done

- Plan sent to slur-supervisor for owner approval. No code yet.

## State

- Prediction replays `simulate(..., blockWorld)` in apps/client/app/net/prediction.ts. `blockWorld` is a SimWorld
  mirrored from room state (game/block-state.ts), so `SimWorld.portals` carries the portals into the replay (read
  this session).
- The fire message already carries `seq` (`PowerSlotMessage`), so the double tap can be decided from seq on the server.
- The seeker trail (combat/seeker-trail.ts) records monotonic z, so a hop would drag a seeker across the gap.
  Proposal: the seeker misses.

## Uncommitted

None.

## Held files

None. Claims go to the supervisor per slice after the owner approves.

## Next

1. Wait for owner approval of the plan (5 slices, 8 questions) through the supervisor.
2. Claim the slice 1 files: combat/portal.ts, sim/types.ts, sim/step.ts, sim-config.ts, schema.ts (portalHops), index.ts.
3. Build slice 1 with tests, then slices 2–5 as listed in the plan message.

## Open questions

- The 8 owner questions are in the plan message: lone-end expiry, the arm delay, one pair per owner, the pickup mix,
  seeker lock on a hop, jumping over an end, charge kept on a fizzle, placeholder VFX.

## Lessons → memory

none
