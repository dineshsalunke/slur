---
name: short-course-scratch-server
description: "To reach the finish in a hosted-room live check, run a scratch server that subclasses RunRoom with a 30-segment thin course; no repo edit, and the descriptor syncs to the client"
metadata:
  node_type: memory
  type: reference
  originSessionId: 3209736f-f6e4-4423-b820-43350e0f3d02
  modified: 2026-09-26T18:20:21.113Z
---

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

**How to apply:** use this for any check of the finish, results or grace-deadline flow. Kill the server after. To seed a finished results screen without flying, see [[seed-a-finished-room-with-a-scratch-server]]. Related: [[drive-a-hosted-room-over-cdp]], [[step-the-r3f-clock-for-timed-taps]], [[two-client-check-needs-two-chromes]].
