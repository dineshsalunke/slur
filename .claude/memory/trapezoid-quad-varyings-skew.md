---
name: trapezoid-quad-varyings-skew
description: A quad whose two ends have different widths bends any per-corner varying along its diagonal; pass world-space lateral offset instead
metadata:
  node_type: memory
  type: reference
  originSessionId: 14c7e25b-d982-4485-a906-7b1605564c80
  modified: 2026-09-29T03:12:31.573Z
---

A quad drawn as two triangles interpolates each varying affinely per triangle. If the quad is a
trapezoid (the far end wider than the near end), a corner-coded varying such as `position.x` = ±1 is
wrong inside it. Its 0-line bends toward the shared diagonal, so a profile built from it leans to one
side.

**Why:** #365 (2026-09-29). The deck streak quads in `deck-reflection.ts` widen with `Reflect.blur`.
The quad axis matched the seam to 0.01°, but the glow sat 4–8.5 px off it (default blur 1–7.7 px). At
grazing view it read as a wedge leaning right. It leaned less when close, because the length then
covers more screen.

**How to apply:** pass quantities that are affine in world space, such as `dot(world - base, side)`
and `dot(world - base, dir)`. Rebuild the width in the fragment shader. Perspective-correct
interpolation makes them exact. Measure it by rendering streaks on and off and taking the per-row
centroid against the projected axis. The driver is `probe4.mjs` in the #365 scratchpad. Related:
[[three-devtools-hook-gives-the-scene]], [[preview-a-constant-by-route-rewrite]].
