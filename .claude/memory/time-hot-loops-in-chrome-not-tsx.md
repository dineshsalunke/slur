---
name: time-hot-loops-in-chrome-not-tsx
description: "A CPU loop timed under node + tsx loader read 15x slower than in Chrome; time boot work in the page (stub imports, CPU throttle via CDP)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 1ea840a1-1373-4e5d-9475-cf31906f17b6
  modified: 2026-09-28T13:24:57.515Z
---

On 2026-09-28 (#344), `createNoiseVolume` took 1752 ms under `node --import tsx`, but 113 ms in Chrome.
I nearly reported the Node number as the landing freeze.

**Why:** the tsx loader path does not give production-like JIT timing for that loop. The cause was not
isolated.

**How to apply:** time boot work inside headless Chrome. Fetch the module source, stub its imports, and
inject it with `addScriptTag`. Scale with `Emulation.setCPUThrottlingRate` (4x, 6x). For the whole boot,
use a CDP `Profiler` on the prod bundle and map minified names by line and column. Related:
[[headless-game-tabs-starve-the-gpu]], [[count-draw-calls-without-repo-edits]].
