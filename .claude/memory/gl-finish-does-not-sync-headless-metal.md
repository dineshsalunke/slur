---
name: gl-finish-does-not-sync-headless-metal
description: In headless Chrome (ANGLE/Metal) gl.finish() returns before the GPU is done; bracket a GPU timing with a 1-pixel readPixels instead
metadata:
  node_type: memory
  type: reference
  originSessionId: 71083242-33b1-4d25-ab6b-f4744745c01d
  modified: 2026-09-29T02:35:46.465Z
---

To time a GPU job over CDP (a PMREM rebake, a fullscreen pass), do not bracket it with `gl.finish()`.
In headless Chrome with `--use-angle=metal`, finish-bracketed PMREM `fromEquirectangular` on a 1024×512
HDRI read 0.1 ms. The same call bracketed by `gl.readPixels(0, 0, 1, 1, RGBA, UNSIGNED_BYTE, px)` read
0.5–0.7 ms (#356, 2026-09-29).

**Why:** a readPixels must wait for every queued command, so it forces a real sync. `finish()` under ANGLE
is not guaranteed to block.

**How to apply:** wrap the prototype method (`PMREMGenerator.prototype.fromEquirectangular`,
`FullScreenQuad.prototype.render`) from the page's own dep URL
([[time-a-post-effect-without-repo-edits]]), with a readPixels before and after. Discard the first
call: it includes the shader compile (~90 ms). Script: the #356 lane's scratch `band-sync.mjs`.
