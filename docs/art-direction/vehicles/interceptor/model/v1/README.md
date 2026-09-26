# Cutlass — first modeled asset

Status: review draft, built 2026-09-25. The approved silhouette/material artwork remains the authority; this asset is a modeled interpretation, not an approved replacement. No game runtime files were changed.

## Deliverables

- `cutlass.glb`: standalone binary glTF with all three textures embedded.
- `textures/`: separate 1024 × 1024 procedural base-color, metallic/roughness, and tangent-space normal PNGs.
- `cutlass-hero.png`, `cutlass-chase.png`, `cutlass-top.png`, `cutlass-underside.png`: screenshots of this exported GLB.
- `asset-info.json`: mesh counts and bounds.
- `validation.json`: Khronos glTF Validator result, zero errors, warnings, or informational issues.
- `build.mjs`: reproducible native Node mesh/texture/export source.
- `preview.html` and `serve.mjs`: local orbit viewer with camera and lighting controls; uses this repository's installed Three.js.

## Model and materials

12,268 triangles, 23 named component meshes, 28 material primitives, seven materials. Geometry includes clipped wedge hull, central spine, segmented shoulders, louvers, fasteners, two engine mouths, and interrupted boundary light strips. No propulsion plume is included.

Graphite textures are procedural, not sampled from the artboard. The base-color map is sRGB; normal and metallic/roughness data are linear. The ORM image uses green for roughness, blue for metallic, and neutral white in red. There is no baked ambient occlusion. UVs use overlapping planar projections suitable for the shared surface texture, not a unique paint atlas. Underside treatment is simple. This is not a retopologized or LOD asset.

Boundary seams and engine bars use separate emissive materials with `KHR_materials_emissive_strength`. Bloom is a viewer effect and is not stored in the model. Preserve these materials during integration; runtime material replacement could remove the treatment.

## Coordinates and integration

Metres; +Y up, -Z forward. Bounds: X -1 to 1; Y .003 to .269641; Z -1.04 to .96. Dimensions: 2 m wide × .266641 m high × 2 m long. Origin is near underside center.

The existing game Interceptor footprint is 2 × 1.84 units. This draft is therefore not a drop-in fit. Reconcile the artwork and gameplay envelope before integration; nonuniform scaling would change the approved proportions. No collider, rig, animation, LODs, or gameplay metadata is provided.

The artistic review still needs to establish fidelity to the approved board: overall proportions, panel topology, wear density, and glow color/intensity under the game's actual lighting. File validation establishes glTF correctness, not that artistic approval or runtime performance is complete.

## Rebuild and preview

From repository root:

```sh
node docs/art-direction/vehicles/interceptor/model/v1/build.mjs
node docs/art-direction/vehicles/interceptor/model/v1/serve.mjs
```

Open http://127.0.0.1:19731. GLB can also be imported independently into a glTF-capable DCC or viewer.

References: `../../concept-sheet.png` for shape and `../../../fleet/cutlass-graphite-seams.png` for the finalized graphite and boundary-seam treatment.
