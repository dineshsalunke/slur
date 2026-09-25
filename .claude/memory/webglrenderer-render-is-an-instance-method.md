---
name: webglrenderer-render-is-an-instance-method
description: "To grab the R3F scene over CDP, hook Object3D.prototype.onBeforeRender; a WebGLRenderer.prototype.render hook never fires"
metadata:
  node_type: memory
  type: reference
  originSessionId: 712f7c50-dc78-4945-ab8a-98e7c17e745e
  modified: 2026-09-25T16:04:48.817Z
---

three r185 `WebGLRenderer` assigns `render` in its constructor, so a patch on
`WebGLRenderer.prototype.render` never runs. To get the live scene in a headless tab, import the page's own
`/node_modules/.vite/deps/three.js?v=…` URL (read it from `performance.getEntriesByType('resource')`) and wrap
`Object3D.prototype.onBeforeRender`. Keep `this` when `this.isScene && this.children.length > 10` (this skips
the postprocessing quad scenes). Then you can add an `AmbientLight` in that tab only, with no repo edit, to read
wall textures that the default lighting leaves black.

**How to apply:** the script is gate-shoot.mjs (AMBIENT env) in the workerone scratchpad. See
[[drive-the-live-module-not-a-reload]] and [[headless-chrome-for-frame-taps]].
