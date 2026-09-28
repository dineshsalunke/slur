Agent: workertwo · Lane: #338 lobby chat on the ship-selection screen (PLANNING) · Updated: 2026-09-28

## Goal
Text chat on the lobby screen of `/game/:roomId`. The server relays each line through room messages, not schema state. The server trims the text, caps it at 140 chars, rate-limits each client and stamps the call sign. A player who joins mid-lobby sees the last 30 lines.

## Done
- Plan sent to slur-supervisor for owner approval. No edits yet.

## State
- `@colyseus/sdk` 0.17.43 `Room.mjs:292`: a message type with no handler is dropped with a warn. So the client pulls history (it sends `chatHistory` after it attaches its handlers). The server does not push it in onJoin.
- `@colyseus/core` `maxMessagesPerSecond` disconnects a client that sends too much. It is unfit for chat. Use our own per-session limiter (5 lines / 5 s).
- Unguarded window keydown listeners in the lobby: `game/input/keyboard.ts` (WASD/Space), `audio/game-audio` (M), `dev/sim-freeze.ts` (P). Plan: the chat input's onKeyDown calls stopPropagation. keyup is not stopped.
- React 19 root-container listening, and whether stopPropagation reaches window listeners [unmeasured; recalled].
- #337 landed 59a4599. run-room.ts is free once workerone releases it.

## Uncommitted
none

## Held files
none yet. The claim list is in the plan: shared chat.ts + index.ts, server chat-log.ts + room-chat.test.ts + run-room.ts, client net/chat-store.ts, matchmaking.ts, overlays/lobby-chat/*, lobby-overlay.tsx, overlays.test.tsx, docs/GDD.md.

## Next
1. Wait for the owner's approval via slur-supervisor. Get "clear" on the claims.
2. Build shared → server (with tests) → client store → UI → focus test.
3. `pnpm typecheck && pnpm test && pnpm lint`. Commit by pathspec. Push. Close #338 with the SHA.

## Open questions
- Would the owner rather have typingTarget guards in the 3 unguarded listeners than stopPropagation at the chat input?

## Lessons → memory
none
