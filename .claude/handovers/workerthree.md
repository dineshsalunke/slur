Agent: workerthree · Lane: RFC-349 S15 readers after NetLoop (#379) · Updated: 2026-09-29

## Goal
Camera, `Render` and `Sim` readers run after `NetLoop` by priority. Measure the lag before and after on /test-level.

## Done
- db2552d (#378, CLOSED): `game/frame/frame-phase.constants.ts`.
- dbaf3b22 (#379, CLOSED): `afterSync` renamed to `view` (0.25). 12 readers moved to `FRAME_PHASE.view`: AsteroidBand, BlockDebris, MeteorChunks, MeteorScorch, MeteorStrikes, TrackBlocks, ExplosionField, ShipModel, ShipShadow, TugLine, PowerArc, SceneEffects.

## State
- Before (measured, :5173/test-level?quality=high, 180 frames, full throttle): 9 readers ran before NetLoop, stale in 100% of frames, mean 1.96 u, max 2.21 u.
- After (measured): NetLoop first; all 16 readers 0 u lag.
- typecheck clean · client vitest 99 files / 686 tests pass · lint 0 errors, 9 warnings (other files).
- Shake onset from BlockDebris/MeteorStrikes now reaches the camera one frame later [inferred, not measured].
- The headless Chrome was closed after each run (Playwright `browser.close`).

## Uncommitted
none

## Held files
none (released to the supervisor at dbaf3b22)

## Next
1. Idle. Wait for the supervisor.

## Open questions
none

## Lessons → memory
.claude/memory/measure-frame-order-over-cdp.md
