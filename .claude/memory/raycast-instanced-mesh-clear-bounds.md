---
name: raycast-instanced-mesh-clear-bounds
description: Raycasting a live InstancedMesh over CDP returns nothing if its boundingSphere was cached at count 0; null boundingSphere/boundingBox first
metadata:
  node_type: memory
  type: reference
  originSessionId: 82919a87-fad1-40f2-8558-7d99b202ae62
  modified: 2026-09-27T14:30:22.893Z
---

To measure drawn geometry on /test-level by raycast, import the page's three (the `deps/three.js`
resource URL, see [[zoom-the-chase-camera-over-cdp]]) and call `Raycaster.intersectObjects` on the
InstancedMesh. **First set `mesh.boundingSphere = null` and `mesh.boundingBox = null`.**

**Why:** on 2026-09-27 (#320) every ray at the portal gate missed. `InstancedMesh.raycast` culls
against a cached bounding sphere. The sphere was computed while `count` was 0 (empty), and
`commitInstances` does not clear it. After the reset, the same rays measured 5.94u.

**How to apply:** do this for any pooled instanced mesh (gates, pickups, shocks). Find the mesh by its
geometry bounding box, not by name ([[three-devtools-hook-gives-the-scene]]). The same cull check means
a ray that "misses" proves nothing until the bounds are fresh. Driver: #320 scratch `hop-check.mjs`.
