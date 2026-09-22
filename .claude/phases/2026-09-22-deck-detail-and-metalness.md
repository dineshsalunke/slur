# Deck detail, metalness map, and the measurement method

Branch `feat/test-level`. Continues `2026-09-22-lighting-rebuild.md`. Owner watched every step in a
live `/test-level` tab.

## The method that made this session work — keep it

Eyeball judgements sent the last two sessions in circles. This one measured instead. A Node PNG
decoder (built-in `zlib`, no deps, no Python) samples a grid of patches over the deck, discards warm
and blown patches, and reports three numbers: **deck luminance**, **local contrast** (sd of patch
luminance against its own row mean, which cancels the near/far falloff) and **b/r**.

The script lives in the session scratchpad and should be moved into the repo — it is the only reason
the session stopped guessing. Reference: `docs/art-direction/golden-reference/cruise-lighting.png`.

| | Reference | img3 (mid-session) | img5 (after detail) |
|---|---|---|---|
| Deck luminance | 29.3 | 40.0 | 25.1 |
| Local contrast | 23.7% | 9.0% | 12.0% |
| b/r | 1.18 | 1.33 | 1.28 |

**The finding that reordered the session: the deck was never too dark.** It was 37% *brighter* than
the reference and carried a quarter of its local contrast. The owner's "too dark" was "too flat". I
took it literally first and pushed `IBL_INTENSITY` 6 → 10, which moved us away from the reference on
the one axis we could measure. Measure before turning a knob, not after.

## As built

### Lighting — `game/scene/gradient-ibl.tsx`

- Bands warmed toward the reference's b/r 1.18: `IBL_ZENITH #42484e` · `IBL_HORIZON #303439` ·
  `IBL_NADIR #1e2023`. The old gradient ran zenith:nadir ~8:1; it is now ~2.3:1.
- **Lifting the nadir, not the gain, is what fixed the silhouetting.** `environmentIntensity` is a
  single scalar over the whole map, so it cannot change a ratio — and the monolith-vs-deck ratio was
  the complaint. Vertical faces integrate a hemisphere straddling zenith and nadir; a near-black
  nadir starves them.
- `IBL_INTENSITY` ended at **4**, down from the mid-session 10, once the rail emitter became the key.
  Fill is what destroys contrast.

### Monoliths — `game/scene/monolith-config.ts`

`GRAPHITE_SURFACE` metalness `0.3 → 0`, roughness `0.62 → 0.78`. Now compliant with `ART_MATERIALS.md`
§M3 (*"Metalness 0.0 | Roughness 0.75 – 0.90"*). The 0.3/0.62 was undocumented drift, and restoring the
diffuse term is most of why they stopped reading as silhouettes.

### Rail emitter — it was already built

`RAIL_EMITTER_INTENSITY` 0 → **60**. The previous handover deferred this behind "the rail profile", but
`emitter-array.ts` is complete and `track-floor.tsx:59` already writes rail segments into the uniform
array every frame. It was only zeroed. Turning it on was one constant and it is the single biggest
visual gain of the session — the warm streaks down the deck are the main thing separating our frame
from the reference.

### Deck texture — `game/scene/track-texture.ts`

Three new paint passes, all elongated along texture-y (down-track):

- `paintMottle` → albedo. Broad soft value blobs, ±16%, 3.5:1 stretch. Drawn after the plates and
  before the joints so joints stay crisp.
- `paintBrush` → roughness. ~220 thin strokes, ±0.05–0.14, up to 75:1 stretch. Roughness variation is
  what breaks a rake light into streaks; normal alone will not do it.
- `paintNormalBrush` → normal. Same strokes at a shallow tilt.
- `PLATE_VALUE_JITTER` 0.04 → 0.10.

### Metalness map — packed ORM

Verified in `three@0.185.1` source this session:

- `ShaderChunk/roughnessmap_fragment.glsl.js` — *"reads channel G, compatible with a combined
  OcclusionRoughnessMetallic (RGB) texture"*, `roughnessFactor *= texelRoughness.g`
- `ShaderChunk/metalnessmap_fragment.glsl.js` — `metalnessFactor *= texelMetalness.b`

Two consequences that constrain the design:

1. Both maps **multiply** the material scalar, so `metalnessMap` can only pull metalness *down*.
   **`FLOOR_METALNESS` must stay 1 and the map must carry all the variation.** Dropping the scalar
   again would cap the map's reach.
2. The trap avoided: our roughness canvas is greyscale, so handing it to `metalnessMap` unchanged
   would have set metalness equal to roughness — making rough patches *more* metallic, the exact
   inverse of the intent.

`packedSurfaceCanvas()` composites two offscreen canvases into one texture (G = roughness,
B = metalness) via `getImageData`/`putImageData`; the same `CanvasTexture` is assigned to both
`roughnessMap` and `metalnessMap`. `paintFinishPatches` was refactored to draw from a shared
`finishPatchPlan()` so the coating is rougher **and** less metallic in the same places, rather than
two independent random fields. RNG consumption order is unchanged, so the existing roughness look is
preserved exactly. Joints go to `METAL_JOINT = 0.3`; rougher finish patches to 0.35–0.7.

### Joints — width and groove flare

Owner: *"grooves are still picking up the light, also i feel we should try to increase the groove
width a bit."*

- `JOINT_U` 0.1 → **0.25**. This is not a departure but a **correction**: `ART_MATERIALS.md` §M1 gives
  *"Joint width | **0.2 – 0.8u** (5 – 20% of the 4u tile), start at the top and dial down"*, and 0.1
  was half the bottom of that band. There is room to go wider.
- New joint pass at the end of `paintRoughness`, `JOINT_ROUGHER = 0.16` — groove interiors now sit at
  roughness ~0.96 against the plate's 0.8. Drawn **last** so the brush strokes do not erode it.
  Before this, `paintRoughness` never touched the joints at all: grooves had the same roughness as
  the plate face, which is why they flared. Metalness alone could not fix it — metalness governs
  specular colour, roughness governs highlight spread.
- **Not yet tried, and the next lever if they still flare:** `WALL_TILT = 0.75` in `paintNormal` is a
  steep groove wall. At grazing angles a steep wall catches the emitter regardless of roughness. That
  cause is geometric, not material.
- Unmeasured at handover — owner had not reloaded.

## Open at handover

- **Contrast is still the gap: 12.0% against the reference's 23.7%.** The metalness map has not been
  measured yet — the owner had not reloaded when the session ended. Re-measure before turning any
  other knob. If it is still short, raise `BRUSH_ROUGHER_MAX` (0.14) and `BRUSH_STROKES` (220) from
  evidence rather than pre-emptively.
- **b/r is still 1.28 against 1.18.** Neither input is that blue — albedo `BASE` is 1.20, the IBL
  bands are 1.18 — so the excess comes out of the specular path and ACES. Not worth chasing until
  the material settles.
- **Owner asked for a debug panel** for metalness, roughness and emitter strength, and it is the right
  next step: every remaining question is a live-tuning question. **This is a CLAUDE.md #13 mechanism
  decision** — where the state lives and how a slider reaches a material without re-rendering the
  scene — so it needs the ≥5-option weighing in the PR body. Candidates worth including: leva (check
  whether it is already a dep), a plain DOM overlay outside the Canvas writing to a module singleton
  that `useFrame` reads, koota trait + `useFrame`, R3F `addEffect`, drei `<Html>`. Note the
  memoisation problem below — a slider that changes a *texture* constant needs the cache invalidated,
  not just a uniform set.
- **`trackSurfaceMaps()` memoises into a module-level `cached`**, so HMR does not regenerate the
  canvases. Every texture change this session needed a hard reload. A debug panel touching texture
  constants must expose a rebuild.
- **Dotted/dashed artifact along the joints** near the rails, visible in the owner's img5 — most
  likely the joint normal walls (`WALL_TILT 0.75`, half-width 3.2px) aliasing at grazing angles.
  Unconfirmed, not investigated.
- **`track-texture.ts` is now ~430 lines** against biome's 300 soft cap. Warning only, exit 0, but it
  wants splitting; the detail passes are the natural module to lift out. Deferred deliberately to keep
  the owner's visual iteration unblocked.
- **`ART_MATERIALS.md` §7 owes four decisions-and-departures entries** and has none:
  - Deck metalness — §M1 says 1.0; currently 1.0, but arrived at via an owner-requested test, not a
    settled decision. The 0.7 from the previous session is also still unwritten.
  - Plate aspect — owner decided **4u × 4u** against §M1's *"4u × 16u plates in straight bond …
    elongated down-track"*. The code already shipped 4u × 4u, so this is a doc-only change.
  - Monolith metalness/roughness — now compliant, but the drift should be recorded.
  - IBL band colours.
- **Still stripped from the previous handover's revert table:** bloom + composer, fog, and the sim
  freeze on `P`. **No emissive value is trustworthy until bloom is back** — the reference gets its hot
  saturated marigold from tone-mapped material + high `emissiveIntensity` + bloom.
- **`finish-gate.tsx` uses `emissive="#39ff14"` with `toneMapped={ false }`**, so it bypasses ACES and
  ignores every global lighting change. It reads as a flat green sticker and gets louder relative to
  everything as the world comes up. Off-palette for a marigold-primary scheme. Owner flagged the
  question; no decision taken.
- **Raising the IBL washes the rails.** `BOUNDARY_SURFACE.color` is `#15171a`, a near-black base that
  still takes environment light, so rig brightness desaturates the marigold toward pale yellow. Judge
  rail colour with bloom on and let `emissiveIntensity` carry it.
