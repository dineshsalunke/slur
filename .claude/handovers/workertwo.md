Agent: workertwo · Lane: #338 lobby chat on the ship-selection screen · Updated: 2026-09-28

## Goal
Text chat on the lobby screen of `/game/:roomId`. The server relays each line through room messages, not schema. It trims the text, caps it at 140 chars, allows 5 lines per 5 s and stamps the call sign. A mid-lobby joiner sees the last 30 lines.

## Done
- 282428f feat(#338): lobby chat. Pushed to dev.
  - Shared `chat.ts`: message names, `CHAT_MAX_CHARS` 140, `CHAT_HISTORY_LINES` 30, `cleanChatText()`.
  - Server `rooms/chat-log.ts`: `ChatLog` (sliding-window limiter, 30-line ring). `run-room.ts` accepts lines only in the lobby, only from a seated player, and forgets the sender on leave.
  - Client `net/chat-store.ts`: attached in `matchmaking.ts` `enter()`. It pulls history on attach and again on reconnect.
  - UI `overlays/lobby-chat/`: LobbyChat shell, ChatLines (the only subscriber), ChatInput (keydown stopPropagation, Escape blurs).
  - GDD §3: one bullet.

## State
- shared 550/550, server 53/53, client 589/589. `pnpm typecheck` clean. `pnpm lint` exit 0.
- React 19.2.8 `createRoot` → `listenToAllSupportedEvents(container)`, and synthetic stopPropagation calls the native one (verified in react-dom-client.development.js).
- Headless two-client check on :5173 at 1440×900 and 390×844:
  - Typing "wasd m e" in chat left the roster unchanged and did not start the race.
  - Joiner B got A's 2 history lines.
  - A saw B's line.
  - The panel sits right of "YOUR RUN" on desktop and stacks under COPY LINK on mobile.
- Prod (slur.kurmah.studio) [unmeasured; waits for the owner's deploy].

## Uncommitted
none

## Held files
Released after prod verification: the #338 files in 282428f.

## Next
1. The owner runs ./scripts/deploy.sh. Then verify on slur.kurmah.studio with two clients.
2. `gh issue close 338` with 282428f.

## Open questions
none

## Lessons → memory
none (nothing durable beyond the commit)
