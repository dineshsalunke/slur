# Cutlass v3 — tapered cross sections

Review draft, 2026-09-26. Responds to the owner's annotated close-ups: the centre fuselage has a narrower top with broad angled shoulders, the outer hull has a sloping shoulder, and engine housings sit within the fuller hull with subtle height differences. Previous versions are preserved. No game runtime files were modified.

Changes from v2:
- Reduced centre-spine height and introduced a trapezoidal cross section with a top approximately 74% of its base width.
- Raised surrounding armor and sloped its outer region toward the boundary light strips.
- Lowered and sloped engine service covers, leaving recessed channels around them and the small marker lights.
- Made engine mouths wider and lower, retaining inset throats and three glowing bars per engine.
- Added a solid chamfered centre tail cap.

The standalone `cutlass.glb` contains 1,450 triangles, one mesh, four material primitives, and three embedded 1024-square PBR maps. Separate texture PNGs are under `textures/`. `asset-info.json` has exact counts and bounds. `validation.json` records zero errors, warnings, or informational issues from the Khronos glTF Validator. Screenshots show the exported model, not concept renders.

Coordinates: +Y up, -Z forward. Dimensions approximately 1.901 × .413 × 2 metres (width × height × length). The mesh is still a visual review draft, not a drop-in gameplay asset: reconcile its footprint with the game's Interceptor envelope before integration. There is no collider, rig, LOD, or engine plume. Actual game performance has not been benchmarked.

Textures are procedural, with overlapping planar UVs. Screws and vents are texture marks. ORM red is neutral white (no baked AO), green is roughness, blue is metallic. Normal data is tangent-space. Separate boundary and engine emissives use `KHR_materials_emissive_strength`; bloom is a viewer effect. Preserve materials during integration.

Rebuild from repository root with `node docs/art-direction/vehicles/interceptor/model/v3/build.mjs`. Run the local viewer with `node docs/art-direction/vehicles/interceptor/model/v3/serve.mjs` and open http://127.0.0.1:19733. The viewer uses the repository's installed Three.js; the GLB is independent of it.
