---
name: share-instance-buffers-via-onbeforerender
description: "A second InstancedMesh can reuse another's instanceMatrix + instanced attributes with zero CPU; sync in onBeforeRender, dispose={null}"
metadata:
  node_type: memory
  type: reference
  originSessionId: 162a120d-8c06-4499-b620-a2b47447e348
  modified: 2026-09-28T17:55:53.421Z
---

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
