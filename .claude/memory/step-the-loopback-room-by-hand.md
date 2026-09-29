---
name: step-the-loopback-room-by-hand
description: "Stepped-clock taps on /test-level: call room.step(dt) yourself, send an input every step, start the fake clock at performance.now(), fire with room.send, spawn with ?start="
metadata:
  node_type: memory
  type: reference
  originSessionId: 006e4bd3-c63c-4503-9606-7a27dcde8080
  modified: 2026-09-27T17:00:00.000Z
---

On `/test-level` the sim is a `LoopbackRoom` driven by R3F `addEffect`, which reads its timestamp as
**milliseconds**. [[timed-taps]] passes `advance(t)` in **seconds**, so the sim steps
~1/1000 of the wanted time. Measured 2026-09-27 (#326, #328):

- **Step both:** `step = dt => { room.send('input', {inputs:[{seq: ++seq, throttle: 1, brake: 0, strafe: 0, jump: false}]}); T.fake += dt*1000; T.t += dt; room.step(dt); fiber.advance(T.t, true); }`.
- **Start `T.t` at `performance.now()`, never 0.** The loopback `addEffect` already saw a real ms
  timestamp (~6000). `advance(0)` hands it a −6 s frame, which drains the fixed-step accumulator:
  120 steps moved the sim one tick (#328).
- **Send an input every step.** Server ships step only on queued inputs. Under `frameloop 'never'` the
  page sends none, so the ship freezes (z and `tugTimer` fixed). Start `seq` at
  `lastProcessedInput + 100`.
- **Fire with `room.send('usePowerUp', { slot: 0, dir: 1 })`.** A Playwright KeyE under `frameloop 'never'`
  did not fire. The same key fires with the live loop (#324).
- **Spawn with `/test-level?start=x,z`, not a state write.** Writing `room.sim.state` x/z reached the
  decoded client in one run and not in the next three.
- **Draw counts:** an active scene VFX `InstancedMesh` adds **2** GL draws (main + rear-view pass).

**Why:** #326 showed the tug "not firing"; #328 showed a frozen ship. Both times the tap was wrong.

**How to apply:** use this recipe for any timed tap of a power on /test-level. First block is z 480 on
the default phrase seed. With a 240-frame full-throttle run-up (~119 u/s), `?start=-25.25,95` gives a
146u anchor gap and `-25.25,190` a 53u gap. Script: `pull-tap.mjs` in the #328 session scratchpad.
Related: [[stage-a-mine-on-test-level]], [[timed-taps]].
