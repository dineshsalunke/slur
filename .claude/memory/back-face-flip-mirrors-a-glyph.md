---
name: back-face-flip-mirrors-a-glyph
description: rotateY(PI) mirrors a flat glyph in x; a symmetric pair hides it from extent tests; capture geometry offline as SVG
metadata:
  node_type: memory
  type: project
  originSessionId: 9fdc4105-c818-4a88-a15f-70bf35062d55
  modified: 2026-09-29T04:45:31.915Z
---

To copy a flat `ShapeGeometry` glyph onto the back of an extruded body, `rotateY(PI)` maps x→−x. From behind,
the glyph then points against the body. This was issue #370 (boost pickup back-face chevrons, fixed 57f2bfe). If
the shape is symmetric in y, use `rotateX(PI)`: it keeps x, turns the normal to −z and keeps the winding valid.

**Why:** the bug hid from a bounding-box check. The boost pair sits symmetric about x=0, so the mirrored pair
has the same x-extent. Only an orientation test caught it: per face, the tip x must be greater than the arm-end x
(`boost-look.test.ts`).

**How to apply:** for any geometry that is duplicated per face, test direction, not extent. For a GPU-free
capture, project the real geometry's triangles to SVG in a node script run with `pnpm exec tsx` from
`apps/client`, rasterise it with `rsvg-convert`, and diff the before (the file from `git show HEAD:`) against
the after. Related: [[instanced-mesh-footguns]].
