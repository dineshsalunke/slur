Agent: workertwo · Lane: #340 private rooms + join code (plan stage); #338 open until prod verify · Updated: 2026-09-28

## Goal
Rooms are private by default and joined with a short code. The server keeps at most one public room (quick play, created on demand). #338 stays open: verify prod after the owner's single post-hardening deploy, then close it with 282428f.

## Done
- 282428f feat(#338): lobby chat (pushed to dev).
- #340 plan sent to slur-supervisor (2026-09-28). No edits yet.

## State
- Colyseus @colyseus/core 0.17.47 facts, verified in the installed build:
  - `this.roomId` can be replaced only in onCreate. The matchmaker does not check ids for uniqueness.
  - setPrivate(true) hides the room from LobbyRoom (queries `private: false, unlisted: false`; updateLobby skips private rooms).
  - joinById ignores private and rejects only not-found or locked.
  - joinOrCreate skips private and locked rooms and holds a concurrency lock around the create.
  - The only matchmake HTTP route is POST /matchmake/:method/:roomName, through the overridable `matchMaker.controller.invokeMethod`. authContext.ip comes from XFF ?? x-client-ip ?? x-real-ip.
- Plan:
  - 5-char code from `23456789BCDFGHJKMNPQRSTVWXYZ` (28^5 = 17.2M). The code is the roomId.
  - The public-room slot is guarded in onCreate.
  - The failed-join guard wraps invokeMethod: 10 per IP per minute, keyed on the last XFF hop.
  - The route stays /game/:code.
- #338 prod [unmeasured; waits for the deploy].

## Uncommitted
none

## Held files
none yet. The plan claims the files listed in the plan message, pending approval.

## Next
1. Wait for owner approval via slur-supervisor. Owner questions: 5 or 6 chars; global failed-join ceiling; keep LobbyRoom.
2. Build the new files first (room-code.ts, join-guard.ts, client home/overlay leaves, docs). Touch run-room.ts/index.ts only after #339 commits them.
3. After the final deploy: two-client check of #338 on slur.kurmah.studio, then `gh issue close 338` with 282428f.

## Open questions
- Who owns the client-IP helper and the invokeMethod wrapper, #339 or #340 (supervisor to sequence).

## Lessons → memory
none
