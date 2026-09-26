# Cutlass v2 — curved hull, reduced geometry

Review draft responding to the owner's feedback: v1 was too flat and used too much geometry for the chase camera. V1 is preserved alongside this revision. No game runtime files were changed.

## Changes

- Taller, fuller rear with a curved longitudinal taper into a thinner, narrower nose. Armor remains faceted; cross sections now support the curved silhouette.
- 1,520 triangles, down from 12,268 (87.6% fewer).
- One glTF mesh with four material primitives, down from 23 meshes / 28 primitives. This means four material submissions per ordinary render pass; shadows and other passes can add work.
- Screws and vent slats moved from mesh geometry into procedural base-color and normal textures. Panel divisions, hull shape, engine openings, and boundary strips retain geometry.
- Graphite surface, broken marigold edge strips, and brighter twin engine cores retained.

## Deliverables

`cutlass.glb` is standalone with three embedded 1024 × 1024 PNG textures, also supplied under `textures/`. Base color uses sRGB; metallic/roughness and normal maps use linear data. The ORM image has roughness in green, metallic in blue, and neutral white in red. No ambient occlusion bake is supplied. UVs overlap and are not a unique paint atlas. Small top-deck details are procedural texture marks, not a high-poly bake.

`cutlass-hero.png`, `cutlass-side.png`, `cutlass-chase.png`, and `cutlass-top.png` show the actual exported GLB. `asset-info.json` records counts and bounds. `validation.json` records a clean Khronos glTF Validator result: zero errors, warnings, informational issues, or hints.

The model uses four materials: textured graphite, dark recesses, boundary emissives, engine emissives. `KHR_materials_emissive_strength` controls the emission multipliers; bloom belongs to the viewer or game. No rig, animation, plume, collider, or LODs are included. This reduces geometry and material submissions but is not a full-game performance benchmark. Texture compression and integration remain separate work.

## Coordinates and review

+Y up, -Z forward, metres. Dimensions: 1.901045 wide × .488011 high × 2 long. Bounds: X ±.950523; Y .019060 to .507071; Z -1.04 to .96. The original game Interceptor footprint was 2 × 1.84 units; reconcile the visual mesh and gameplay envelope before integration instead of silently stretching it.

The approved art remains the target, and this shape revision still needs owner visual review. Side view makes the rising rear and curved descent into the nose explicit. The source is `build.mjs`; regenerate from repository root with:

```sh
node docs/art-direction/vehicles/interceptor/model/v2/build.mjs
node docs/art-direction/vehicles/interceptor/model/v2/serve.mjs
```

Open http://127.0.0.1:19732 for the interactive viewer. The preview uses the repository's installed Three.js. The exported GLB has no dependency on this preview.
