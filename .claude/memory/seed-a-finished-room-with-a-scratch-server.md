---
name: seed-a-finished-room-with-a-scratch-server
description: "To see the results screen live without flying the track, run a scratchpad server that subclasses RunRoom and seeds finished racers on a debug message"
metadata:
  node_type: memory
  type: reference
  originSessionId: 7e74315f-39ce-4c77-a52d-e5dcbc5354fc
  modified: 2026-09-24T03:31:36.620Z
---

To reach PHASE.finished in a real hosted room fast (#238, 2026-09-24), use a scratch server entry in
the session scratchpad. It needs no repo edit.

- `ln -s <repo>/apps/server/node_modules <scratch>/node_modules`, so bare imports resolve to the same
  module instances as `run-room.ts` (the same `@colyseus/core`).
- The entry imports `RunRoom` by absolute path and subclasses it. `onCreate()` calls `super`, then
  adds `onMessage('__finish', …)`. The handler adds fake `PlayerState`s (name, colorId, shipId,
  finished, finishTime), sets the sender's own time, and sets `state.phase = PHASE.finished`.
- Define both `ROOM_NAME` and `'lobby'` (`LobbyRoom`). Without the lobby room the client home page
  fails with `provided room name "lobby" not defined`.
- Run it from `apps/server` with `PORT=<p> node --import tsx <scratch>/debug-server.ts`, and pair it
  with a client on its own `CLIENT_PORT`/`VITE_SERVER_PORT`.
- Send from the page: `(await import('/app/net/session.ts')).session.room.send('__finish', 104.78)`.
- `isBareEnter` needs `e.target === document.body`. Dispatch on `document.body` with `bubbles: true`.
  A keydown dispatched on `window` is ignored.

Related: [[drive-a-hosted-room-over-cdp]], [[check-the-cdp-port-is-yours]],
[[narrow-headless-captures-need-cdp-viewport]].
