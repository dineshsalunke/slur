---
name: fake-a-gamepad-over-cdp
description: "Drive the gamepad path in headless Chrome: stub navigator.getGamepads in an init script, dispatch a plain gamepadconnected Event, and wrap rAF to number frames for per-frame latency counts"
metadata:
  node_type: memory
  type: reference
  originSessionId: 485b98d3-0373-4ec2-8ad3-bf4895f9ab2c
  modified: 2026-09-29T11:46:47.830Z
---

Headless Chrome has no gamepad. To test `game/input/gamepad.ts` (#387, 2026-09-29):

1. In a Playwright init script, build a pad object
   `{ index: 0, connected: true, axes: [0,0,0,0], buttons: 17 × { pressed, value } }` and set
   `navigator.getGamepads = () => [ pad ]`.
2. After load, dispatch `new Event('gamepadconnected')` with
   `Object.defineProperty(e, 'gamepad', { value: pad })`. The `GamepadEvent` constructor rejects a
   fake pad. Without this event `pollGamepads` returns early.
3. Wrap `requestAnimationFrame` in the same init script. Count a frame when the timestamp changes,
   run "pre" hooks before the callback (press a button on frame N) and "post" hooks after it (read
   `Sim` through [[koota-universe-reaches-the-page-world]]). Latency = first frame the state moves − N.

Measured on /test-level: pad A → local predicted jump 0 frames; → loopback server jump 4 frames
(the input send runs every 2 ticks). Buttons: A = 0, LT = 6, RT = 7.

The driver is `s17-measure.mjs` in the #387 session scratchpad. Kill the Chrome after
([[headless-game-tabs-starve-the-gpu]]).
