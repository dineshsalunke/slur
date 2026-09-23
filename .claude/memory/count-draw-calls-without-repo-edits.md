---
name: count-draw-calls-without-repo-edits
description: Count WebGL draw calls and per-frame JS on any route by injecting a CDP hook into a headless tab; needs no FrameTap mount and no repo edit
metadata:
  node_type: memory
  type: reference
  originSessionId: c5f2a1f4-0494-49c6-9e5f-b4703209035f
  modified: 2026-09-23T20:09:44.471Z
---

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
([[headless-game-tabs-starve-the-gpu]]). See also [[headless-chrome-for-frame-taps]].
