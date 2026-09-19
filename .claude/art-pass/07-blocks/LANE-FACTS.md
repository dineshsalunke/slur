# `art/block` — LANE FACTS

Raw first-hand facts, one line each, committed with the code they describe. Never written at handover time.
`[unmeasured]` is a legitimate entry — a reading that cannot be sourced first-hand is not reconstructed here.

Format: `YYYY-MM-DD · <fact> · <how it was established>`

---

## Installed-stack facts (three 0.185.1, read from source)

- 2026-09-19 · `meshphysical.glsl.js` orders the chunks `<color_fragment>` 172 → `<roughnessmap_fragment>` 176
  → `<metalnessmap_fragment>` 177 → `<normal_fragment_begin>` 178 → `<emissivemap_fragment>` 182 · read from
  `node_modules/.pnpm/three@0.185.1/.../ShaderLib/meshphysical.glsl.js`
- 2026-09-19 · `<roughnessmap_fragment>` declares `float roughnessFactor = roughness;` — seeded from three's
  own `roughness` uniform, i.e. from `material.roughness` · read from `ShaderChunk/roughnessmap_fragment.glsl.js`
- 2026-09-19 · three clamps roughness at BOTH ends itself: `max( roughnessFactor, 0.0525 )` then
  `min( …, 1.0 )` after adding `geometryRoughness` · `ShaderChunk/lights_physical_fragment.glsl.js` 10-12 ·
  consequence: a perturbation of `roughnessFactor` cannot produce an invalid roughness, so no clamp is needed
  in lane code

## Cross-lane facts

- 2026-09-19 · `art/track` (HEAD `441a2d9`) `track-materials.ts` defines `FLOOR_SURFACE`, `LETHAL_SURFACE`,
  `DRAG_SURFACE`, `RAIL_SURFACE` and **none carries a `roughness` key** — `art/track` owns no roughness at
  all · read first-hand by the supervisor, recorded in `SESSION-9-ADDENDUM.md` §14
- 2026-09-19 · consequence for integration, NOT for now: in-game blocks render through
  `LETHAL_SURFACE`/`DRAG_SURFACE` → three's default roughness **1.0**, while the sealed block is **0.55**.
  Whoever merges task 7 into `track-blocks.tsx` must carry the roughness across or it reads as a regression.

## Measured render facts

- 2026-09-19 · the block renders **~85-90% NON-DIFFUSE** · `diffuseColor.rgb = vec3(0.0)` moved the lit face
  at y=420 only from **48-65** to **45-57** · measured by `block-49` with `ffmpeg` + `od`, not eyeballed
- 2026-09-19 · consequence: `SPLIT_DARKEN 0.55` moves a pixel ~5% ≈ **3 sRGB levels, inside JPEG noise**;
  same for `CREASE_DARKEN` and the whole `DETAIL_ALBEDO` field. Nothing is broken — everything is diluted.
- 2026-09-19 · `FRAME_SIZE = span*0.65` frames all three footprints unclipped: in a 1492px capture the panel
  ends x=259, leftmost block starts x=430 (171px clear), rightmost ends x=1130, tops y=262, bottoms y=690
- 2026-09-19 · `[unmeasured]` whether the interior corner improved under `CHAMFER_GAMMA 2.2` + the crease —
  no clean read was ever taken
- 2026-09-19 · `[unmeasured]` everything in `e7ca605` and everything in this session's commits. **The
  roughness finish has never been seen.** Chrome freeze is on; the frame slot is the supervisor's to schedule.

## Latent-bug facts

- 2026-09-19 · the `fwidth` fade gates compare a **HALF**-width against a **FULL**-pixel footprint:
  `smoothstep( worldPerPixel*1.5, worldPerPixel*4.0, uSplitHalfWidth )` demands a line be ~8 device px before
  it passes, and starts fading one still covering 5 · `uCreaseHalfWidth` carries the identical mismatch ·
  `blockFbm`'s octave gate does NOT (its `size` is a feature size, not a half-width)
- 2026-09-19 · fixing it has **no visible effect today**, because of the 85-90% non-diffuse fact above ·
  built, served and measured by `block-49` before this session

## Authoring gotchas (paid for first-hand)

- 2026-09-19 · **No backticks in GLSL comments.** The shader blocks are TS template literals, so a backtick
  inside a `// …` GLSL comment terminates the literal. Surfaces as `error TS1005: ',' expected` pointing at
  the comment line, not as anything shader-shaped · hit while commenting the fade-gate unit fix
