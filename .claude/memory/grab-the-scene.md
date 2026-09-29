---
name: grab-the-scene
description: "Two no-repo-edit ways to reach the live three.js scene over CDP: set globalThis.__THREE_DEVTOOLS__ to an EventTarget and collect 'observe' events, or wrap Object3D.prototype.onBeforeRender since WebGLRenderer.prototype.render is bound in the constructor and a patch on it never fires"
metadata:
  node_type: memory
  type: reference
  originSessionId: 712f7c50-dc78-4945-ab8a-98e7c17e745e
  modified: 2026-09-29T04:06:39.777Z
---

### three devtools hook gives the scene

three dispatches an `observe` CustomEvent on `globalThis.__THREE_DEVTOOLS__` when it creates a Scene or a
WebGLRenderer. In a Playwright/CDP init script, set it to a `new EventTarget()` and keep each
`e.detail` that has `isScene`. Then traverse the scenes and set `visible = false` to bisect subsystems. It
replaces the perf-analysis skill's `StoreExpose` edit.

**Why:** on 2026-09-27 (perf lane) a diagnose-only brief forbade repo edits. This gave the subsystem
bisect anyway. /test-level had 46 scenes: the main one plus one per post pass and offscreen target.

**How to apply:** objects are unnamed, so toggle by `material.type` or object `type`. Hiding
`ShaderMaterial` also hides the post-pass quads. Pair it with the per-frame `readPixels` GPU wait
([[gpu-timing-without-repo-edits]]). The driver is in that session's scratchpad as `perf/gpu.mjs`.

### Hook onBeforeRender to grab the scene

three r185 `WebGLRenderer` assigns `render` in its constructor, so a patch on
`WebGLRenderer.prototype.render` never runs. To get the live scene in a headless tab, import the page's own
`/node_modules/.vite/deps/three.js?v=…` URL (read it from `performance.getEntriesByType('resource')`) and wrap
`Object3D.prototype.onBeforeRender`. Keep `this` when `this.isScene && this.children.length > 10` (this skips
the postprocessing quad scenes). Then you can add an `AmbientLight` in that tab only, with no repo edit, to read
wall textures that the default lighting leaves black.

**How to apply:** the script is gate-shoot.mjs (AMBIENT env) in the workerone scratchpad. See
[[tuning-over-cdp]] and [[headless-game-tabs-starve-the-gpu]].
