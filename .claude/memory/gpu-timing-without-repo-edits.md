---
name: gpu-timing-without-repo-edits
description: "Three no-repo-edit CDP timing techniques: wrap WebGL draw calls and rAF to count draw calls and JS time per frame, hijack the page's live EffectComposer to time and prove a prototype post effect, and bracket a GPU job with a 1-pixel readPixels because gl.finish() does not sync under headless Chrome's Metal ANGLE backend"
metadata:
  node_type: memory
  type: reference
  originSessionId: 71083242-33b1-4d25-ab6b-f4744745c01d
  modified: 2026-09-29T04:08:21.334Z
---

### Count draw calls without repo edits

To get draw calls and JS time per frame on a route that has no `FrameTap` (the main menu, a game room),
inject a hook with CDP `Page.addScriptToEvaluateOnNewDocument` before navigating. The hook wraps
`drawElements` / `drawArrays` / `*Instanced` on both `WebGLRenderingContext.prototype` and
`WebGL2RenderingContext.prototype`, and wraps `requestAnimationFrame` to count and time each callback.
Read the frames back with `Runtime.evaluate` after about 15 s of warmup. Node 24 has a global
`WebSocket`, so the driver is a plain `.mjs` with no dependencies.

Readings on 2026-09-23: the menu (`/`) drew 13 calls at 0.30 ms JS median; `/test-level` (full
`WorldScene`) drew 116 at 1.1 ms.

**Why:** the only frame-tap mount is in `TestLevelCanvas`, and adding one to another route means editing
files other workers may hold.

**How to apply:** draw counts are exact. The ms figure is JS/CPU only: SwiftShader has no GPU, so it is
not fps. Launch Chrome with `--force-device-scale-factor=1 --mute-audio` and kill it after the sample
([[headless-game-tabs-starve-the-gpu]]).

### Time a post effect without repo edits

To cost a new post effect before building it, with no repo edits and no StoreExpose mount:

1. In the page, find the dep URLs: `performance.getEntriesByType('resource')`, and match `/deps/postprocessing.js`
   and `/deps/three.js`. Import those exact URLs, because a different URL gives a second module instance
   ([[tuning-over-cdp]]).
2. Wrap `pp.EffectComposer.prototype.render` once to capture `this` (the live composer), then restore it.
3. `pass = composer.passes.find(p => p instanceof pp.EffectPass)`, then
   `pass.setEffects([myEffect, ...pass.effects]); pass.recompile()`. `setEffects` is `protected` only in the
   `.d.ts`.
4. The frame meter can use `document.querySelector('canvas').getContext('webgl2')`, which returns the live
   context.

**Always screenshot once.** A run showed `useProgram: program not valid`, and until a frame proved the
effect was drawn, the timings could have measured a broken pass. Those errors came at `browser.close()`
teardown, not from the effect.

Script: the #269 lane's scratch `blur-perf.mjs` (2026-09-26). A radial blur at 8–16 taps was below noise at
DPR 1. Related: [[headless-game-tabs-starve-the-gpu]].

### gl.finish does not sync on headless Metal

To time a GPU job over CDP (a PMREM rebake, a fullscreen pass), do not bracket it with `gl.finish()`.
In headless Chrome with `--use-angle=metal`, finish-bracketed PMREM `fromEquirectangular` on a 1024×512
HDRI read 0.1 ms. The same call bracketed by `gl.readPixels(0, 0, 1, 1, RGBA, UNSIGNED_BYTE, px)` read
0.5–0.7 ms (#356, 2026-09-29).

**Why:** a readPixels must wait for every queued command, so it forces a real sync. `finish()` under ANGLE
is not guaranteed to block.

**How to apply:** wrap the prototype method (`PMREMGenerator.prototype.fromEquirectangular`,
`FullScreenQuad.prototype.render`) from the page's own dep URL (as above), with a readPixels before and
after. Discard the first call: it includes the shader compile (~90 ms). Script: the #356 lane's scratch
`band-sync.mjs`.
