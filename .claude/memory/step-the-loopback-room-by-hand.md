---
name: step-the-loopback-room-by-hand
description: "Stepped-clock taps on /test-level: call room.step(dt) yourself, fire with room.send, spawn with ?start=; advance(seconds) barely moves the loopback sim"
metadata:
  node_type: memory
  type: reference
  originSessionId: 006e4bd3-c63c-4503-9606-7a27dcde8080
  modified: 2026-09-27T16:04:33.570Z
---

On `/test-level` the sim is a `LoopbackRoom` driven by R3F `addEffect`, which reads its timestamp as
**milliseconds**. [[step-the-r3f-clock-for-timed-taps]] passes `advance(t)` in **seconds**, so the sim steps
~1/1000 of the wanted time. Measured 2026-09-27 (#326):

- **Step both:** `step = dt => { T.fake += dt*1000; T.t += dt; room.step(dt); fiber.advance(T.t, true); }`.
- **Fire with `room.send('usePowerUp', { slot: 0, dir: 1 })`.** A Playwright KeyE under `frameloop 'never'`
  did not fire. The same key fires with the live loop (#324).
- **Spawn with `/test-level?start=x,z`, not a state write.** Writing `room.sim.state` x/z reached the
  decoded client in one run and not in the next three (client stayed at z 0, camera at −14). `?start=`
  was reliable. Root cause of the stall is [unmeasured]; peers had uncommitted `packages/shared` edits.
- **Draw counts:** three skips a GL draw for an `InstancedMesh` at `count` 0 (`three.module.js`
  `if ( primcount === 0 ) return;`), but `renderBufferDirect` is still called. A scene VFX mesh goes
  through twice per frame (main + rear-view pass), so an active one adds **2** GL draws, not 1.

**Why:** three runs showed the tug power "not firing" and a rope 490u long; the tap was wrong, not the code.

**How to apply:** use this recipe for any timed tap of a power on /test-level. Solo track spawn has no
block within tug range (first block z 480 on the default phrase seed), so start at `-25.25,410`.
Related: [[stage-a-mine-on-test-level]], [[frameloop-never-screenshots-black]].
