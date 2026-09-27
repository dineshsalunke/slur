Agent: workerfive · Lane: reconnection hardening #14 (+ #15) · Updated: 2026-09-27 (pre-restart)

## Goal
Harden drop and reconnect: a reload reclaims the seat, prediction survives a drop, and real tests cover a
reconnect and an expired window.

## Done
- Plan sent to slur-supervisor (no code). Waiting for the owner's approval through the supervisor.

## State
- Verified this session, in `@colyseus/sdk` 0.17.43 `build/Room.mjs`:
  - Sends while dropped are buffered in `reconnection.enqueuedMessages` and flushed on reconnect (lines 247–253).
  - Auto-reconnect is skipped if the room was joined < 5 s ago (`minUptime: 5000`, line 323).
  - `room.reconnectionToken` = `roomId:token`, set on every JOIN_ROOM (line 243). `client.reconnect(token)` exists (Client.mjs:126).
- Verified in code: the server holds a seat for 20 s (`apps/server/src/rooms/run-room.ts` `RECONNECT_SECONDS = 20`).
  `RunSim.stepRace` skips `stepPlayer` for `!connected`, but still counts that player in `racerCount`.
  `reassignHost` never gives host back to a returning ex-host.
- Verified in code: the client never stores `reconnectionToken`. `predictor.reset()` runs only on a phase
  change (`attach-room-to-world.ts` offPhase). The 30 Hz input timer keeps sending while dropped.
- [unmeasured] Duplicate onAdd after the full-state resync on reconnect.

## Uncommitted
- none.

## Held files
- none. The S1 claim was requested but not yet approved: `apps/client/app/net/matchmaking.ts`,
  `matchmaking.test.ts`, `reconnect-token.ts`, `reconnect-token.test.ts`.

## Next
1. Wait for the supervisor to relay the owner's approval and answers to Q1/Q2.
2. S1: store the token in sessionStorage per roomId (on join and on reconnect). /game/:roomId tries
   `client.reconnect(token)` before joinById. Clear the token on a deliberate leave. Unit tests.
3. S2 (after #295 releases run-sim.ts + attach-room-to-world.ts): the client stops recording and sending
   while status != live, then runs predictor.reset() and snaps to the server ship on reconnect. The server
   clears the player's queue on drop and reconnect.
4. S3: server run-room.test.ts with a real SDK drop and reconnect, plus an expired window. Live CDP entity
   count on :5173/:2567 (a hosted room: /test-level has no reconnection).
5. S4: a dropped racer stops holding race end (per Q2). Ex-host restore (per Q1).
6. Close #14 with the SHAs. #15 stays open for the empty-room dispose race. File follow-ups for ghosting
   and grid gaps.

## Open questions
- Q1 (owner): does a reconnecting ex-host get host back?
- Q2 (owner): is a dropped racer excluded from race end at once, or after N seconds?

## Lessons → memory
- `.claude/memory/sdk-buffers-sends-while-dropped.md`
