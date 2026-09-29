---
name: scratch-servers
description: "Two no-repo-edit Colyseus scratch servers for live checks: subclass RunRoom and seed finished PlayerStates on a debug message to reach the results screen instantly, or subclass RunRoom with a 30-segment thin course so a bot actually reaches the finish instead of wedging on the full 400-segment track"
metadata:
  node_type: memory
  type: reference
  originSessionId: 7e74315f-39ce-4c77-a52d-e5dcbc5354fc
  modified: 2026-09-29T04:07:55.659Z
---

### Seed a finished room with a scratch server

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
[[headless-game-tabs-starve-the-gpu]].

### Short-course scratch server

A full hosted track is 400 segments (8000u). The CDP bot wedges between blocks and stays stunned: a bounce sets `stunTimer`, and a stunned ship ignores input. Two runs ran to the old 180 s cap at z 2239 and z 557. Since #301 there is no cap, so a wedged bot now races forever until it leaves. A live check that needs the **finish** should shorten the course and leave the bot alone.

What worked on 2026-09-24 (#241): a scratch `.mjs` in your own scratchpad, started with `node --import tsx` from `apps/server`.
- **Imports:** load `@colyseus/core` and `@colyseus/ws-transport` by their resolved `file://` URLs. Get each one with `node --input-type=module -e "console.log(import.meta.resolve('<pkg>'))"`, run in `apps/server`. A bare specifier does not resolve from outside the repo. Load `@slur/shared` from `packages/shared/dist/index.js`, and `RunRoom` from `apps/server/src/rooms/run-room.ts`.
- **The subclass:** `class ShortRunRoom extends RunRoom`, with an `onCreate` that:
  1. calls `super.onCreate()`;
  2. builds `{ ...toDescriptor(this.state.descriptor), length: 30, blockDensity: 0.3, gapChance: 0 }`;
  3. passes it to `applyDescriptor`;
  4. sets `this.track = resolveTrack(d)` and `this.pickups = pickupsOf(this.track)`.
- **Register it** under `ROOM_NAME`. Point the client at it with `VITE_SERVER_PORT`.

`blockDensity` and `gapChance` are schema fields, so the client materializes the same short track. `isFinish` starts at z = length × 20. The bot finished in 13 s.

**Why:** a long course plus a naive bot means long runs, and none of them reached the finish.

**How to apply:** use this for any check of the finish, results or grace-deadline flow. Kill the server after. To seed a finished results screen without flying, see above. Related: [[drive-a-hosted-room-over-cdp]], [[timed-taps]], [[headless-game-tabs-starve-the-gpu]].
