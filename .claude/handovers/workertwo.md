Agent: workertwo · Lane: #340 private rooms + join code (APPROVED, building); #338 open until prod verify · Updated: 2026-09-28

## Goal
Rooms are private by default and joined with a 5-char code. The server keeps at most one public room (quick play, created on demand). Leave #340 open until the owner's single final deploy. #338 also stays open: verify prod after that deploy, then close it with 282428f.

## Owner decisions (via slur-supervisor)
- Code length 5. Global failed-join ceiling OFF. Keep LobbyRoom for the live Quick-play count.
- workertwo owns `apps/server/src/client-ip.ts` and `apps/server/src/matchmake-guard.ts`.
- run-room.ts and index.ts: WAIT until the supervisor releases them (#339 commits first).
- workerone adds `installMatchmakeGuard([ new FailedJoinLimit(), … ])` to index.ts when it lands #339.

## Done
- 282428f feat(#338): lobby chat.
- fcd917b feat(#340): shared room-code, client-ip, matchmake-guard, failed-join-limit, RoomCodes registry.
- ad95630 feat(#340): `ChatLog.historyFor(senderId, nowMs)` — one history reply per 2 s per client (`CHAT_HISTORY_INTERVAL_MS`); `forget` clears it. 8/8 chat-log tests.
- 6b89660 feat(#340): home menu. `quickPlay` / `createPrivate` in matchmaking; action intents quick | create | join; `menu-form.utils.ts` maps MatchMakeError; leaves `create-button/`, `quick-play/`, `join-code-field/`; `lobby/room-list/` deleted.
- a7c63a5 docs(#340): GDD lobby bullet, TDD route + LobbyRoom notes, ADR-025.

## State
- 6b89660: client typecheck clean, 17/17 vitest (matchmaking + menu-form.utils), `pnpm lint` exit 0.
- Measured on :5173 (headless, closed after): two pages on Quick play reached the same room (SvHFx05VZ); Create gave a new room; typed `k7qxm` → "No run with code K7QXM." (522 path live); `zz` → "A run code is 5 letters and digits."
- Screenshots at 1440 / 800 / 390 px: menu fits, no overflow.
- INTERIM: the server still issues 9-char ids, so join-by-code cannot succeed until the RunRoom change lands. Links and Quick play work.
- Not pushed: ad95630, 6b89660, a7c63a5 [ask the supervisor].

## Uncommitted
none

## Held files
- Mine, committed: the files above.
- Claimed, not yet touched: `routes/game/route.tsx`, `game/overlays/lobby-overlay.tsx`, new `game/overlays/room-code/…`.
- WAIT: `apps/server/src/rooms/run-room.ts`, `apps/server/src/index.ts`.

## Next
1. After the supervisor releases run-room.ts:
   - RunRoom.onCreate(options): if `isPublicCreate(options)` and `roomCodes.publicRoom()` → `throw new ServerError(PUBLIC_ROOM_TAKEN_CODE, 'Quick play is full')`.
   - `this.roomId = roomCodes.claim()`; public → `roomCodes.claimPublic(this.roomId)`, else `void this.setPrivate(true)`.
   - onDispose → `roomCodes.release(this.roomId)`.
   - line 63: `const lines = this.chat.historyFor( client.sessionId, Date.now() ); if ( lines ) client.send( CHAT_HISTORY_MESSAGE, lines );`
   - Server tests: private room absent from LobbyRoom; joinById by code; second public create → 409.
2. Same commit as 1 (so links never break): game route loader — `normalizeRoomCode(params.roomId)` null → `redirect('/?run=closed')` with no server call; differs from the param → redirect `/game/<CODE>`.
3. RoomCode leaf ("CODE K7QXM") beside CopyLink in lobby-overlay.
4. Headless two-client check on :5173 (two Chromes), then the owner brief via the supervisor. Update ADR-025 "Built in".

## Open questions
- Push ad95630..a7c63a5 now, or hold until the server wiring? (supervisor)

## Lessons → memory
none. Colyseus facts are in fcd917b and ADR-025.
