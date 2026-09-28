Agent: workertwo · Lane: #340 private rooms + join code (BUILT, awaiting owner brief + final deploy); #338 open until prod verify · Updated: 2026-09-28

## Goal
Rooms are private by default and joined with a 5-char code. The server keeps at most one public room (quick play, created on demand). Leave #340 open until the owner's single final deploy. #338 also stays open: verify prod after that deploy, then close it with 282428f.

## Owner decisions (via slur-supervisor)
- Code length 5. Global failed-join ceiling OFF. Keep LobbyRoom for the live Quick-play count.
- Sequence changed 2026-09-28: #340 landed run-room.ts + index.ts first; #339 goes after. ADR-026 is reserved for #339.

## Done
- 282428f feat(#338): lobby chat.
- fcd917b feat(#340): shared room-code, client-ip, matchmake-guard, failed-join-limit, RoomCodes registry.
- ad95630 feat(#340): ChatLog.historyFor — one history reply per 2 s per client.
- 6b89660 feat(#340): home menu — Create room · Quick play · Run code + Join; MatchMakeError messages; room list deleted.
- a7c63a5 docs(#340): GDD, TDD, ADR-025.
- cf922f8 feat(#340): RunRoom codes/private/public slot/dispose release, history throttle wired, index.ts guard with FailedJoinLimit, game loader code redirect, RoomCode chip in lobby. Pushed.

## State
- cf922f8: server 76/76, client 597/597, typecheck clean, lint exit 0.
- Live on :5173 (two headless Chromes, closed): create → DVJTG; private room absent from quick-play status; typed `dvjtg` joined DVJTG; `/game/dvjtg` → `/game/DVJTG`; `/game/not-a-code` → `/?run=closed`.
- Earlier: two Quick play pages reached one room; unknown code → "No run with code K7QXM."
- 429 path covered only by unit tests (failed-join-limit.test.ts) [not driven live].

## Uncommitted
none

## Held files
- None held now. run-room.ts and index.ts are released back to the supervisor for workerone (#339).

## Next
1. Owner brief via the supervisor (test on /: Create, Quick play, join by code).
2. After the owner's final deploy: verify prod, close #338 (282428f) and #340 (cf922f8).

## Open questions
none

## Lessons → memory
none. Colyseus facts are in fcd917b and ADR-025.
