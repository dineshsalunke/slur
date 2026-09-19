# 26 — Non-destructible blocks: procedural variation draft

Status: draft for visual review. Art direction only; Claude owns development.

[View draft board](26_non_destructible_blocks_DRAFT.png)

## Accepted direction from this conversation

- Three-quarter asset views are presentation angles, not instructions to rotate blocks on the track.
- Keep sealed rectangular forms, restrained bevels, constant 8u height and variable width/depth.
- Vary vertical seam placement; multiple seams are allowed. Preserve broad uninterrupted dark face areas. Remove the earlier top-face luminous return.
- Add restrained coating unevenness, sparse shallow scuffs/scratches and rubbed edges. Wear must preserve the sealed silhouette and must not imply destructibility.
- Prefer procedural models and materials with repeatable seeded variation and minimal per-instance authoring.

## Art controls for procedural generation

These are visual controls, not an implementation/API contract:

| Control | Visual constraint |
|---|---|
| Width and depth | Variable rectangular footprint; height stays 8u |
| Seam count and position | Sparse vertical inserts with generous dark spacing; illustrated counts are examples, not a gameplay limit |
| Seam treatment | Narrow engineered light insert, localized marigold glow; no cracks or exposed internal core |
| Coating variation | Broad low-contrast changes in sheen and tone; near-black coated metal throughout |
| Scuff placement, size and strength | Sparse irregular patches, with most of each face left quiet |
| Edge wear | Restrained rubbed finish; no broken contour or bright silver outlining |
| Seed | Repeatable combinations within the same family; avoid identical repeated wear marks |

Use a shared form/material vocabulary rather than individually painted blocks. The image proposes appearance; generation technique and performance choices remain with development. It does not establish numeric shader settings or new collision dimensions.

## Review boundaries

Coated metal must remain distinguishable from stone and the bare graphite deck. Keep deep darks, faint desaturated slate-blue surroundings and localized marigold energy from approved board 17. No saturated blue or lifted material values from rejected board 15.

Front-on same-form examples isolate variation in seam placement and wear. Generated views are illustrative, not measured geometry. A checked orthographic sheet, actual footprint dimensions, 4u scale comparison and moving gameplay readability remain outside this draft's evidence.

## Generation

Visual audit: the lineup now presents comparable-height instances with one, two and three vertical seams. Wear is visible without breaking the silhouette. The generator retained small warm top-edge returns in the hero and seam closeup despite the prompt; these are not accepted seam geometry. The closeup scratches are denser than the intended sparse wear and should be reduced if this treatment is taken forward. “Different seeds” illustrates the desired result; these are generated paintings, not outputs from a working procedural asset system.

Built-in image generation; board 25 supplied as the revision reference, carrying forward board 17's visual direction. Exact prompt: [26_non_destructible_blocks_PROMPT.txt](26_non_destructible_blocks_PROMPT.txt).
