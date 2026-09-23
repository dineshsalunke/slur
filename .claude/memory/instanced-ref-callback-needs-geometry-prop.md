---
name: instanced-ref-callback-needs-geometry-prop
description: An instancedMesh filled in a ref callback must take its geometry as a prop; a JSX geometry child attaches too late for computeBoundingSphere
metadata:
  node_type: memory
  type: feedback
  originSessionId: 00bb5dba-51a9-47aa-b8e3-50941b767246
  modified: 2026-09-23T14:41:41.146Z
---

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
