Agent: workerthree · Lane: RFC-349 S14 frame-phase constants (#378) · Updated: 2026-09-29 16:00

## Goal
One frame-phase constants file. Every `useFrame` priority comes from it. No behaviour change.

## Done
- db2552d (#378): new `apps/client/app/game/frame/frame-phase.constants.ts` — `FRAME_PHASE { base: 0, afterSync: 0.25, render: 1 }`. Replaced `AFTER_RENDER_SYNC` x2 (exhaust-field, boost-streaks), `PLAIN_RENDER_PRIORITY` (file deleted), frame-tap literal `0`. `EffectComposer` now passes `renderPriority={ FRAME_PHASE.render }` (its default is 1, read in node_modules/@react-three/postprocessing/dist/index.js: `renderPriority:n=1`).

## State
- `PASS_PRIORITY`, `HUD_PRIORITY`, `-1` named in the RFC no longer exist in source (grep).
- ast-grep `useFrame($CB, $P)` found only the 4 priority sites above. All other `useFrame` calls use the implicit default 0.
- `pnpm typecheck` clean. Client vitest 97 files / 678 tests pass. `pnpm lint` 0 errors, 9 warnings (pre-existing, other files).
- Live frame order [unmeasured]. Values are identical, so the order cannot change [inferred].

## Uncommitted
none

## Held files
none

## Next
1. Idle. Wait for the supervisor.

## Open questions
none

## Lessons → memory
none
