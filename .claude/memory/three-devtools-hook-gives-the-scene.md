---
name: three-devtools-hook-gives-the-scene
description: "Get every three Scene and the renderer with no repo edit — set globalThis.__THREE_DEVTOOLS__ to an EventTarget in an init script and collect 'observe' events"
metadata:
  node_type: memory
  type: reference
  originSessionId: 94cd7a3d-e437-4b6a-a036-c236c1133564
  modified: 2026-09-27T13:55:51.590Z
---

three dispatches an `observe` CustomEvent on `globalThis.__THREE_DEVTOOLS__` when it creates a Scene or a
WebGLRenderer. In a Playwright/CDP init script, set it to a `new EventTarget()` and keep each
`e.detail` that has `isScene`. Then traverse the scenes and set `visible = false` to bisect subsystems. It
replaces the perf-analysis skill's `StoreExpose` edit.

**Why:** on 2026-09-27 (perf lane) a diagnose-only brief forbade repo edits. This gave the subsystem
bisect anyway. /test-level had 46 scenes: the main one plus one per post pass and offscreen target.

**How to apply:** objects are unnamed, so toggle by `material.type` or object `type`. Hiding
`ShaderMaterial` also hides the post-pass quads. Pair it with the per-frame `readPixels` GPU wait
([[count-draw-calls-without-repo-edits]]). The driver is in that session's scratchpad as `perf/gpu.mjs`.
