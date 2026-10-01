---
name: tag-frames-by-shader-program
description: "To find which multi-frame GPU pass spikes a frame, patch WebGL2 draw calls in an init script and tag each frame by the current program's unique uniform names"
metadata:
  node_type: memory
  type: reference
  originSessionId: 5ddf51c1-4098-47ba-9279-15a73ca23737
  modified: 2026-10-01T09:21:29.490Z
---

To attribute frame spikes to one pass of a staged GPU job (bake → refine → lens), patch
`WebGL2RenderingContext.prototype.drawArrays/drawElements` in a Playwright `addInitScript`. On each draw,
read `gl.getParameter(gl.CURRENT_PROGRAM)` and classify it once (cache in a WeakMap) by
`gl.getUniformLocation(p, '<uniform only that pass has>') !== null`. Append the tag to a per-frame string,
and log `[time, delta, draws, tags]` from a rAF loop that ends with `readPixels(0,0,1,1)` on the default
framebuffer (GPU sync). Launch with `--disable-gpu-vsync --disable-frame-rate-limit`, or every frame reads
16.7 ms.

**Why:** #399 (2026-10-01). Frame totals blamed "the bake". The tags showed that the bake bands cost +1–2 ms and
the refine bands crossing the disk cost +12 ms, so the fix was `REFINE_BANDS` 24 → 96, not the bake.
No repo edit or store handle was needed. The same patch counts draw calls per frame.

**How to apply:** any "N frames hitch" from a banded or progressive pass. To get an "off" baseline without a
URL toggle, stub the module with `page.route(/\/<file>\.tsx/, r => r.fulfill({ contentType:
'text/javascript', body: 'export function X() { return null; }' }))`. Drop runs where the off median jumps
(another GPU user). Related: [[headless-game-tabs-starve-the-gpu]], [[gpu-timing-without-repo-edits]],
[[preview-a-constant-by-route-rewrite]].
