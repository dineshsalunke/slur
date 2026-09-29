---
name: instanced-mesh-footguns
description: "Four InstancedMesh gotchas: fill it in a ref callback only with geometry passed as a prop, a second mesh can share another's instanceMatrix via onBeforeRender with dispose={null}, a raycast against a live instanced mesh needs its cached bounding sphere cleared first, and a scene traversal that skips InstancedMesh will wrongly clear a reported stray object"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 00bb5dba-51a9-47aa-b8e3-50941b767246
  modified: 2026-09-29T04:07:24.866Z
---

### Instanced ref fill needs a geometry prop

When an `<instancedMesh>` fills its matrices in a ref callback and calls `computeBoundingSphere()`,
pass the geometry as a `geometry={ … }` prop (a module-level constant). Never use a
`<boxGeometry />` child. The child attaches after the ref callback runs, so the sphere is computed
over an empty geometry.

**Why:** in #220 this was a suspect for the missing finish glow, and the fix went in with it
(`c36518a`). The glow still did not show until fog was ruled out
([[fog-hides-emissive-past-420u]]). So the culling effect is inferred, not measured.
`monolith-group.tsx` already uses the prop pattern.

**How to apply:** copy `MonolithGroup`'s pattern: a module-level geometry passed as a prop, and a
`useCallback` ref that fills and computes the bounds.

### Share instance buffers via onBeforeRender

To draw a second pass over an existing instanced set (e.g. #354 block-seam reflection streaks over the
sealed blocks), give the second `InstancedMesh` its own small geometry, add the source's
`InstancedBufferAttribute` objects to it with `setAttribute`, and in the mesh's `onBeforeRender` set
`mesh.count = src.count; mesh.instanceMatrix = src.instanceMatrix`.

Verified in three 0.185.1 source:
- `WebGLRenderer.renderObject` calls `object.onBeforeRender` right before the draw, so `count` is
  never a frame stale, whatever the `useFrame` order ([[useframe-order-is-subscribe-time]]).
- `WebGLBindingStates.needsUpdate` compares `object.instanceMatrix` by identity, so swapping it
  rebinds the VAO.
- `WebGLAttributes` keys on the attribute object, so a shared buffer uploads once per version.

Set `dispose={ null }` on the second mesh. `InstancedMesh.dispose()` makes `WebGLObjects` call
`attributes.remove( instanceMatrix )`, which would delete the SOURCE's GL buffer. Free the
geometry and material yourself in a ref-callback cleanup ([[r3f-disposes-only-the-object]]).

### Raycast instanced mesh: clear bounds

To measure drawn geometry on /test-level by raycast, import the page's three (the `deps/three.js`
resource URL, see [[zoom-the-chase-camera-over-cdp]]) and call `Raycaster.intersectObjects` on the
InstancedMesh. **First set `mesh.boundingSphere = null` and `mesh.boundingBox = null`.**

**Why:** on 2026-09-27 (#320) every ray at the portal gate missed. `InstancedMesh.raycast` culls
against a cached bounding sphere. The sphere was computed while `count` was 0 (empty), and
`commitInstances` does not clear it. After the reset, the same rays measured 5.94u.

**How to apply:** do this for any pooled instanced mesh (gates, pickups, shocks). Find the mesh by its
geometry bounding box, not by name ([[grab-the-scene]]). The same cull check means a ray that "misses"
proves nothing until the bounds are fresh. Driver: #320 scratch `hop-check.mjs`.

### Instanced meshes hide scene bugs

A glowing box at the ship spawn was reported across several sessions. Each time the assistant
concluded it was part of the ship and not a scene object, and the owner had to re-open it: *"this box
has been a problem since the start. last time i had waste ages with you to remove it. you never
agreed it was a mesh in the scene last time as well."* It **was** a scene object — 160 unparked
`InstancedMesh` instances stacked at the world origin (`track-blocks.tsx`, fixed 2026-09-21 with
`InstancedMesh.count`).

**Why the wrong answer kept winning:** every check that "proved" the ship's innocence was run on
evidence that structurally excluded the culprit. A `scene.traverse` filtered with
`if ( ! o.isMesh || o.isInstancedMesh ) return`; a GLTF node/material count that says nothing about
what the renderer draws; a bloom-off test that only rules out bloom. Absence of evidence from a
probe that cannot see the thing is not evidence of absence — and an owner repeating a sighting
across sessions is data, not noise.

**How to apply:** when a stray object is reported in an R3F scene, walk `instanceMatrix` per
instance (position + scale, watching for identity matrices and unparked tails) before concluding
anything, and prefer a probe the owner suggested — a pointer raycast hit-test settles it in one
call. Any allocated-but-unwritten instance renders at the origin at unit scale, so the spawn point
is where such bugs surface. State findings as "this probe would not have seen X" rather than
"X does not exist". See [[one-stack-dev-only]] for the other standing correction.
