Agent: workerfive · Lane: room lifetime #271 · Updated: 2026-09-26

## Goal
Leave the room on back/Leave, handle onDrop/onLeave on the client, dedupe joinLobby. Keep the room on the
module singleton + loader (owner decision).

## Done
- 573fa90 — fix(net): leave the room on back and Leave, handle drop and lost (#271). Issue #271 closed.

## State
- Client typecheck, biome, 410/410 vitest pass (with other workers' uncommitted files in the tree).
- Live, headless Chrome on :5173/:2567, 8/8 PASS: host 1 seat; racing Leave→Stay keeps room; Leave→Leave
  0 seats; back button 0 seats; close 4010 → Reconnecting… → same room; reconnection off → lost panel →
  Back to menu → host again.
- Lost panel while phase is racing (guard bypass) [unmeasured] — checked by reading only.
- Chrome PID 84577 killed.

## Uncommitted
none

## Held files
none (all nine #271 files released)

## Next
- Await a new lane from slur-supervisor.

## Open questions
- None blocking. Input loop keeps calling `room.send` on a lost room; browser drops it silently (same as
  before the fix). A future lane could stop the net loop when status is `lost`.

## Lessons → memory
- `.claude/memory/simulate-a-room-drop-over-cdp.md`
