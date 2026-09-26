---
name: place-the-ship-over-cdp
description: "To put the ship at a chosen spot on /test-level, write x/z on the loopback room's server state (room.sim.state); the client reconciles on the next 50 ms patch"
metadata:
  node_type: memory
  type: reference
  originSessionId: b0f5f26f-a904-449c-ae79-bfcb620951e7
  modified: 2026-09-26T14:41:06.602Z
---

Since #288 slice 4 (5336f7e), `/test-level` runs on an in-process `LoopbackRoom`. The route loader
returns it, so reach it from the page (verified 2026-09-26):

```
const ld = window.__reactRouterDataRouter.state.loaderData;
const room = ld[Object.keys(ld).find(k => ld[k]?.room)].room;
const s = room.sim.state.players.get(room.sessionId);   // server-side ship
s.x = X; s.lastSafeX = X; s.z = Z; s.lastSafeZ = Z;
```

The decoded client copy is `room.state.players.get(room.sessionId)`. It matched the written z within one
patch (a teleport to `finishZ − 60` read the same `cz` 100 ms later). Set `lastSafeX/Z` too, or a
respawn puts the ship back.

**Write while unfrozen.** KeyP makes `room.run()` skip `step()`, so no patch goes out and a write made
while frozen does not reach the client until you unfreeze. Place, wait ~3 s for the chase camera, then
KeyP and screenshot.

**Finding the target:** the track is deterministic. `room.sim.pickups` lists pickups with x/z;
`room.sim.track.finishZ` is the finish (8400 on the default gen). For blocks, resolve the track in
node from `packages/shared/dist/index.js` with `testLevelDescriptor(gen)` in
`routes/test-level/test-level-canvas/test-level-canvas.utils.ts`. The 2026-09-23 note "first
fractured block is id 3392 at z 1064" predates later track changes [unmeasured since].

**Why:** flying into a chosen spot by input is not repeatable ([[freeze-the-sim-to-ab-a-light]]).
The old hooks (koota `Sim`/`Prev` writes, `localCombat`) are gone: the server state now wins every
patch. Related: [[stage-a-mine-on-test-level]], [[koota-universe-reaches-the-page-world]].
