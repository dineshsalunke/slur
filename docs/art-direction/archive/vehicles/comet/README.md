# Comet — 3D blockout v1

Concept boards are in [references](references/). Shared selection history and prompts are in [explorations](../explorations/README.md).

[GLB](comet.glb) · [Chase](chase.png) · [Top](top.png) · [Front](front.png) · [Rear](rear.png) · [Side](side.png)

The exported GLB and rendered views are retained. Temporary model-generation code and preview tools were removed at the user's request. No game integration changes.

Verified export: 524 triangles, six material-group meshes, 56,740 bytes. Footprint 2.2 × 1.18 units (floating-point tolerance), proposed height 0.37. Y up, -Z forward, centered X/Z, minimum Y=0. Export was reloaded through GLTFLoader and bounds matched.

Central fuselage winding corrected after user identified inverted normals. All six upper face normals verified positive Y and all six lower face normals negative Y. Five views regenerated from the corrected single geometry.

Dark coating and emissive materials match Split Crown's prototype settings. No painted texture maps or authored wear in this blockout. Twin weapon ports, roof markers, exhausts and wingtip fins are art geometry, not new gameplay behavior. Six material batches preserve independent tuning. Thin fins use explicit faces on both sides; component solids intersect and are not a watertight manufacturing mesh.

This is basic blocking for review, not a finished or performance-certified game asset. Claude owns integration. All PNGs use orthographic cameras rendering the same mesh.
