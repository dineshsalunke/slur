---
name: module-gpu-caches-must-key-on-renderer
description: "A module-level cache of a render target or other GPU result must key on the WebGLRenderer — the landing canvas fills it, the next canvas gets a target never drawn in its context (#400: env black on /game)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 78abf5fb-f4e6-4550-936c-c2eaf73f98d9
  modified: 2026-10-01T09:29:57.681Z
---

A module-level cache that holds a GPU result (render target, PMREM output, baked texture) must include
the `WebGLRenderer` in its cache key. The app mounts several canvases in one page life: the landing
scene, then `/game` or `/test-level` after an in-app navigation. Each has its own GL context.

**Why:** #400 (f3a0d370). `env-band.state.ts` cached the banded env target by source/colour/intensity/
height. The landing canvas drew it; `/game` got a cache hit on a target its context never drew, so the
environment, the only light since #352/#364, was black. A direct load of the same route was lit, which
hid the bug from every `/test-level` check.

**How to apply:** when you write or review module state that holds GPU objects, key it on the renderer
and dispose plus rebuild on a change. To test a render bug, load the route **both** directly and via
`/` → `__reactRouterDataRouter.navigate(...)`. A CPU-side `DataTexture` (the HDRI itself) is safe:
each renderer uploads it. Related: [[headless-game-tabs-starve-the-gpu]].
