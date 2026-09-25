---
name: fake-performance-now-for-timed-taps
description: "VFX keyed off performance.now (bolts, remote interp, mine throws) ignore advance(t); override performance.now in the page and step both clocks together"
metadata:
  node_type: memory
  type: reference
  originSessionId: fd62b1ef-b92f-4192-8d53-06de4965e978
  modified: 2026-09-25T14:35:23.947Z
---

Stepping the R3F clock with `advance(t)` ([[step-the-r3f-clock-for-timed-taps]]) does not move anything that
reads `performance.now()`. That covers `ProjectileField`, `remoteInterpSystem` and the mine throw
(`mine-shots.ts` `mineNow`). Verified 2026-09-25, #266.

Over CDP, replace the clock and step both together:

```
T.fake = performance.now(); performance.now = () => T.fake;
store.getState().setFrameloop('never');
step = (dt) => { T.fake += dt * 1000; T.t += dt; fiber.advance(T.t, true); };
```

The sim and local combat run inside `advance`. So a real `queueFire(slot, dir)` then `step(1/60)` fires at a known
fake time, and later screenshots hit exact ages. To locate a small far target, project it with
`store.getState().camera` and crop there. A diff against a no-fire run at the same pose separates it from the
scene. ffmpeg `blend=difference` on PNGs comes out green (YUV); side-by-side crops read better.

Scratch driver: `mine-tap.mjs` in the #266 session scratchpad (gone after the session; rebuild from above).
