---
name: r3f-disposes-only-the-object
description: "R3F 9.7 unmount disposes the object itself, never geometry/material props or primitives; free them from a React 19 ref-callback cleanup"
metadata:
  node_type: memory
  type: project
  originSessionId: af785d7c-2bb0-46b5-bd50-06952f64e59f
  modified: 2026-09-26T08:13:21.102Z
---

R3F 9.7.0 `removeChild` calls `dispose()` on the removed object only. It never disposes a
`geometry={…}` / `material={…}` prop, and it never disposes a `<primitive>`. `InstancedMesh.dispose()`
(three 0.185) does not dispose its geometry. Declarative children (`<meshStandardMaterial>`,
`<shaderMaterial args>`) are disposed. drei `Clone deep="materialsOnly"` clones materials that nobody
frees. drei 10.7.8 `useFBO` keeps one target per mount and resizes it in place.

**Why:** #275 found leaks in TrackBlocks geometries, the rear-view `<primitive>` material and ShipModel
clone materials (fed4ac2, c2b9ac4, 5ded0a4).

**How to apply:** for GPU resources you build in `useMemo`, prefer a declarative child. Otherwise use
a stable `useCallback` ref that returns a cleanup which disposes them. That needs no `useEffect`
(NN-8). Dispose only what the mount owns, never shared textures.
