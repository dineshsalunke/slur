Agent: workertwo · Lane: #340 private rooms + join code (APPROVED, building); #338 open until prod verify · Updated: 2026-09-28

## Goal
Rooms are private by default and joined with a 5-char code. The server keeps at most one public room (quick play, created on demand). Leave #340 open until the owner's single final deploy. #338 also stays open: verify prod after that deploy, then close it with 282428f.

## Owner decisions (via slur-supervisor)
- Code length 5.
- Global failed-join ceiling OFF.
- Keep LobbyRoom for the live Quick-play count.
- workertwo owns `apps/server/src/client-ip.ts` and the single `apps/server/src/matchmake-guard.ts`.
- run-room.ts and index.ts: WAIT until the supervisor releases them (#339 must commit first, and #339 still awaits owner approval).
- workerone adds `installMatchmakeGuard([ new FailedJoinLimit(), … ])` to index.ts when it lands #339.

## Done
- 282428f feat(#338): lobby chat.
- fcd917b feat(#340): early batch, pushed to dev.
  - shared `room-code.ts`: alphabet, `normalizeRoomCode`, `makeRoomCode`, `isPublicCreate`, `RunCreateOptions`, codes 522/409/429.
  - server `client-ip.ts`: last XFF hop.
  - server `matchmake-guard.ts`: `guardInvoke`, `installMatchmakeGuard`, gates `{ admit?, failed? }`.
  - server `failed-join-limit.ts`: 10 per IP per 60 s, 429.
  - server `rooms/room-codes.ts`: `RoomCodes` registry plus the public slot; exports the `roomCodes` singleton.

## State
- fcd917b: 17/17 new server tests + 5 shared tests pass. `pnpm lint` exit 0. Shared dist rebuilt.
- Verified in the installed @colyseus/core 0.17.47:
  - `this.roomId` can be set only in onCreate.
  - setPrivate hides the room from LobbyRoom.
  - joinById ignores private.
  - joinOrCreate skips private and locked rooms and locks concurrent creates.
  - onCreate throw → `ServerError(e.code || 523)`.
  - The HTTP route answers `ctx.error(e.code)`.
  - The SDK throws `MatchMakeError(message, code = HTTP status)` (sdk 0.17.43 HTTP.mjs:198, Client.mjs:239).
- CopyLink (`game/overlays/copy-link.tsx`) already shows the pathname `/game/<id>`, so the code is visible there.
- Existing client test pattern: `net/matchmaking.test.ts` mocks `./client` → `{ create, joinById, joinOrCreate }`.

## Uncommitted
none

## Held files
- Committed in fcd917b (mine): the files listed above.
- Claimed and CLEAR, not yet touched:
  - client: `routes/home.tsx`, `routes/home/{menu-strip,host-button,menu-form,use-enter-hosts,menu-error}`, `lobby/room-list/*` (delete), `net/matchmaking.ts` (+test), `routes/game/route.tsx`, `game/overlays/lobby-overlay.tsx`, new `routes/home/quick-play/…`, `routes/home/join-code-field/…`, `game/overlays/room-code/…`.
  - docs: `docs/GDD.md` (line 129), `docs/TDD.md` (lines 53, 158–159), `docs/DECISIONS.md` (new ADR).
  - `apps/server/src/rooms/chat-log.ts` (+test), for the new throttle item below.
- WAIT: `apps/server/src/rooms/run-room.ts`, `apps/server/src/index.ts`.

## Next
1. NEW from the supervisor (#339 gap A, my file): throttle the CHAT_HISTORY reply to at most one per 2 s per client.
   - Add to `ChatLog`: `historyFor(senderId, nowMs): readonly ChatLine[] | null` (null when throttled), and forget the entry on leave.
   - Add a test.
   - The one-line call-site change is in run-room.ts, so it waits for the release.
2. Client, in `net/matchmaking.ts`:
   - `quickPlay(name)` = `joinOrCreate(ROOM_NAME, { name, public: true })`.
   - `createPrivate(name)` = `create(ROOM_NAME, { name })`.
   - `joinRoom` keeps joinById on the normalised code.
   - Add tests.
3. Home route: one Form with `intent` = quick | create | join, and a `code` field.
   - clientAction maps MatchMakeError.code: 522 → "No run with code X." (or "That run is full." when the message has 'locked'); 429 → "Too many wrong codes. Wait a minute."; 409 → "Quick play is full. Create a private room."
   - A QuickPlay leaf reads useLobbyRooms (one public row: count + phase via PHASE_VIEW, which moves from room-list.constants).
   - A JoinCodeField leaf: maxLength 5, upper case, Enter submits join and stops propagation.
   - useEnterHosts → Create private. Delete `lobby/room-list/`. HINTS 'Host' → 'Create'.
4. Game route loader:
   - `normalizeRoomCode(params.roomId)`: null → `redirect('/?run=closed')` with no server call.
   - Differs from the param → redirect to `/game/<CODE>`.
   - Optional RoomCode leaf ("CODE K7QXM") beside CopyLink in lobby-overlay.
5. Docs: GDD:129 bullet, TDD route + LobbyRoom notes, DECISIONS ADR "private by default, one public room".
6. After the supervisor releases run-room.ts/index.ts:
   - RunRoom.onCreate(options): if `isPublicCreate(options)` and `roomCodes.publicRoom()` is set → `throw new ServerError(PUBLIC_ROOM_TAKEN_CODE, 'Quick play is full')`.
   - `this.roomId = roomCodes.claim()`.
   - If public → `roomCodes.claimPublic(this.roomId)`. Else → `void this.setPrivate(true)`.
   - onDispose → `roomCodes.release(this.roomId)`.
   - Wire the chat history throttle.
   - Server tests: private room absent from LobbyRoom; joinById by code; second public create → 409.
7. Headless two-client check on :5173 (two Chromes), then send the owner brief to the supervisor.

## Open questions
none

## Lessons → memory
none. The Colyseus facts are recorded in the fcd917b commit message and in the State section above.
