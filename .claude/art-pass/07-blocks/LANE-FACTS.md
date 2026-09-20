# LANE FACTS — sealed block (#164)

Raw first-hand facts only. Measurements carry units; claims carry `file:line`. `[unmeasured]` is a valid
entry. The supervisor writes the prose; this file is the numbers.

## Lane

- 2026-09-20 — worktree `/Users/apple/Projects/personal/slur-worktrees/sealed-block`, branch
  `art/sealed-block`, base `origin/dev` @ `cf1c98c`.
- Ports 5204 (client) / 2604 (server). Nothing was listening on either before launch (`lsof -nP -iTCP:<p>
  -sTCP:LISTEN` → empty for both).
- `.claude/lane/.gitignore` (`*`) did NOT exist; created by this lane.
- Stack launched `PORT=2604 pnpm dev > .claude/lane/dev.log 2>&1 &`. First poll at +15s:
  `curl -o /dev/null -w '%{http_code}' localhost:5204` → **200**, `localhost:2604` → **200**.
  Log: shared `tsc -b --watch` "Found 0 errors"; server "[slur] server up on ws://192.168.43.61:2604";
  Vite "Local: http://localhost:5204/".
- Issue #164 locked: https://github.com/dineshsalunke/slur/issues/164#issuecomment-5750325229

## Dimensions (read from source, not from a board)

- `BLOCK_HEIGHT = 8` — `packages/shared/src/sim/track.ts:143`. Comment: "ABOVE double-jump reach on
  purpose → UN-jumpable". FIXED forever.
- `BLOCK_DEPTH = 8` — `packages/shared/src/sim/track.ts:144`. A short discrete cube centred in the 20u
  segment, not a full-depth wall: `bz0 = z0 + (SEG_LEN - BLOCK_DEPTH)/2` (`track.ts:358`).
- Width as generated today: 4u. FREE per `docs/ART_SCALE_REFERENCE.md` §2; GDD §0's own legal examples are
  `5.5 × 5.5 × 8u` and `3.5 × 5 × 8u`.
- `MIN_CLEAR = 7u` (`MAX_SHIP_WIDTH 4u` + `CLEARANCE_MARGIN 3u`) — `ART_SCALE_REFERENCE.md` §3. Gameplay.
- Track is 64u wide (`HALF_WIDTH = 32`); widest ship 2.6u. A block at 4u wide is ~1.5 ship-widths.

## Material — already decided, not open

- `docs/ART_MATERIALS.md` M2 "Hazard metal (coated)": metalness **0.0**, roughness **0.45–0.60**, base
  colour near-black **cooler than M1**, "continuous, uninterrupted broad faces", sparse marigold seams.
- `ART_MATERIALS.md` §7 decision 1: "Obstacle blocks are coated metal (M2). Decided by the project owner,
  2026-09-19" — selected over the live alternative of engineered stone.
- M2's stated mechanism: "The separation from the deck is finish, not value" — coated dielectric (tight
  specular on a diffuse body) against the deck's broad conductor reflection.
- Deck values as shipped: `FLOOR_ROUGHNESS = 0.4` (`track-materials.ts:11`), `FLOOR_METALNESS = 0.75`
  (`track-materials.ts:16`, itself a recorded departure from M1's bare-conductor 1.0).
- Gameplay-tier marigold reference: `MARIGOLD_REFERENCE_INTENSITY = 2.0`, `MARIGOLD_EMISSIVE = '#F59A24'`
  (`track-materials.ts:57-58`). Environmental tier is `× 0.25` (`track-materials.ts:60-61`).
- Block seams are **gameplay tier** per `ART_MATERIALS.md` §2 element map ("Standard deadly block | M2
  coated | gameplay — sparse functional seams").

## Rendering as it ships today (the integration target, NOT this lane's edit)

- `apps/client/app/game/scene/track-blocks.tsx` renders lethal + drag as two `<instancedMesh>`, each with a
  bare `<boxGeometry />` — a **unit box scaled per instance** by `put()` (`track-instancing.ts`).
  `BLOCK_LIMIT = 160` per kind.
- Consequence for authored detail: any feature authored on the unit box is scaled **anisotropically** by
  the instance (a 3% chamfer = 0.12u on a 4u axis, 0.24u on an 8u axis). World-uniform features need
  either a shader that reads the per-instance scale, or world-space (triplanar) UVs.
- `LETHAL_SURFACE` is still `emissive: '#ff2740'` (red) — `track-materials.ts:35` — with an in-file comment
  deferring the retone to "the block-design task". Red is excluded from the palette
  (`INDEX.md` §2 Palette). NOT touched by this lane; first item for the integration step.

## Open / unmeasured

- Silhouette direction: escalated to the supervisor 2026-09-20 (planted-mass w/ base seam · machined box ·
  capped mass). **No answer yet — nothing invested.**
- How the block reads at race speed against the finished deck: `[unmeasured]` — needs the chase camera in
  `/art-lab`, not the iso lab.
- Whether a base-contact seam reads as a per-block footprint marker or as a continuous route glow across
  adjacent blocks: `[unmeasured]`.

## Slice 1 — instrument + M2 body (commit `5fc6620`)

- Files added: `game/scene/sealed-block-material.ts`, `sealed-block-geometry.ts`, `sealed-block.tsx`,
  `sealed-block-geometry.test.ts`; `routes/iso-block/{route,block-family}.tsx`; one line in `routes.ts`.
  No file on the brief's §6 list was edited.
- Chosen starting values: roughness **0.52** (midpoint of M2's 0.45–0.60), metalness **0**,
  colour **`#0d1117`**. No emissive seam yet — seam placement is part of the escalated direction.
- Footprints rendered: `4 × 8`, `5.5 × 5.5`, `3.5 × 5`, all `× 8u` tall, at x = 0 / 8 / 15, z = 0.
  `<IsoLab size={8}>` so the scale ruler and the 2.6u Fighter box read directly against the 8u height.
- Verify gate, all green on `5fc6620`: `pnpm typecheck` clean · `pnpm lint` **3 warnings, all the
  pre-existing `noExcessiveLinesPerFile` baseline**, comment ratchet "7 changed source files, none gained
  comment lines" · `pnpm --filter @slur/shared test` **78 pass / 0 fail** · `pnpm -r test` client **80 pass
  / 12 files** (includes the 6 new cases), server 4 pass · `pnpm build` OK.
- `curl localhost:5204/iso-block` → **200**; no Vite error in `dev.log` after the request.
- Commit hook rejects a commit message containing the co-author trailer phrase — the first attempt was
  refused for naming it even in a note. `CONTRIBUTING.md:134` states the policy.
- **Visual gate: `[unmeasured]`.** Not yet looked at in a foreground Chrome tab; `split-crown` was busy
  and tab focus is serialised across lanes.

## Authority correction — board 28 supersedes board 10 and `handoff/04_OBSTACLES.md`

Relayed by the supervisor 2026-09-20; verified against the file. Owner's tightening: **board 28 only** —
boards 25/26/27 are history, not references.

- `docs/art-direction/blocks/28_non_destructible_blocks_SPEC.md`, first paragraph: *"This is the current
  non-destructible block art direction, superseding conflicting proposals in boards 25–27."*
- Same paragraph, on the image: *"the newly generated image has not itself been approved"*. And under
  validation: *"Illustrative proportions, apparent height and camera matching are not measured evidence."*
  The written selected direction is what is decided; `ART_SCALE_REFERENCE.md` stays the dimensional
  authority. Board 28 is a LOOK target.
- Direction as written: sealed rectangular cuboids, restrained bevels, 8u height, variable width/depth ·
  marigold seams **vertical only**, variable positions, multiple permitted · *"Top-face luminous returns
  and glowing outlines are not part of the selected direction"* · no fissures, cracks, separated plates or
  broken contours · *"Preserve generous dark face areas"* · variation carried by **broad irregular wear
  patches varying sheen and muted graphite value**, with *"Clean is a legitimate endpoint of the wear
  range"* and *"Wear strength and seam count are independent controls, not distinct gameplay classes"*.
- Authoring intent, which confirms the mechanism choice independently: *"Prefer shared parameterized cuboid
  forms and shared material variation over individually authored models or painted block textures"* —
  controls named as width/depth, restrained bevel, seam count/position/spacing, wear patch
  placement/scale/coverage/contrast, and a repeatable instance seed.
- *"Some fine surface crazing persists: this incidental texture is not authorization to reintroduce
  fissures."*

**Instrument corrected in the same commit:** `<IsoLab board>` now `28_non_destructible_blocks_FINAL_DRAFT.png`.
That board lives in `docs/art-direction/blocks/`, not `docs/art-direction/boards/`, so it needed a **second
`artRefsPlugin` mount** at `/art-refs-blocks` (`apps/client/vite.config.ts`) plus a `REFERENCE_BOARDS` entry
with a `url` override. Board 10's picker label now reads "(SUPERSEDED)". Nothing under
`docs/art-direction/` was edited.

## `ART_MATERIALS.md` M2 vs board 28 — asked for by the supervisor

**No contradiction found. Three omissions and one passage that can be misread.** M2 is our engineering
sheet; where it is silent the spec governs.

1. **Wear is absent from M2 entirely.** M2's block row lists finish, metalness, roughness, colour, seam
   language and silhouette — no wear. Board 28 makes broad wear patches *the* variation mechanism for the
   family. M2's element map row (`Standard deadly block | M2 coated | gameplay — sparse functional seams`)
   also omits it. **This is the gap that matters** — a reader of M2 alone would build a uniform family.
2. **M2 does not say seams are vertical.** It says "sparse, narrow, functional". Board 28 says vertical
   only, with variable position and multiple permitted, and explicitly excludes top-face returns. M2 is
   underspecified, not wrong.
3. **M2 names no seed / instance-variation concept.** Board 28's authoring intent requires a repeatable
   instance seed.
4. **Misread risk, not a conflict:** M2's "Destructible variant" paragraph describes broad recessed
   fractures with M7 revealed inside. Board 28 rejects fissures *"on this family"* — the non-destructible
   one — so the two do not collide, but a reader skimming M2 could carry fractures onto the sealed block.
   ADR-009 gates the destructible block anyway.
5. **Numbers:** board 28 sets none (*"this generated painting is not a working procedural system"*), so
   M2's roughness 0.45–0.60 and metalness 0 stand unopposed. Note that broad patches "varying sheen" will
   need a roughness *spread*; whether the worn end stays inside 0.60 is `[unmeasured]`.
6. **Agreements:** near-black coated metal, distinct from the bare graphite deck and from stone; generous
   dark faces; intact silhouette; localized marigold. M2 and board 28 say the same thing in both.

## Still open at this seam

- ~~Cold-key measurement on an 8u block, centreline vs rails~~ — **MEASURED 2026-09-20**, see the
  measurement section below. One term inside it is still open: the env SPECULAR contribution, which needs
  a GL context.
- ~~Triplanar / world-space UV behaviour on the installed three + R3F~~ — **VERIFIED 2026-09-20** against
  installed source, see the triplanar section below.
- Visual gate in a foreground Chrome tab: **`[unmeasured]`** — the tab was serialised to `split-crown`
  first by the supervisor. Nothing has been looked at on screen.

## Cold-key measurement — an 8u block, centreline vs rails (2026-09-20)

**Method.** A Node port of three 0.185.1's own fragment math, run against the shipped constants. Every
formula was copied from the installed source and is cited below, so the measurement is reproducible from
this section alone — the probe scripts themselves were scratch and are not kept. Colour conversion went
through the installed `three`'s `Color` (ColorManagement on: a hex is sRGB, the working space is
linear-sRGB), so no hand sRGB arithmetic enters. Units are **linear-sRGB radiance**, Rec.709 luma,
pre-bloom; the 8-bit column is after ACESFilmic at exposure 1 and the sRGB display encode, which is what
lands in the framebuffer. Yardstick is the gameplay-tier marigold strip (`#F59A24` x 2.0, linear luma
**8.530e-1**) — the same reference `cf1c98c` reported the deck against. Surface is the shipped M2 body:
`#0d1117`, roughness 0.52, metalness 0. View direction is the chase cam as `sky-config.ts` quotes
`camera/chase.ts` (9u up, ~12.5u back, aiming 7u ahead and 2u up).

**Source citations for the model, all verified-this-session in `node_modules/three@0.185.1`:**

- `WebGLLights.js:281` — `uniforms.color = light.color x light.intensity`.
- `ShaderChunk/lights_physical_pars_fragment.glsl.js:529-531` — `irradiance = saturate(dot(N,L)) x light.color`.
- `ShaderChunk/common.glsl.js:103` `BRDF_Lambert`, `:109` `F_Schlick`; `lights_physical_pars_fragment.glsl.js:76`
  `V_GGX_SmithCorrelated`, `:89` `D_GGX`, `:153` `BRDF_GGX`.
- `ShaderChunk/envmap_physical_pars_fragment.glsl.js:12` — `getIBLIrradiance = PI x envMapColor x
  envMapIntensity`; `MeshStandardMaterial.js:348` — `envMapIntensity` defaults to **1.0**, and the block
  material does not set it.
- `ShaderChunk/tonemapping_pars_fragment.glsl.js:35,46` — `RRTAndODTFit` + `ACESFilmicToneMapping`.
- R3F 9.7 sets `gl.toneMapping = ACESFilmicToneMapping` unless `flat`
  (`@react-three/fiber/dist/events-156d8d12.esm.js:15903`); no Canvas in this app sets `flat` or
  `toneMapping`, so ACES is on.
- drei `Lightformer.js:23-28` — a Lightformer is a `meshBasicMaterial` mesh, `toneMapped: false`, with
  `color = linear(color) x intensity`. A card's RADIANCE is exactly that, which is what gives the env
  integral below a real basis rather than an assumed one.

### THE ANSWER: centreline and rails are IDENTICAL — by construction, not by tuning

- `getDirectionalLightInfo` (`ShaderChunk/lights_pars_begin.glsl.js:88-94`) reads **no geometry position
  at all** — it copies `color` and `direction` straight off the uniform. Both the cold key and the star
  are `directionalLight`, so their contribution is position-independent. So is the env cubemap.
- The **rail emitter array is floor-only**: `patchEmitterLight` is called at exactly one site,
  `track-floor.tsx:249`, on the floor material. Grepped the whole client — there is no second call. A
  block's material is never patched, so it receives nothing from the rails at any x.
- **Therefore an 8u block receives exactly the same light at x = 0 as at x = 31.5. Zero variation across
  the 64u ribbon.** The 4.79e+3x edge/centre gradient `cf1c98c` was built to fix is a **deck-only**
  phenomenon; it does not reach the block.

### What the block actually receives (at every x)

| face | direct lin | env lin | TOTAL lin | / marigold | ACES+sRGB 8-bit |
|---|---|---|---|---|---|
| **-Z — the face an approaching player sees** | 0.00e+0 | 4.81e-5 | **4.81e-5** | 5.64e-5 | **rgb(0,0,0)** |
| +X (one rail side) | 0.00e+0 | 3.02e-5 | 3.02e-5 | 3.54e-5 | **rgb(0,0,0)** |
| -X (other rail side) | 1.23e-2 | 3.38e-3 | 1.57e-2 | 1.84e-2 | rgb(12,16,22) |
| +Y (top) | 4.47e-2 | 1.35e-3 | 4.60e-2 | 5.40e-2 | rgb(42,47,53) |
| +Z (far, faces away) | 6.29e-3 | 1.54e-3 | 7.83e-3 | 9.18e-3 | rgb(4,5,9) |

N.L per face: cold key `skyDirection(0,45) = (0, 0.707, 0.707)` gives 0.707 on +Y and +Z, and **0.000 on
-Z and on both +/-X**. Star `skyDirection(66,19) = (-0.864, 0.326, 0.385)` gives 0.864 on -X, 0.326 on
+Y, 0.385 on +Z, and **0.000 on -Z and +X**. `AMBIENT_INTENSITY = 0` (`lighting.tsx:6`), so nothing
fills them.

**Both lights come from ahead and above** — bearing 0 and bearing 66 both carry a positive +Z component,
and the ship flies +Z. The face a block presents to an approaching ship is lit by neither.

On the one properly lit face (+Y), **97% of the value is specular and 3% diffuse** (4.31e-2 vs 1.54e-3).
The cold key's own comment — "99% of what it buys on the near-black deck is specular" — holds for the
block too.

### The reshaping consequence

- The block never fails to be a **silhouette**. The deck at its darkest (centreline, ~4.7e-2 linear per
  `cf1c98c`) is still ~980x the block's front face, so the outline always reads.
- The block comprehensively fails to be a **surface**. Board 28 makes "broad irregular wear patches
  varying sheen and muted graphite value" *the* variation mechanism for this family — and on the face the
  player sees there is **no incident light for a sheen or a value to modulate**. Wear authored on -Z is
  invisible at 8-bit, at every position on the track, at every wear strength.
- Of the four vertical faces, two are rgb(0,0,0), one is rgb(4,5,9) and faces away, and the only one
  carrying readable value is -X — visible in profile, i.e. off to the player's side, not ahead. The top
  at rgb(42,47,53) is visible from the chase cam (pitched 18-21 deg down) and is the block's one real
  surface today.
- So on the presented face the **only** thing that can carry information is the emissive marigold seam,
  which is self-lit. That is a strong argument for the seams, and a strong argument that wear is a
  side-and-top-face mechanism until the lighting changes. Not this lane's bug to fix — reported.

### The deck's position-dependence, for contrast (the term the block does NOT get)

Rail emitters (`RAIL_EMITTER_INTENSITY 40`, `RANGE 600`, `DECAY 1`, `LIFT 0.5`, rails at |x| = 32.5),
through three's `getDistanceAttenuation` with decay 1, onto a floor point (N = +Y):

| x | distance to nearer rail | atten | N.L | relative irradiance |
|---|---|---|---|---|
| 0u | 32.50u | 3.08e-2 | 0.0154 | 1.893e-2 |
| 16u | 16.51u | 6.06e-2 | 0.0303 | 7.339e-2 |
| 28u | 4.53u | 2.21e-1 | 0.1104 | 9.756e-1 |
| 31.5u | 1.12u | 8.94e-1 | 0.4472 | 1.600e+1 |

**845x** from centreline to 31.5u, in emitter-only terms. This is a different endpoint pair and a
different decomposition from `cf1c98c`'s 4.79e+3x / 3.0e+2x figures — it is NOT a reproduction of them
and must not be read as either confirming or contradicting them.

### Caveat — the one term not measured

The env **specular** (`getIBLRadiance` at roughness 0.52) is not integrated: it needs the real PMREM mip
chain, i.e. a GL context, i.e. the tab. It is bounded small and does not change the conclusion. F0 is
0.04 at metalness 0, and the env radiance in the -Z face's reflection lobe is the fill/wrap level
(~1e-2 linear), so the term is O(4e-4) — four orders below the marigold yardstick's 8.53e-1, and still
rgb(0,0,0) after ACES. **Confirm on screen when the tab comes back.** Everything else above is exact.

## Triplanar / world-space UV on the installed stack — was `[unverified]`, now VERIFIED (2026-09-20)

Checked against `node_modules` at `three@0.185.1`, `@react-three/fiber@9.7`, `@react-three/drei@10.7.8`.
Nothing here is recalled.

1. **There is no usable built-in triplanar.** three 0.185.1 does ship one —
   `src/nodes/utils/TriplanarTextures.js`, exported as `triplanarTextures` — but it lives in the **TSL /
   node-material** system, which needs the node material family. This client uses the classic path
   (`meshStandardMaterial` through R3F, WebGLRenderer) and imports nothing from `three/tsl` or
   `three/webgpu` — grepped the whole app, zero hits. drei 10.7.8 ships no triplanar at all. **So it is
   hand-written in `onBeforeCompile`.**
2. **And the built-in would not have solved our problem anyway.** Its default `positionNode` is
   `positionLocal` (`TriplanarTextures.js:25`). On an `InstancedMesh` the local position is the **unit
   box**, so the pattern would scale with the instance — precisely the anisotropy this lane needs to
   avoid. World-space requires passing `positionWorld` explicitly. Worth knowing before anyone cites the
   built-in as prior art.
3. **`instanceMatrix` IS folded into world position.** `ShaderChunk/worldpos_vertex.glsl.js` multiplies
   by `instanceMatrix` under `USE_INSTANCING` *before* `modelMatrix`, and `project_vertex.glsl.js` does
   the same for `mvPosition`. A world-space UV on an instanced block is therefore correct and stable
   under the per-instance scale — the mechanism choice works.
4. **⚠ `worldPosition` is CONDITIONALLY declared.** `worldpos_vertex.glsl.js:2` guards it on
   `USE_ENVMAP || DISTANCE || USE_SHADOWMAP || USE_TRANSMISSION || NUM_SPOT_LIGHT_COORDS > 0`. In this
   scene it happens to exist: `WebGLPrograms.js:60-63` uses `scene.environment` as the envMap for any
   `MeshStandardMaterial`, and `WebGLProgram.js:493` then emits `#define USE_ENVMAP`. But that makes the
   world position available **only because the scene has an environment** — delete the `<Environment>`
   and the chunk silently stops declaring it. **Declare our own varying; never lean on that guard.**
5. **`worldPosition` is a vertex-shader local, not a varying.** three passes no world position to the
   fragment shader on this path. A triplanar needs an explicitly added `varying vec3` carrying it.
6. **World normal in the fragment shader:** `vNormal` is VIEW space. three ships
   `transformNormalByInverseViewMatrix( normal, viewMatrix )` (`common.glsl.js:69`) and `viewMatrix` is
   available in the fragment shader. (Do not confuse it with `inverseTransformDirection`, which
   `common.glsl.js:67` marks `@deprecated r185` as an alias of `transformDirectionByInverseViewMatrix` —
   a different function. The normal one is current.)
7. **Non-uniform instance scale does NOT break normals on this version — verified, against expectation.**
   `defaultnormal_vertex.glsl.js` divides `objectNormal` by the squared column lengths of `instanceMatrix`
   before multiplying by it, which is the inverse-transpose for a scale+rotation matrix, and the chunk
   comments "shear transforms in the instance matrix are not supported". Our instance matrices are
   scale+translate only (`track-instancing.ts` `put()`), so this is exactly the supported case. **No
   footgun here**; a shader that assumes it must correct the normal itself would be wrong.
8. **Integration hazard for the later step, not for this lane.** `onBeforeCompile` is ONE function slot
   per material, and `patchEmitterLight` already occupies it on the floor material
   (`track-floor.tsx:249`). If the sealed block is ever given emitter light too, the two patches must be
   **composed**, not both assigned. Related: `customProgramCacheKey` (`Material.js:543`) must be
   overridden whenever a patch's GLSL varies with a JS value, or three serves a stale compiled program.
   `patchEmitterLight` does not override it and is safe only because its GLSL is constant — any patch we
   write whose source text depends on a parameter must.

## Closing the two open questions on the measurement (2026-09-20)

### Q1 — the env specular term, INTEGRATED rather than bounded. It is rgb(0,0,0).

Rather than saturate the bound I closed the term. Method: the three authored cards sampled to
(direction, radiance, solid angle), then a `D_GGX`-weighted normalised average around the reflection
vector — which is what a PMREM mip approximates — times three's env BRDF. The env BRDF uses the Karis
analytic fit as a **labelled stand-in**: three 0.185 samples a `dfgLUT` texture
(`lights_physical_pars_fragment.glsl.js:380`, `EnvironmentBRDF`) which needs GL, and the fit is the
same function that LUT tabulates.

For the presented (-Z) face, chase-cam view: `V = (0.000, 0.371, -0.928)`, `R = (0.000, -0.371, -0.928)`,
`dotNV = 0.928`.

- prefiltered env radiance in that lobe: **9.53e-3** luma
- env BRDF at roughness 0.52, dotNV 0.928: **3.05e-2**
- **env specular = 2.91e-4.** Total presented face = 2.91e-4 + 4.81e-5 diffuse = **3.39e-4 → rgb(0,0,0)**

So the earlier O(4e-4) estimate was right, and the face is **literally black at 8-bit, not at a noise
floor**. Note `dotNV = 0.928` — the presented face is seen nearly head-on, so Fresnel sits at its
*minimum*; there is no grazing-angle rescue available.

**The saturated bound is not worth quoting.** Forcing the whole lobe to see the brightest card (the KEY)
gives 7.21e-2 → rgb(60,68,83), but that is geometrically impossible: `R` points backward and downward
while the key card is ahead and above. The integrated number above is the real closure.

**Consequence: the tab is no longer a blocker for this question.** Nothing an on-screen check can show
would move rgb(0,0,0). The visual gate is still wanted for the *look*, not for this number.

### Q2 — a roughness spread on the top face buys 2 levels. Wear is a consolation, not a fallback.

+Y face, chase cam, sweeping roughness across the whole M2 band:

| roughness | direct spec | env spec | diffuse | TOTAL lin | ACES+sRGB |
|---|---|---|---|---|---|
| 0.45 | 4.78e-2 | 7.36e-3 | 2.89e-3 | 5.80e-2 | rgb(51,57,65) |
| 0.48 | 4.66e-2 | 9.47e-3 | 2.89e-3 | 5.90e-2 | rgb(52,58,66) |
| 0.52 | 4.31e-2 | 1.28e-2 | 2.89e-3 | 5.88e-2 | rgb(52,58,66) |
| 0.56 | 3.84e-2 | 1.65e-2 | 2.89e-3 | 5.78e-2 | rgb(51,57,66) |
| 0.60 | 3.34e-2 | 2.03e-2 | 2.89e-3 | 5.66e-2 | rgb(50,56,65) |

**Green-channel swing across the entire M2 band: 56 to 58 — 2 levels. And it is NOT monotonic**: it
peaks at 0.48 and falls again. The cause is a near-cancellation — direct specular *drops* with roughness
(4.78e-2 → 3.34e-2) while env specular *rises* (7.36e-3 → 2.03e-2), and under this particular rig the
two almost exactly trade off. That is a property of this lighting, not of the material.

**The value dial is no better.** Board 28 names two wear controls, sheen *and* muted graphite value. At
roughness 0.52 the specular terms are albedo-independent (F0 is fixed at 0.04 for metalness 0), so only
the diffuse 2.89e-3 of the 5.88e-2 total — **4.9%** — responds to value at all:

| albedo | TOTAL lin | ACES+sRGB |
|---|---|---|
| x0.0 (pure black) | 4.28e-2 | rgb(40,44,48) |
| x1.0 (`#0d1117`) | 4.55e-2 | rgb(42,46,52) |
| x2.0 | 4.82e-2 | rgb(44,49,56) |
| x3.0 | 5.09e-2 | rgb(46,51,59) |

Driving the albedo to pure black costs 2 levels; **tripling** it buys 7. Across any range that still
reads as "muted graphite" it is ~4 levels.

**So both of board 28's wear controls are exhausted at roughly 2-4 levels of 8-bit, on the one face that
carries any signal, and at exactly zero on the face the player sees.** "Wear is a top-and-side-profile
mechanism" is therefore a **consolation, not a fallback** — under this rig, wear cannot carry the
family's variation at all, by any authoring inside M2's own band. That is a rig finding, not a block
finding, and it is escalated, not acted on.

### Confirmed present, per the supervisor's check

The `onBeforeCompile` single-slot collision with `patchEmitterLight`, the `customProgramCacheKey`
staleness trap, and the built-in triplanar's `positionLocal` default (which would scale the pattern with
the instance) are all already written into the triplanar section above, as items 8, 8 and 2.

## Slice 2 — restrained chamfer (commit `f71db93`, pushed)

`sealedBlockGeometry` is no longer a `BoxGeometry`. It builds a chamfered cuboid: 6 face quads, 12 chamfer
strips, 8 corner triangles — 44 triangles, non-indexed, flat-shaded. Winding is DERIVED from the intended
normal per polygon, never hand-ordered.

- `SEALED_BLOCK_BEVEL = 0.12` (world units, not a fraction of the block), clamped to
  `MAX_BEVEL_FRACTION 0.45 × min(half-extent)` so it can never become a taper.
- Projection sanity, computed not eyeballed: chase distance ~15u at vFOV 60 covers `2·15·tan30 = 17.32u` of
  height → 62.4 px/u at 1080p. The `-Z/-X` strip is seen at 45°, so `0.12 × cos45 = 0.085u` ≈ **5.3 px**.
- Two-directional AABB assertion **re-run and green** on all three footprints: the chamfer cuts inward from
  the corners, the six faces still reach the envelope on every axis.
- Client tests **85 pass / 12 files** (was 80): +3 winding/outwardness cases (one per footprint), +1 shell
  triangle count, +1 pin on the `-Z/-X` facet.

### N·L per facet of the chamfered shell — same constants as the cold-key measurement

Node, exact geometry, `skyDirection(0,45)` cold key and `skyDirection(66,19)` star. Only `max(0, N·L)`;
no BRDF, no ACES — this answers "is the facet lit at all", not "what value does it read".

| facet | N·L key | N·L star |
|---|---|---|
| FACE −Z (presented) | 0.0000 | 0.0000 |
| FACE −X | 0.0000 | 0.8638 |
| FACE +X | 0.0000 | 0.0000 |
| FACE +Y (top) | 0.7071 | 0.3256 |
| BEVEL −Z/+Y | 0.0000 | 0.0000 |
| BEVEL −Z/−Y | 0.0000 | 0.0000 |
| BEVEL −Z/+X (vertical) | 0.0000 | 0.0000 |
| **BEVEL −Z/−X (vertical)** | 0.0000 | **0.3388** |
| BEVEL −X/+Y | 0.5000 | 0.8410 |
| BEVEL +X/+Y | 0.5000 | 0.0000 |
| **CORNER −X/+Y/−Z** | 0.0000 | **0.4646** |
| CORNER +X/+Y/−Z | 0.0000 | 0.0000 |

**The chamfer recovers exactly ONE lit vertical edge on the presented silhouette** (39% of the fully lit −X
face), plus a continuous lit top rim right around the block on facets a flat box does not have. It is not a
general rescue — every other presented-face chamfer facet is still 0.0000, so this does not soften #170.

## Chrome — own tab group, capture attempted, NOT trustworthy

- Tab group `953585186`, tabId `253884869`, created by this session with `createIfEmpty: true`; navigated to
  `http://localhost:5204/iso-block`. Title resolved to "SLUR — Iso Lab · Sealed block", so the SPA served.
- `document.visibilityState` = **`"hidden"`** and `document.hasFocus()` = `false`, measured BEFORE a
  `computer:screenshot` call AND again immediately AFTER it. The screenshot call did not foreground the tab.
- `canvas.clientWidth × clientHeight` = **1728 × 997**, and the returned frame is not black — so R3F DID
  mount and something rendered. Per `hidden-tab-blank-canvas`, canvas size is NOT the test, so this proves
  mounting and proves nothing about frame currency.
- **No visual conclusion has been drawn and none is recorded here.** The visual gate is still `[unmeasured]`.
- `/iso-block` debug-overlay defaults, read from source not from the frame (`iso-lab.tsx:50-57`): board
  compare mode starts `'off'`; `grid` and `rig` both start from the route's `rig` prop, which `/iso-block`
  leaves at the `true` default. So the neutral rig IS on by default — there is no opaque AABB slab
  equivalent to `/art-lab`'s `shipBox`, but the lab lighting is on and is not the race rig.
- `[unverified — tab hidden]` The returned frame appears framed much closer than `IsoLabCanvas`'s computed
  default (`dist = max(12, 8×1.9) = 15.2`, camera `[9.12, 6.84, 15.2]`, fov 45). Recorded only so the next
  session checks it against a foregrounded frame rather than rediscovering it.

## Not started at this seam

- Vertical marigold seams: **NOT STARTED.** Nothing written, nothing uncommitted.
- Wear mechanism: **NOT STARTED.**
- Design settled before the seam, so it is not re-derived: seams parameterised by a PERIMETER coordinate
  walking the four side faces (`u ∈ [0, 2(w+d))`), which makes a seam vertical by construction, wraps across
  chamfer strips continuously (the face-select switches exactly at the corner, where both branches agree),
  and keeps seam width world-uniform. Masked off horizontal surfaces by `|world normal .y|`, which kills the
  top/bottom faces AND the near-horizontal top chamfer strips — board 28's "no top-face luminous returns".
  Emissive added at `#include <emissivemap_fragment>` (verified-this-session: `meshphysical.glsl.js:182`,
  after `normal_fragment_begin` at `:178`, so the shading normal exists there). Wear on 3D value noise of
  world position — which is inherently projection-free, so NO triplanar blend is needed at all; it still
  needs the same `vWorldPos` varying the triplanar section documents. Roughness hook at
  `roughnessmap_fragment` (`:176`), value hook at `map_fragment` (`:171`) — both before the normal, and
  neither needs it.
- Seam colour must be `MARIGOLD_EMISSIVE × MARIGOLD_REFERENCE_INTENSITY` imported from `track-materials.ts`
  (gameplay tier per `ART_MATERIALS.md` §2), NOT a new number — so `MARIGOLD_REFERENCE_INTENSITY` staying
  `[unmeasured]` does not block the seams.

## VISUAL GATE — the chamfer, via the frame tap (2026-09-20). First pixels seen on this lane.

`curl 'http://localhost:5204/__frame-tap?name=sealed-block-bevel-01'` → `ok: true`, `pumped: 1`,
ref `.claude/art-pass/00-frame-tap/refs/sealed-block-bevel-01.png` (3456 × 1994; gitignored by
`.claude/art-pass/.gitignore:3` `*/refs/`, so re-tap to reproduce rather than looking for it in git).

**`firstDeltaSeconds: 89.77`** — the previous frame from ANY source was 89.8 s earlier, which confirms rAF
was dead in the hidden tab and that the tap pumped the frame itself. So the `computer:screenshot` frame
taken earlier was stale, and was correctly discarded unread.

**Read as GEOMETRY only.** `/iso-block` mounts the neutral lab rig (`ambientLight 0.5` +
`directionalLight`, `iso-lab-canvas.tsx:67-68`), not the race rig, so nothing here speaks to levels — that
is #170's question. Silhouette, chamfer read and contour are what this frame is evidence for.

- **Silhouette: PASS.** Sealed rectangular cuboid, contour unbroken, no taper, no rounding, no fissures or
  separated plates, generous dark face areas. Board 28's shape requirements are met.
- **Top chamfer strips: RESOLVE.** A distinct narrow brighter band runs the full length of the top edge,
  clearly a third facet separate from both the top face and the side face — the "continuous lit top rim"
  the N·L table predicted. It does not soften the corner; the edge still reads hard.
- **Corner triangles: PRESENT and correctly oriented.** Visible as a small distinct wedge where three
  chamfer strips meet at the top corner. Independent confirmation of the winding-from-intended-normal
  construction, on a facet no test could have caught rendering black.
- **Vertical chamfer strips: DO NOT RESOLVE at this distance.** The near vertical corner reads as a hard
  value step between the two side faces, not as a band. The facet is in the geometry (pinned by the
  `-Z/-X` test) but under this rig, at this zoom, it does not separate from either face.
- ⚠ **Flag for the owner/Codex, not acted on:** under the lab rig the top chamfer band is the BRIGHTEST
  feature on the block and reads prominently. It is a *lit* facet, not an emissive one, so it is not a
  "top-face luminous return" in board 28's sense — but it is close enough to the excluded "glowing
  outline" read that it should be re-judged once the emissive marigold seams and bloom are on it. Naming
  it now so the later frame is not the first time anyone notices.
- **Framing:** two of the three footprints fill the frame at the lab's computed default
  (`dist = max(12, 8×1.9) = 15.2`, camera `[9.12, 6.84, 15.2]`, fov 45). **This retracts the
  `[unverified — tab hidden]` "framed much closer than default" note above** — that came from the stale
  screenshot and is not a real finding. Framing is consistent with the computed default.

**Still `[unmeasured]`:** how the block reads at race speed in `/art-lab` under the real rig; whether a
base-contact seam reads per-block or as a continuous route glow; `MARIGOLD_REFERENCE_INTENSITY`.
