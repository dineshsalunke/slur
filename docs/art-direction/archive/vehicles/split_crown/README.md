# Split Crown — actual 3D prototype v1

[Download GLB](split-crown.glb) · [Chase render](chase.png) · [Top](top.png) · [Front](front.png) · [Rear](rear.png) · [Side](side.png)

This is a real 3D model built procedurally and retained as GLB, not image-generated geometry. All five PNGs render the same mesh with orthographic cameras. The selected Split Crown design is simplified into a first art prototype, not a final approved asset.

## Verified export

- Footprint: 2.5 units wide × 6 units long. Height approximately 1.003 units, an art proposal only.
- Y up; forward is -Z. Bottom at Y=0; footprint centered on X/Z.
- 2,616 triangles; six meshes grouped by material; GLB 257,784 bytes at initial validation.
- GLB exported and reloaded with Three.js GLTFLoader; dimensions preserved at 2.5 × 1.0025000584 × 6.
- Four stern emitters in a 2×2 arrangement; two forward crown ports; mirrored L roof lights.
- Six separately editable PBR material groups: coating, armor panels, bezels, recess interiors, marigold emission, engine cores.

No image textures are required in this version. Material colors, roughness and emission are embedded in GLB. This is a clean material pass, without authored wear maps or a production texture atlas. Emission does not imply bloom or spill lighting in the game. Preview lights, shadows and camera are not exported.

The model uses intersecting closed component solids, not a single watertight manufacturing mesh. Collision, firing behavior, engine effects, LODs, game-camera readability and runtime performance are not changed or certified. Claude retains game implementation ownership.

## Retained assets

The GLB retains six material-group meshes. Temporary model-generation code and preview tools were removed at the user's request. Only Markdown documents, images and models remain.

Concept boards are in [references](references/); the earlier generated Tripo views are in [tripo-reference](tripo-reference/README.md). Shared selection history and prompts are in [explorations](../explorations/README.md).

This prototype supersedes the independently generated orthographic images only for consistent geometry. It does not claim the visual finish of the concept paintings.
