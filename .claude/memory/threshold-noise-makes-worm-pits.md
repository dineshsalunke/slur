---
name: threshold-noise-makes-worm-pits
description: "Thresholding smooth value noise makes worm/amoeba blotches, not round pits; use a Worley (jittered point) distance field"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 394284f6-85cc-45b9-90bf-94433610f378
  modified: 2026-09-25T06:02:44.659Z
---

To paint round pits procedurally, threshold a distance field to jittered points (Worley: one point per
cell, `size_i − distance`). The level sets are circles. Thresholding band-limited value noise gives
irregular worm and amoeba shapes. Even at 9 and 23 cells/u it read as corrosion blotches on the ship hull
(#258, 2026-09-25).

**Why:** the level sets of value noise are irregular curves. Only a point-distance field gives circles.

**How to apply:** keep the rest of the recipe: a tileable lattice (integer cells per tile), world-unit
sampling, and a quantile threshold for exact coverage. Add low-frequency noise to the field to cluster
the pits. See `apps/client/app/game/scene/pit-field.ts`. Related: [[cavity-channel-is-dead]].
