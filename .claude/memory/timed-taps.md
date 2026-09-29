---
name: timed-taps
description: "Shooting a VFX at exact ages over CDP: stop the R3F clock and step it with advance(t), step performance.now alongside it for anything not keyed off state.clock, and read the canvas back with toDataURL in the same task or the screenshot comes back black"
metadata:
  node_type: memory
  type: reference
  originSessionId: 1e4684a0-b2ae-44f1-bf3c-d2f37efaeb89
  modified: 2026-09-29T04:04:54.456Z
---

### Step the R3F clock for timed taps

Verified 2026-09-23 (#222 break sequence). A CDP screenshot cannot hit a chosen time on its own:
swiftshader frames take a variable time, and every `useFrame` VFX keys off `state.clock`. Stop the
loop and drive the clock yourself:

```
const f = await import('/node_modules/.vite/deps/@react-three_fiber.js?v=<hash>');
const store = f._roots.get(document.querySelector('canvas')).store;
store.getState().setFrameloop('never');
f.advance(store.getState().clock.elapsedTime + 1/60, true);
```

In `frameloop: 'never'`, `advance(t)` sets `clock.elapsedTime = t` (in seconds) and renders one frame.
`Page.captureScreenshot` then shows that frame. `setFrameloop('never')` resets the clock to 0. KeyP freeze
still toggles, because it is a DOM listener.

**Module URLs:** take the page's own URL from `performance.getEntriesByType('resource')`. When a module
has a `?t=` version, import that one. Another worker's edit HMRs your page (for example, `traits.ts`).
After that, a bare `/app/game/ecs/traits.ts` import is a second instance, and `queryFirst` returns
`undefined`. Same trap as [[tuning-over-cdp]].

**After your own HMR, relaunch Chrome.** After the `tuning-schema.ts` edit HMRed, the fractured
block rendered with no glow and the debris had no emissive. A fresh headless Chrome rendered it
correctly. A `location.reload()` did not fix it (inferred: stale HMR state).

Related: [[place-the-ship-over-cdp]], [[headless-game-tabs-starve-the-gpu]].

### Fake performance.now for timed taps

Stepping the R3F clock with `advance(t)` does not move anything that reads `performance.now()`. That
covers `ProjectileField`, `remoteInterpSystem` and the mine throw (`mine-shots.ts` `mineNow`). Verified
2026-09-25, #266.

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

### frameloop never screenshots black

With R3F stepped by hand, a CDP `Page.captureScreenshot` taken after `advance(t)` came back fully black
on every VFX frame. This was measured on 2026-09-26 in the #277 look check. The same tab screenshotted
normally while the frameloop was running.

Fix: in the same `Runtime.evaluate` that calls `advance()`, read `document.querySelector('canvas')`
into a 2D canvas with `drawImage` (crop and scale there if you like), and return `toDataURL('image/png')`.
The drawing buffer is still intact within that task.

**Why:** the canvas has no `preserveDrawingBuffer`. The capture happens after the compositor has
presented and cleared the buffer (inferred). Five black crops looked like "the effect did not render".

**How to apply:** use in-task readback for any hand-stepped tap. Always take one baseline frame
first, so that "black" or "empty" is known to be a capture problem, not the scene.
