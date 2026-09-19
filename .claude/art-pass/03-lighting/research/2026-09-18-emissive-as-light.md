# Research — how emissive gameplay geometry actually lights nearby surfaces and the floor

**Task:** `.claude/art-pass/03-lighting/README.md` §1a/§4 open question 2. Scoped from
`01-background/research/2026-09-18-procedural-sky.md` §5 (option space only, no recommendation made there).
**Date:** 2026-09-18. **Status:** research (no code shipped).

---

## 0. Scope and source tiers

- **[T1]** official docs for the installed version
- **[T2]** this repo — README/CHANGELOG/typed API/source
- **[T3]** upstream source read directly (`node_modules/.pnpm/...`, three.js/drei/postprocessing source) — last resort
- **[UNVERIFIED]** could not confirm this session; flagged, never asserted

Installed versions, re-verified **[T2]** this session directly from `apps/client/node_modules/*/package.json`
(not recalled from the other reports): `three` **0.185.1**, `@react-three/fiber` **9.7.0**,
`@react-three/drei` **10.7.8**, `postprocessing` **6.39.4** (the `@react-three/postprocessing` wrapper pins
`^3.0.4`, not independently re-checked this session — matches `conventions/r3f.md` [T2]).

Read directly this session: `three/src/renderers/webgl/WebGLRenderer.js`, `WebGLLights.js`,
`WebGLPrograms.js`, `WebGLProgram.js`, `lights_physical_pars_fragment.glsl.js`, `lights_fragment_begin.glsl.js`,
`RectAreaLight.js` (class JSDoc); `@react-three/drei/core/MeshReflectorMaterial.js` (component) and
`@react-three/drei/materials/MeshReflectorMaterial.js` (the material's `onBeforeCompile`);
`@react-three/drei/core/Lightformer.js`/`.d.ts`; `postprocessing@6.39.4`'s `src/effects/` and `build/` for an
SSR effect (absent — see §2.2). Read this repo's own track rendering: `apps/client/app/game/scene/track-view.tsx`,
`track-floor.tsx`, `track-materials.ts`, and the existing `onBeforeCompile` dissolve shader in `ship-model.tsx`
(a real, working in-repo precedent for the custom-shader mechanism, cited in §4). Read the three native-resolution
board 12 crops as images this session (`L-monoliths.jpg`, `R-planet-star.jpg`, `floor-ship.jpg`) — a new visual
finding not present in the scoping report is reported in §1.

---

## 1. What the crops actually show, read again for this question specifically

The scoping report already established the four falsifiable tests (README §1a, restated in the brief). Reading
the crops again with the *mechanism* question in mind (not just "is there a mechanism") surfaces one thing the
scoping pass didn't need to resolve:

**The floor's bright streaks are not soft, rounded, mirror-shaped blobs — they are long, narrow, sharply
directional streaks that converge toward the camera at a shallow angle**, in all three crops
(`L-monoliths.jpg`: the rail line's reflection is a single continuous bright stripe running the full depth of
the floor, not a series of discrete dot-reflections per light-emitting panel seam; `floor-ship.jpg`: the three
engine trails produce three converging streaks *longer than the ship itself*, each narrowing toward the
horizon; `R-planet-star.jpg`: same rail-stripe behaviour, plus the monolith seam's reflection is a short bright
smear directly at its base, not a full-height mirror image of the glowing crack above).

This is diagnostic. A **true planar mirror reflection** of a vertical glowing line (the rail, or a monolith
seam) produces the *mirror image of that line* — same length, same shape, flipped across the surface plane,
foreshortened by perspective like anything else in the scene. What's in the crops instead is the classic
**grazing-angle specular highlight of a near-field light on a glossy-but-rough surface** — the same "glitter
path" / light column you see on the specular highlight of a streetlamp on wet asphalt or the sun's reflection
on open water. That artifact comes from the GGX specular lobe's footprint stretching as the view angle
approaches grazing incidence over a surface with nonzero roughness — it requires **no separate reflection pass
at all**, only a real light (or an equivalent analytic term) at the correct near-field position, and a
`roughness` in the range that makes the GGX lobe visible-but-elongated rather than either a sharp mirror point
(near-zero roughness) or a fully diffuse smear (high roughness). **This reframes the floor-reflection
sub-question**: board 12's specific floor look is plausibly reachable by the *same* near-field-emitter
mechanism that explains the monolith falloff, evaluated with an ordinary specular BRDF at a game-appropriate
roughness — not necessarily by a dedicated planar-reflection or SSR system. This does not rule out planar
reflection (a real mirror also produces a similar elongated highlight of anything bright, including sky and
distant objects, which specular-only misses entirely) — it just means the falloff mechanism and the "floor
reflection" mechanism may be **the same underlying near-field light**, evaluated through the specular term
already built into `MeshStandardMaterial`, and the two sub-questions in the brief are more coupled than they
first appear. Confidence: **medium** — this is my own optical read of three static JPEGs, not a rendered A/B
comparison; it is exactly the kind of claim §7's "what would make this wrong" should gate before committing to
it as the *sole* floor mechanism (see §7).

---

## 2. Five-plus distinct mechanisms, weighed against the four falsifiable tests

Falsifiable tests, numbered as in the brief: **(1)** monolith brightest-at-base falloff, **(2)** moving
engine-light pool under the ship, **(3)** floor reflections trace specific nearby emitters, glossy not diffuse,
**(4)** shadow sides near-black, no fill.

### A. Real `THREE.PointLight`/`SpotLight` at a FIXED, stable count, repositioned per frame

A small, unchanging number of point lights (say N=8–16) exist for the whole race; each frame, a system
repositions the ones nearest the ship/camera to sit at the current nearest rail segments, seam dashes, and the
ship's own engine positions — never adding or removing light objects, only moving them (and, for ones with
nothing nearby to represent, driving `intensity` to `0`, never `visible = false`).

- **Verified this session, directly from `three@0.185.1` source, why the "fixed count, reposition" framing is
  correct and not merely a defensive habit:**
  - `WebGLRenderer.js` `projectObject()` (~line 1835): `if (object.visible === false) return;` runs **before**
    the `object.isLight` branch that calls `currentRenderState.pushLight(object)`. **Toggling `light.visible`
    removes it from the lights array for that frame** — this changes the *count* three collects, which (below)
    is a cache-key input. **Do not use `.visible` to "turn a light off."**
  - `WebGLLights.js` `setup(lights)` (~line 212) iterates every light three collected and sums
    `color * intensity` with **no floor on intensity** — a light with `intensity = 0` still occupies a slot in
    `state.point[]`/`pointLength` and is still counted. **Setting `intensity = 0` is the correct way to "turn a
    light off" without changing the count.**
  - `WebGLPrograms.js` `getProgramCacheKeyParameters()` pushes `numPointLights`/`numSpotLights`/
    `numDirLights`/`numRectAreaLights` (the *counts*, from `lights.point.length` etc.) into the program cache
    key (`getProgramCacheKey()`, ~line 398–436); `WebGLProgram.js` `replaceLightNums()` (~line 214–229) does a
    literal string substitution of `NUM_POINT_LIGHTS` etc. into the GLSL source, and
    `lights_fragment_begin.glsl.js` wraps the per-light block in `#pragma unroll_loop_start` /
    `#pragma unroll_loop_end` — the count is compiled into the shader as an **unrolled loop bound**, not read
    from a uniform at runtime.
  - **Consequence, confirmed not merely inferred:** a light's `position` is a per-frame uniform update
    (`WebGLLights.js` writes `uniforms.position` from `light.matrixWorld` every `setupView` call) and **does
    not** touch the cache key — moving a light every frame is free of recompilation. Adding/removing a light
    object from the scene, or toggling its `.visible`, changes the count the render state collects for the next
    frame's `setup()` and **will** produce a new cache key the first time a different count is seen for any
    material that light illuminates (mitigated by the fact that `acquireProgram()` caches by key and reuses on
    a repeat hit — so oscillating between exactly two counts stabilizes after both have been compiled once, but
    the risk is any material seeing a *count it hasn't seen before*).
  - **This confirms the brief's constraint reasoning is correct**, with one refinement it didn't have yet:
    intensity-zeroing, not merely "don't stream lights," is the concrete mechanism that keeps the count
    genuinely fixed.
- **Test (1) — base-brightest falloff:** passes by construction. A real point light at floor level next to the
  monolith gives 1/d²-style falloff up the face for free — this is exactly what a `PointLight` does; no
  authoring effort beyond correct placement.
- **Test (2) — moving engine pool:** passes directly — reposition one of the N lights to the ship's engine
  position every frame; it is the textbook use case for a repositioned light.
- **Test (3) — floor reflections:** the §1 finding applies — a real point light at the correct near-field
  position, sampled by the floor's own GGX specular term at the floor's chosen roughness, plausibly reproduces
  the grazing-angle streak look **without any separate reflection system** (see §1). Diffuse-only "reflection"
  (soft pool) would fail test 3's "not a broad diffuse pool" requirement; the *specular* component is what
  makes this pass, so the floor material's roughness/metalness tuning becomes load-bearing here, not optional.
- **Test (4) — no fill:** trivially satisfied — nothing about this mechanism adds ambient; shadow sides stay
  black as long as no `HemisphereLight`/`AmbientLight` is added alongside it (an authoring discipline, not a
  property of the mechanism).
- **Cost shape:** the per-light steady-state cost (§ three.js material-cost report, already-verified in this
  repo) is real but bounded and *flat* once N is fixed: `N × [BRDF_GGX + 2 dfgLUT texture samples (+ shadow
  sample if casting)]` per fragment per lit material, for every fragment of every material that light
  potentially reaches. No RectAreaLight-specific LTC cost (see B). No full extra scene render (see D/E).
- **Makes hard later:** N is a hard ceiling — the scheme needs an allocation/priority policy (nearest-K to the
  ship wins a slot; what wins when there are more simultaneous emitters worth lighting than N, e.g. a cluster
  of pickups plus the ship's own 3 engines plus 2 nearby monolith seams) that this report does not solve.
  Shadow casting from any of these lights would add its own count axis (`numPointLightShadows` — not traced
  this session, but the same unroll/cache-key mechanism almost certainly applies by symmetry with the point/
  spot/dir counts already confirmed) — recommend **no shadow casting on this pool** unless a later pass proves
  it's needed, both for cost and because §1a's board evidence doesn't show cast shadows from these emitters as
  a distinguishing feature.

### B. `THREE.RectAreaLight`, fixed pool, repositioned/resized

Same "fixed count, reposition" discipline as A, but using rectangular-plane lights shaped to literally match a
rail/seam segment's geometry instead of a point.

- **Verified [T3] directly from `RectAreaLight.js`'s own class JSDoc**, read this session: *"There is no shadow
  support. Only PBR materials are supported. You have to include `RectAreaLightUniformsLib` (WebGLRenderer) ...
  and init the uniforms/textures"* — confirms all three constraints named in the brief, from the primary
  source, not recalled.
- **Verified [T3] the LTC cost is real and distinct from a point light's**, from
  `lights_physical_pars_fragment.glsl.js` (`RE_Direct_RectArea_Physical`, ~line 465–520): each RectAreaLight
  calls `LTC_Uv` (a texture sample into the LTC lookup table) and `LTC_Evaluate` (which itself sums
  `LTC_EdgeVectorFormFactor` over the rectangle's **four edges**) **twice per light** — once for diffuse, once
  for specular (`reflectedLight.directDiffuse +=` / `directSpecular +=`, lines 497/499) — i.e., meaningfully
  more ALU + texture-sample work per light than a point/directional light's single `BRDF_GGX_Multiscatter`
  call. This is the "per-light LTC cost" the brief asked to confirm, confirmed.
- **Cost/count budget — not independently benchmarked this session** [UNVERIFIED, flagged not asserted]: no
  authoritative "N RectAreaLights is the practical ceiling" number exists in the source (there's no separate
  hard cap the way `<Instances limit>` has one) — the honest answer is "fewer than point lights, by roughly the
  ratio of LTC's edge-sum + 2 texture samples vs. GGX's 2 dfgLUT samples," which is a real but *not measured*
  multiplier. Given this project already needs a small fixed N for mechanism A, and RectAreaLight buys "shaped
  like the rail" at a real per-light premium with **zero shadow support** (irrelevant here — none of these
  emitters are meant to cast shadows per test 4) and **PBR-materials-only** (fine — the floor and monolith faces
  are already `MeshStandardMaterial`), the honest tradeoff is: RectAreaLight's *shape* fidelity (a strip, not a
  point) buys a marginally more accurate falloff along a rail's length, at real extra per-light cost, for a
  mechanism that A already passes all four tests with. **Not a clear win over A** — flagged as a secondary
  refinement, not a distinct recommendation.
- Same shader-recompile-on-count-change caveat as A: `NUM_RECT_AREA_LIGHTS` is confirmed **[T3, from the
  installed material-cost report's own citations, re-confirmed this session]** to be gated exactly like
  point/spot counts — fixed pool + repositioning, not streaming, applies identically here.
- **Requires an explicit one-time init call** (`RectAreaLightUniformsLib.init()`, an `examples/jsm` addon, not
  auto-wired) — **grepped this repo this session: not currently called anywhere** [T2] — a real setup step a
  team member could forget, silently producing lights that do nothing (the JSDoc's own warning).

### C. Environment/IBL-family (PMREM baked scene, drei `<Lightformer>`-in-`<Environment>`, `LightProbe`/irradiance volumes)

Directly answering brief sub-question 1: **yes, this family fundamentally fails tests (1) and (2), and the
reason is structural, not a tuning problem.**

- PMREM (`PMREMGenerator`, used by drei's `<Environment>`/`EnvironmentPortal`, already verified in the sky
  report) produces a **direction-only** radiance function: `scene.environment` sampling in
  `envmap_physical_pars_fragment.glsl.js` looks up irradiance/prefiltered radiance by **surface normal and view
  reflection direction only** — there is no position term at all in an IBL sample. Every point on the monolith
  face, and every point on the floor regardless of how close it is to a specific rail segment, samples the
  *same* environment function for a given normal — there is no way for an IBL sample to know "I am 0.2 units
  from this specific glowing seam and 4 units from the next one." **This is why it cannot pass test (1):** a
  PMREM'd rail contributes *the same* directional light to the whole monolith face, top to bottom, at every
  height — a flat contribution wearing near-field falloff's costume is structurally impossible from this
  representation, independent of bake resolution or intensity.
  restated as of a class of IBL techniques already established
  in the previous report [T2 self-reference] plus this session's direct re-read of the IBL fragment chunk.
- **Test (2) fails even harder:** IBL is baked (PMREM: once, at load/on config change) or, even in a live-cube-
  camera variant, represents *distant* environment content — a moving near-field emitter under a moving ship
  cannot be represented by re-baking a cubemap every frame (this is exactly the "no per-frame cost" constraint
  the brief and the material-cost report both flag: re-baking per frame to track the ship is the raymarch-style
  cost mistake the sky report already rejected for the *sky*, and it is equally wrong here, for the same
  reason).
- `LightProbe`/irradiance-volume-family: verified **[T3]** `THREE.LightProbe` exists in `three@0.185.1`
  (`src/lights/LightProbe.js`, class confirmed — resolves the sky report's own `[UNVERIFIED]` flag on this
  point). It is a spherical-harmonics **ambient** term — smoother and spatially-varying if you place several
  and interpolate, but each individual probe is still a **low-frequency, direction-weighted** representation
  with no sharp falloff term; this is the right tool for "the far rock field needs a different ambient level
  than the track" (§1a role 3, already the sky report's job), not for a sharp base-brightest seam.
- **Where this family genuinely helps, and should not be discarded:** the *far field* — rocks, the planet — is
  correctly served by exactly this family (already the sky report's conclusion, re-confirmed here from the
  opposite direction). The mistake would be reaching for it for the *track's own* near-field light, which is
  precisely the mistake §1a's corrected model was written to head off.

### D. `drei <MeshReflectorMaterial>` — real planar reflection, full extra scene render

Read the actual component this session, not just the `.d.ts`, because "does it re-render the scene" is exactly
the kind of claim that needs source, not a docstring.

- **Verified [T3], `@react-three/drei/core/MeshReflectorMaterial.js`:** every frame, inside a `useFrame`
  callback, it (a) hides the reflector mesh itself (`parent.visible = false`), (b) computes a mirrored
  "virtual camera" via the classic oblique-near-plane-clipping technique (Terathon's published method, cited in
  the source's own comment), (c) calls **`gl.render(scene, virtualCamera)`** into an offscreen FBO at
  `resolution` (default **256**), (d) optionally runs a separate `BlurPass` on that FBO if `blur` is nonzero,
  then (e) restores visibility and continues the real frame. This is **one additional full render of the entire
  visible scene, every frame, per `MeshReflectorMaterial` instance** — not a cheap trick; it is exactly what a
  from-scratch planar-mirror implementation would do (this is architecturally three's own long-shipped
  `Reflector`/`Refractor` examples pattern, re-hosted as a drei material).
- **Test (3):** this is the *only* mechanism in this list that gives a **geometrically correct mirror image** —
  it would reproduce the rail/seam/engine reflections exactly, including things §1's specular-highlight
  explanation cannot reach (a reflection of the *sky*, of *other track geometry*, of the *ship's hull itself*
  mirrored beneath it). If board 12's floor reflections include content beyond "streaks under bright emitters"
  — e.g. a legible mirrored silhouette of scenery — only this mechanism (or SSR, see below) produces it.
- **Tests (1)/(2)/(4):** irrelevant to this mechanism — it is purely a floor-material technique and says nothing
  about how the monolith face or the floor's *non-reflective* shading gets its near-field falloff. It would need
  to be paired with A (or an analytic term) for the rest of the scene; it cannot stand alone.
- **Cost:** real and non-trivial — a full second scene render per instance per frame, at race speed, on a
  procedurally regenerated track (i.e., the "scene" being re-rendered includes whatever is currently
  streamed/visible, not a fixed small prop set). One reflector for the whole floor ribbon is architecturally the
  only sane configuration (not one per floor panel — that would be N full scene renders); even one is a real
  frame-budget line item this project has not measured. **Not measured this session** [UNVERIFIED] — flagged as
  the single most important number to get before choosing this path.
- **Makes hard later:** the mirrored render still needs *something* bright to reflect — i.e., mechanism D does
  not replace A, it needs A (or B, or an analytic term) underneath it to have anything worth reflecting. It also
  interacts with bloom ordering (a reflected bloomed streak vs. a reflection of the pre-bloom scene are visually
  different, and `EffectComposer` currently runs bloom once, globally, after the main render — the reflector's
  own render pass happens *before* the main composed frame, so its captured scene has no bloom baked in unless
  wired specially).

### E. Screen-space reflections (SSR) via `postprocessing`

- **Verified [T3] this session, directly: `postprocessing@6.39.4` (installed) ships no SSR/screen-space-
  reflection effect.** Searched `node_modules/postprocessing/build` (the shipped dist; there is no `src/`
  checked into the published package — confirmed by listing the package root, only `build/` exists) for any
  class/file matching `SSR`, `ScreenSpaceReflection`, or `SSGI` — **zero matches**. The `postprocessing` GitHub
  project does have community forks/PRs discussing SSR historically, but **nothing under that name ships in the
  version this project has installed** — this is a hole search, not a docs read, and is the correct tier for a
  negative claim (searched the actual installed artifact, found nothing, rather than trusting a changelog).
- **Consequence:** SSR is **not available** in this stack without adding a new dependency (e.g. the separate,
  unaffiliated `screen-space-reflections` npm package, or Superhoge's fork, or hand-rolling one) — none of which
  are installed, none of which were evaluated for the offline/no-new-dependency-without-review bar this project
  holds new packages to. **Rejected for this pass on availability grounds**, not on merit — flag upward if a
  future reviewer wants to spend a dependency-addition review cycle on it. If it were available: SSR
  reflects actual screen-space rendered content (including bloom, since it samples post-lighting), which would
  answer test (3) similarly to D without a second full scene render — but it inherits SSR's own well-known
  failure mode (off-screen or occluded reflected content produces nothing/artifacts, which for a floor looking
  at emitters mostly *in* the visible frustum is a smaller problem than usual, but not zero).

### F. Analytic near-field term in the floor's (and monolith's, and hull's) own shader — `onBeforeCompile`

Directly answering brief sub-question 3, and using a real precedent already in this codebase.

- **This exact mechanism already ships in this repo** — verified **[T2]**, `apps/client/app/game/scene/
  ship-model.tsx`: an `onBeforeCompile` patch on the ship's material injects a value-noise `discard` for the
  dissolve effect, driven by a per-entity uniform, with `deep="materialsOnly"` cloning so the uniform stays
  per-instance. This is the idiomatic, already-precedented way to extend `MeshStandardMaterial` in this stack —
  not a hypothetical option needing new infrastructure.
- **How rail geometry gets in, concretely, and why the cost is close to free:** `track-view.tsx`, read this
  session **[T2]**, already computes every rail segment's world position in plain JS **every frame**, inside the
  `useFrame` system that fills `railRef`'s `instanceMatrix` (a pooled `InstancedMesh`, `RAIL_LIMIT` capacity).
  That same loop already has, for free, the CPU-side array of active rail-segment centers before it's packed
  into instance matrices. Feeding a **uniform array of the K nearest emitter positions** (K small — see below)
  to a shared floor/monolith/hull material means: reduce that same per-frame position list to the K nearest to
  the ship (a cheap sort/partial-select over an already-small, already-computed array — not new scene traversal
  work), write them into a `Float32Array` uniform, done. No new per-frame cost class is introduced; it reuses
  work the codebase already performs.
- **Practical uniform-array size:** WebGL2 (three's default context on this stack — not independently
  re-verified this session which context type this project's `<Canvas>` requests, but WebGL2 is three's
  documented default) guarantees a **minimum** of 224 `vec4` fragment uniform vectors per the GLES 3.0 spec
  floor (general graphics-API knowledge, not looked up in this project's own docs — **[UNVERIFIED against this
  project's actual runtime `gl.getParameter(MAX_FRAGMENT_UNIFORM_VECTORS)`]**, flagged, though `WebGLCapabilities.js`
  read this session confirms three itself queries this exact constant at `renderer` init). A handful of `vec3`
  positions (K = 8–16, i.e. 8–16 `vec4`s once padded) is far inside that floor on any WebGL2-capable device —
  this is not a binding constraint in practice, unlike the shader-recompile-on-light-count issue that *does*
  bind for real `Light` objects.
- **Test (1):** passes by construction — write the exact falloff curve you measured off the crop (§1 of the
  original scoping report: brightest at the base, falling off upward) as a closed-form function of
  distance-to-nearest-emitter, evaluated per-fragment. This is the **only** mechanism in this whole list that
  can be shaped to match a *specific measured curve* rather than inheriting whichever falloff model a built-in
  light type imposes (1/d² for point lights, LTC's rectangle solid-angle model for RectAreaLight) — worth
  weighing against A/B if the measured curve turns out not to look right under a stock inverse-square falloff.
- **Test (2):** passes — the ship's engine position is just another entry in the same uniform array, updated
  every frame from wherever the ship's ECS position already lives (no new subscription; per `conventions/r3f.md`
  this is exactly the kind of per-frame position sync that belongs in a `useFrame` system, not React state).
- **Test (3):** the same term, added to the floor's fragment shader as a `diffuseColor`/emissive contribution
  keyed to distance-to-nearest-emitter, reproduces "brightness that traces specific nearby emitters" directly —
  but reproducing the *specular streak* character noted in §1 specifically requires the term to feed the
  specular lobe (or fake one, e.g. `pow(NdotH, shininess)` toward each nearby emitter direction), not just
  bump `diffuseColor` — an emissive-style additive term alone would read as a diffuse glow, which test (3)
  explicitly says to avoid ("not a broad diffuse pool"). This is a real authoring risk specific to this
  mechanism: a naive implementation (add warmth to `diffuseColor` by distance) fails test 3's "glossy, not
  diffuse" requirement even though it passes test 1; a correct implementation needs the term shaped as a
  specular-like directional response, which is more shader work than it first looks.
- **Test (4):** trivially passes — the term is additive and directional; nothing about it lifts a base black
  level unless authored to (an easy self-check: with K's positions all at infinity/zero contribution, the floor
  should render exactly as black as today's `FLOOR_SURFACE` with no rail nearby).
- **Cost:** cheapest of every mechanism examined that can pass tests (1)+(2) — no extra light objects, no extra
  render passes, no LTC evaluation, just extra ALU in a fragment shader already being evaluated. Scales with
  K (loop over K positions per fragment), not with scene light count, and never triggers a shader recompile
  (K is a compile-time constant array size chosen once, not derived from a runtime scene light count — this
  sidesteps the entire class A/B recompile risk by construction, which is a genuine structural advantage over
  A/B, not just a style preference).
- **Makes hard later:** must be **duplicated into every material that should show this behaviour** — the floor,
  the monolith faces, and (per test 2's requirement that the engine light the floor) potentially the ship hull's
  own shadow-facing surfaces — unless factored into a shared GLSL chunk/helper function injected via
  `onBeforeCompile` into each material that opts in. This is real but manageable authoring overhead (write the
  function once, `onBeforeCompile`-inject it into N materials), not a new mechanism per surface.

### G. Baked lightmaps / vertex-baked bounce on static track geometry

Named in the scoping report; re-evaluated here against the four tests specifically.

- **Structurally disqualified for the primary near-field mechanism**, confirmed by this project's own
  architecture, not merely "sounds hard": the track is **procedurally regenerated per race** (ADR-006/007,
  CLAUDE.md) — any offline/author-time bake is stale the moment the seed changes. A bake would have to run **at
  track-generation time**, which the brief already flags as a real cost to be honest about. It could, in
  principle, run once per race (generate track → bake lightmap → race), which is a legitimate one-time cost
  similar in shape to the sky's PMREM bake — but it buys **static** lighting only; it fails test (2) outright
  (a lightmap cannot represent a light source that moves with the ship, by definition — baking is the opposite
  of what a moving emitter needs). **Verdict: disqualified for the ship's own engine light (test 2) on
  structural grounds; at best a candidate for the *static* rail/monolith-seam contribution only, and even there
  it is strictly worse than F (the analytic term) for this project because F requires no bake step at all and
  handles regeneration for free.** Not recommended for any part of this problem.

---

## 2A. ADDENDUM — the material-authoring spectrum (added mid-session, owner-raised)

**The question this section answers:** mechanism F (§2F) says "patch `MeshStandardMaterial` via
`onBeforeCompile`." The owner raised a real alternative: since three has no near-field emissive-lighting
mechanism *anyway*, and the art direction is deliberately stylized (no fill, hard black shadow sides,
warm-near-field-dominant) rather than photoreal, why inherit a full Cook-Torrance/GGX-multiscatter PBR
pipeline the game is not fully using? Treated here as a spectrum, each rung evaluated on its own, not
collapsed into "custom shader vs. not."

### Rung 1 — stock `MeshStandardMaterial` + real `Light` objects

This is mechanism A/B from §2. Already weighed. Carries the light-count/recompile discipline burden (§2A
mechanism A already covers this in full).

### Rung 2 — subclass + `onBeforeCompile` chunk injection (this report's §2F recommendation)

**This is the stack's own idiom, not a novel technique** — verified this session, directly:
`@react-three/drei@10.7.8`'s own `MeshReflectorMaterial` (`materials/MeshReflectorMaterial.js`) is
`class MeshReflectorMaterial extends MeshStandardMaterial` (line 3) with an `onBeforeCompile(shader)` method
(line ~40) that string-replaces `#include <project_vertex>` (vertex shader, injecting a texture-projection
varying) and `#include <emissivemap_fragment>` (fragment shader, injecting the whole reflection-compositing
block) — exactly the pattern this report's §2F proposes, already shipped and load-bearing in the installed
dependency tree. `ship-model.tsx`'s dissolve shader (§2F) is this project's own second confirmation of the
same idiom. This is two independent precedents, one upstream and one in-repo, not a one-off trick.

**`customProgramCacheKey()` — verified `[T3]`, `three@0.185.1/src/materials/Material.js:543`:**
```js
customProgramCacheKey() {
    return this.onBeforeCompile.toString();
}
```
Read directly, with its own JSDoc (`materials/Material.js:518-546`): *"In case `onBeforeCompile` is used, this
callback can be used to identify values of settings used in `onBeforeCompile()`, so three.js can reuse a cached
shader or recompile the shader for this material as needed."* The default implementation returns the
**function's source text**, not any hash of its runtime behavior — a JS closure's `.toString()` returns the
code as written, with parameter/variable *names*, never the resolved *values* of captured outer variables. This
has a precise, verifiable consequence, confirmed by reading `WebGLPrograms.js:382` (`customProgramCacheKey:
material.customProgramCacheKey()`) and `:432` (pushed into the cache-key array):

- **Safe by default:** if `onBeforeCompile`'s *behavior* varies only through uniform *values* (e.g. a
  `Float32Array` of emitter positions updated every frame, a `K`-length array whose *size* never changes), the
  function's source text is identical across every material instance and every frame — one cache key, one
  compiled program, correctly shared. This is exactly F's design (§2F): the uniform *contents* change every
  frame, the shader *text* never does.
- **A patched material MUST override `customProgramCacheKey()`** (or express the variability as a `defines`
  entry instead — see below) whenever the *actual GLSL text produced* depends on material-instance state that
  is invisible in the closure's source — e.g. `if (this.numEmitters > 8) { /* inject extra chunk */ }` inside
  the shared `onBeforeCompile` function. Two material instances with `numEmitters = 4` and `numEmitters = 20`
  would call the *textually identical* function, so the default cache key is identical, so three would (bug,
  not choice) hand the `numEmitters = 20` instance a program compiled for the `numEmitters = 4` variant — a
  silent, wrong-shader-shared-across-materials failure, not a crash. **This exact hazard applies directly to
  §2F's design if K (the emitter-count array size) is ever varied per-material** (e.g. a cheaper K for
  far-away, low-priority props vs. a richer K near the ship) rather than fixed globally.
- **How drei's own `MeshReflectorMaterial` avoids needing the override — verified, and the cleaner idiom:** it
  does **not** override `customProgramCacheKey()`. Instead (`core/MeshReflectorMaterial.js`, read in §2D) it
  expresses its real structural variability (`USE_BLUR`, `USE_DEPTH`, `USE_DISTORTION` — whether optional
  fragment paths exist at all) as **`defines`** on the material (`'defines-USE_BLUR': hasBlur ? '' : undefined`
  passed as a prop), and `defines` are *already* part of the built-in cache key (confirmed in the already-
  verified material-cost report, `WebGLPrograms.js` pushing `material.defines` into the key) — so three's
  default machinery correctly recompiles when `defines` change, with zero custom cache-key code needed. It
  *additionally* forces a full React remount on a `defines`-derived `key` string (`'key' + ...`), which is a
  belt-and-suspenders move specific to *drei's* need to swap the whole material instance when blur/depth/
  distortion toggle — not evidence that `defines` alone was insufficient.
  **Recommendation for F: follow this exact idiom** — if K (or any other structural toggle) ever needs to vary,
  express it as `material.defines.NUM_EMITTERS = K` (a literal integer baked into the GLSL as `#define
  NUM_EMITTERS ${K}`, sizing the uniform array), never as untracked internal branching in the closure. If K is
  fixed globally (this report's actual recommendation, §4), the hazard doesn't arise at all — flagged for
  completeness, not because §2F's recommended design currently trips it.

**Version-pin fragility — a real but bounded risk, assessed plainly:** `onBeforeCompile` works by string-
matching chunk names (`#include <project_vertex>`, `#include <emissivemap_fragment>`, etc.) inside three's
assembled shader source — verified as the literal mechanism in both the drei and in-repo precedents. This
**is** coupled to chunk names/contents that can change between three versions; the JSDoc's own wording
("useful for the modification of built-in materials") does not promise stability across majors. Two mitigating
facts, both verified this session, both real: **(1)** this project is pinned to `three@0.185.x` and held under
`< 0.186` by `postprocessing@6.39.4`'s own peer range (`>= 0.168.0 < 0.186.0`, read directly from
`postprocessing`'s `package.json`) — any three bump is already a deliberate, reviewed action for an unrelated
reason (the postprocessing peer), not something that happens silently; **(2)** the specific chunk names this
report would touch (`emissivemap_fragment`, `project_vertex`, `dithering_fragment`-adjacent injection points)
are among three's longest-lived, most community-relied-upon hook points — they are what `MeshReflectorMaterial`
(a widely-used, actively maintained drei component) itself depends on, so a break would be visible upstream
(drei would need to patch its own shipped material) before it ever reaches this project silently. **Verdict:
acceptable risk, not a reason to prefer rung 3/4** — the pin makes this concretely bounded, not merely "probably
fine."

### Rung 3 — `ShaderMaterial` reusing three's own `ShaderChunk` strings

**Verified `[T3]` this session, precisely, rather than "you lose PBR" hand-waved:**

`ShaderChunk` is a public export — `three@0.185.1/src/Three.js:8`: `export { ShaderChunk } from
'./renderers/shaders/ShaderChunk.js'` — every chunk file this report has already cited by name
(`envmap_physical_pars_fragment`, `cube_uv_reflection_fragment`, `lights_physical_pars_fragment`, `fog_fragment`,
etc.) is importable as a raw GLSL string at `THREE.ShaderChunk['<name>']`, confirmed by the same mechanism
`ShaderLib.physical` itself uses to assemble `meshphysical.glsl.js` (string concatenation of named chunks) —
this is not a hidden/internal API, it is literally how three builds its own materials.

**What genuinely comes for free on a plain `ShaderMaterial` (not `RawShaderMaterial`) — verified by reading
`WebGLPrograms.js` `getParameters()` and `WebGLProgram.js`'s prefix assembly directly, object/geometry/scene-
driven, with `material.type` never checked for these:**
- **Instancing / skinning / morph targets:** `getParameters()` sets `instancing: object.isInstancedMesh`
  (`:124,208`), `skinning: object.isSkinnedMesh` (`:328`), `morphTargets`/`morphTargetsCount` from
  `geometry.morphAttributes` (`:86,332,335`) — **no material-type gate on any of these**. `WebGLProgram.js`
  (confirmed `parameters.isRawShaderMaterial !== true`, `:801`) then unconditionally emits the
  `instanceMatrix`/`skinIndex`/`skinWeight` attribute declarations and `USE_INSTANCING`/`USE_SKINNING`/
  `USE_MORPHTARGETS` defines into the vertex prefix (`:605-670`) for **any** non-raw `ShaderMaterial` — the
  wiring exists automatically; you still have to *use* `instanceMatrix` in your own `main()`, but you can do so
  either by hand or by `#include`-ing the exact chunks (`instancing_pars_vertex`, `instancing_vertex`,
  `skinning_pars_vertex`, `skinbase_vertex`, `skinnormal_vertex`, `skinning_vertex`) three itself uses.
- **Fog:** `useFog: material.fog === true` (`:314`) — a plain boolean property on any material (including
  `ShaderMaterial`), no type restriction; set it and `#include <fog_fragment>` (plus declare the fog uniforms
  three wires from `scene.fog`) and it works.
- **Tone mapping / colorspace output:** confirmed in the already-existing material-cost report and re-confirmed
  by this session's reading of `WebGLPrograms.js` — gated purely on `material.toneMapped` (a boolean on any
  material) and the renderer's output-target state, never on `material.type`. `#include <tonemapping_fragment>`
  / `<colorspace_fragment>` are available to any hand-rolled fragment shader that includes them.
- **Shadow-map sampling (receiving shadows):** `shadowMapEnabled: renderer.shadowMap.enabled && shadows.length
  > 0` (`:359`) — scene/renderer-driven, not material-type-gated. The chunk (`shadowmap_pars_fragment`,
  `shadowmap_pars_vertex`) is reusable the same way.

**What is genuinely NOT automatic — the one real gap, verified precisely:** `getParameters()`'s `environment`
variable (`:61`) — the input to `scene.environment`'s automatic pickup — is computed as `(material.
isMeshStandardMaterial || material.isMeshLambertMaterial || material.isMeshPhongMaterial) ? scene.environment :
null`. A plain `ShaderMaterial` does **not** automatically inherit `scene.environment`. **But** — verified by
reading the very next line (`:63`): `const envMap = environments.get(material.envMap || environment, usePMREM)`
— this reads `material.envMap` **regardless of material type** before falling back to the (type-gated)
`environment` variable. So: **manually setting `shaderMaterial.envMap = <a PMREM-processed texture you already
own>` restores the entire cubeUV pipeline** — `envMapCubeUVHeight` (`:64`, gated only on
`envMap.mapping === CubeUVReflectionMapping`, not on material type) flows into `WebGLProgram.js`'s
`CUBEUV_TEXEL_WIDTH`/`CUBEUV_TEXEL_HEIGHT`/`CUBEUV_MAX_MIP`/`ENVMAP_TYPE_CUBE_UV` defines (`:398,691-693,359`)
exactly as it would for `MeshStandardMaterial`. **Concretely, for this project:** the PMREM texture the
already-recommended sky pipeline produces (task 1's `EnvironmentPortal`/`PMREMGenerator` output,
`01-background` research §2F) can be assigned directly to a hand-rolled `ShaderMaterial`'s `.envMap`, and the
`envmap_physical_pars_fragment`/`cube_uv_reflection_fragment` chunks (already GLSL functions taking that exact
uniform shape) can be spliced in verbatim — this is a real, bounded amount of setup work (assign one property,
include two chunk strings, declare `getIBLIrradiance`/`getIBLRadiance` calls in your lighting sum), not a
from-scratch reimplementation.

**What you give up, concretely, choosing rung 3 over rung 2:** the *convenience* of not writing a full fragment
`main()` — `ShaderMaterial` (unlike subclassing `MeshStandardMaterial` via `onBeforeCompile`) requires **you**
to assemble the entire vertex and fragment shader bodies yourself (three gives you the prefix/attributes/defines
for free per above, but the actual `void main() { ... }` and the choice of BRDF, light-loop structure, and
which chunks to include, in what order, is entirely authored code). This is strictly more authoring work than
rung 2 (patching three's *already-assembled* `meshphysical.glsl.js` at named insertion points) for the *same*
final feature set — rung 3 only earns its cost if the goal is also to **change** the BRDF/light response (rung
4's territory), not merely to add a near-field term to an otherwise-standard PBR shading result. **For this
report's actual problem (add one analytic term, keep everything else standard), rung 3 is strictly more work
than rung 2 for no additional capability** — this is the central finding of this addendum.

### Rung 4 — fully hand-rolled stylized BRDF (Lambert + cheap GGX-ish specular + fresnel rim)

Owns everything: no `RE_Direct_Physical`/GGX-multiscatter/dfgLUT (verified in the already-existing material-
cost report as **unconditionally present, per-light, in every stock `MeshStandardMaterial`/`MeshPhysicalMaterial`
fragment** — this is precisely the "we're not using all of this" cost the owner's framing identifies), no
per-light unrolled-loop BRDF cost beyond whatever the hand-rolled term costs, full control over the specular
shape (directly enabling the §1 "shape the specular lobe to match the measured grazing-angle streak" idea,
rather than hoping stock GGX at some roughness happens to produce it).

- **Concretely what's given up vs. rebuilt, itemized as the owner's brief demanded, each checked against
  what's still free per rung 3's findings above:** instancing/skinning/morph/fog/tonemapping/colorspace/
  shadow-receiving are **still free** (same object/scene-driven wiring rung 3 gets — nothing about writing your
  own BRDF changes any of that; it's a separate axis). What's genuinely rebuilt: (1) the light-loop structure
  itself — stock `RE_Direct_Physical`'s GGX+multiscatter+dfgLUT, replaced by your own diffuse+specular+fresnel
  sum, one function, no texture-LUT dependency (arguably *cheaper* per light, which is the owner's cost
  argument, verified directionally correct: no `dfgLUT` sampling means at minimum 2 fewer texture fetches per
  light per fragment than stock, confirmed unconditional-per-light in the cost report); (2) `getIBLIrradiance`/
  `getIBLRadiance`'s specific GGX-VNDF-based roughness-to-mip mapping (`cube_uv_reflection_fragment.glsl.js`,
  186 lines, read this session — a real, nontrivial, already-correct piece of math for sampling a PMREM cubemap
  at the right blur level per roughness) — reusable **as a chunk** even here (it's not BRDF-specific, it's
  environment-*sampling* math, orthogonal to the direct-light BRDF you're replacing) — so even rung 4 need not
  reimplement this particular piece; only the *direct*-light response is actually novel work.
- **Test fit:** identical to rung 2/3 on tests (1)/(2)/(4) (those are about *where the light comes from* and
  *whether there's fill*, not about the BRDF shape) — rung 4's only genuine advantage over rung 2 is **test
  (3)**, where full control over the specular lobe shape gives the most direct path to exactly reproducing
  §1's measured grazing-angle streak, rather than relying on stock GGX at a tuned roughness happening to look
  right.
- **Cost of the advantage:** authoring and validating a full custom BRDF (energy conservation, Fresnel term,
  correct falloff away from the theoretical ideal) is real, ongoing work with no upstream (three/drei) code to
  lean on for correctness checking — the "art direction is stylized, not photoreal" argument cuts the other
  way here too: a *stylized* BRDF has no ground truth to check against, so getting it to look consistently
  right across every lighting condition (rail-lit, star-lit, in-shadow) is trial-and-error against the boards,
  not derivable from a spec.

### Rung 5 — TSL / node-material path (`three/webgpu`) — verified foreclosed for this project

**Verified `[T3]` this session, precisely:** `three@0.185.1`'s own `package.json` `exports` map (checked
directly, `apps/client/node_modules/three/package.json`) includes `"./webgpu": "./build/three.webgpu.js"` — the
node-material/TSL/WebGPU path genuinely exists in the installed three version; this is not a "wrong three
version" question. **What forecloses it is `postprocessing@6.39.4`**, which owns this project's single global
`<Bloom>`/`EffectComposer` (per `conventions/r3f.md`, already an established fact): its **typed API**
(`build/types/index.d.ts`, read directly this session) types `EffectComposer`'s constructor, `Pass.
setRenderer`, and every renderer-accepting method parameter as `WebGLRenderer` — **zero occurrences of
`WebGPURenderer` anywhere in the package's types or its bundled build** (`grep -c "WebGPURenderer"` on the
built `postprocessing.js` returned `0`). **Verdict: the node-material/TSL path is foreclosed for this project
as long as `postprocessing` is the bloom/composition mechanism** — adopting it would mean replacing the entire
postprocessing pipeline (a materially larger, unrelated migration, well outside this task's scope), not merely
choosing a different material-authoring rung. Named and disposed of per the brief's request; not a candidate.

### Is "where the near-field term comes from" separable from "do we want three's BRDF at all"? — Verified separable, and sequencing matters

**Yes, cleanly separable, and this report recommends treating them as two sequential decisions, not one
bundled change.** The near-field-emitter *data* (which positions light what, at what falloff curve) is
identical regardless of which rung renders it — §2F's uniform-array-of-K-positions design, and the falloff
curve to encode, do not change between rung 2 and rung 4. What changes between rungs is **only** how the
final per-fragment shading equation combines that data with the rest of the light response (stock GGX vs. a
hand-rolled BRDF). Concretely:
- Rung 2 (patch `MeshStandardMaterial`) can ship the near-field term **today**, immediately, reusing every
  already-correct piece of three's PBR pipeline (IBL sampling for the star/sky task-1 contribution, tone
  mapping, fog, shadow-receiving) with a single well-scoped, precedented patch.
- If, after seeing rung 2 rendered against the boards, the specular response specifically still doesn't match
  §1's measured streak character, the fix is to **replace only the BRDF term** (move to rung 3 or 4) while
  **keeping the exact same near-field data/uniform design** — because the two are separable, this second step
  (if ever needed) is a shading-equation swap, not a redesign of how emitter data reaches the shader.
- **Bundling them (shipping a from-scratch BRDF at the same time as the near-field mechanism) would make a
  wrong-looking result ambiguous between "the falloff data/curve is wrong" and "the BRDF is wrong"** — exactly
  the failure mode the owner's own framing (and this report's §7 fallback ladder for D vs. F) is designed to
  avoid elsewhere. Recommend the same discipline here: ship rung 2 first, keep rung 4 in reserve, gated on a
  specific, nameable visual failure (the specular streak not reading correctly under rung 2), not adopted
  pre-emptively on cost-efficiency grounds alone.

### Addendum recommendation

**Rung 2 (subclass + `onBeforeCompile`) — not rung 3 or 4 — remains this report's recommendation**, now on a
firmer footing: it is a precedented idiom (drei's own shipped `MeshReflectorMaterial`, plus this repo's own
dissolve shader), its version-pin risk is bounded and already load-bearing on an upstream dependency, and it
gets every piece of "free" plumbing (fog, tone mapping, colorspace, shadow-receiving, instancing/skinning,
already-correct PMREM/cubeUV IBL sampling for task 1's star/sky contribution) without having to re-assemble any
of it by hand — rungs 3 and 4 pay a real, itemized authoring cost for capability (BRDF-shape control) this
report cannot yet prove is needed, per §1's own "medium confidence, needs a rendered spike" hedge. **If** the
rendered spike in §4/§7 shows the near-field term needs a differently-shaped specular response than stock GGX
can produce even after roughness/metalness tuning, the correct next step is rung 4 (not rung 3, which pays
rung-4-adjacent authoring cost — writing a full shader body — for none of rung 4's BRDF-shape benefit), applied
as a **separate, second, clearly-attributed change**, per the separability argument above — never bundled with
the first attempt.

---

## 3. Direct answers to the brief's sub-questions

**1. Does IBL/environment fail tests 1 and 2, and why precisely?** Yes — §2C. It is a direction-only function
of surface normal (and view-reflection direction for specular), with no distance/position term, so it cannot
represent a falloff that depends on proximity to a *specific* nearby emitter — the monolith's whole face would
receive one flat contribution regardless of height. And it is baked/distant by nature, so a moving emitter under
a moving ship cannot be represented without re-baking every frame, which is the exact per-frame cost class this
project (and the sky report, for the identical reason) already rules out.

**2. Can the glossy floor reflect near-field emissive geometry at all, and how?** Two genuine mechanisms exist
in this stack: **`MeshReflectorMaterial`** (real planar mirror, full extra scene render per frame, verified in
§2D — the only one that reproduces an actual mirrored image of scene content) and **SSR**, which is **not
shipped by the installed `postprocessing@6.39.4`** (verified by searching the installed package, §2E) and would
require a new, unevaluated dependency. A third path, **not a "reflection" in the geometric sense but plausibly
sufficient for what board 12 actually shows** (§1): the grazing-angle GGX specular response of a real or
analytic near-field light on a floor material at the right roughness produces the same elongated-streak look
the crops show, at a fraction of the cost of either. This is the single most consequential finding of this
report and is flagged for visual verification, not shipped as settled (§7).

**3. Cleanest way to give floor + monolith + hull a shared analytic term?** `onBeforeCompile` on
`MeshStandardMaterial` — already precedented in this exact codebase (`ship-model.tsx`'s dissolve shader,
§2F) — is the right mechanism, not a new `ShaderMaterial` from scratch (that would forgo three's PBR lighting
pipeline entirely, which the floor/monolith/hull all still need for the star + sky IBL contribution from task
1). Rail/emitter positions pass in as a small `Float32Array` uniform (`vec3[K]`, K≈8–16), refreshed every frame
from data the track-rendering `useFrame` loop already computes — no new geometry traversal, no data-texture
needed at this scale (a data texture would only earn its keep past roughly a few hundred positions, per the
uniform-array-size headroom in §2F — this project needs K in the low tens, nearest-to-ship, not "every emitter
on the whole track at once").

**4. Is there an obviously-right hybrid?** Yes, and it is the load-bearing recommendation of this report:
**F (analytic near-field term, shared via `onBeforeCompile`) for the falloff on all near-field-lit surfaces,
evaluated through the specular lobe so it also produces the floor's streak-reflection look (§1), with
`MeshReflectorMaterial` (D) held in reserve as a fallback only if a visual spike shows the specular-only
approach can't reach the "mirrored geometry" character of the reflections** — see §4 below.

**5. What does the ship's own moving engine light cost, and is it the same mechanism as the static rails?**
Under the recommended mechanism (F), it is **exactly the same mechanism** — the ship's engine position is just
another entry in the same per-frame uniform array, at zero additional architectural cost (§2F, test 2). Under
mechanism A (real lights), it would *also* be the same mechanism (one of the fixed-N pool, repositioned) — the
two options this report weighs both treat "static rail" and "moving engine" identically; there is no scenario
examined here where they need to be different systems.

---

## 4. Recommendation

**Recommend F — a shared analytic near-field term, injected via `onBeforeCompile` into
`MeshStandardMaterial` (§2A rung 2, NOT a hand-rolled `ShaderMaterial`/BRDF) on the floor, monolith faces, and
(where relevant) the ship hull, driven by a small per-frame uniform array of the K nearest emitter positions
(rail segments, seam dashes, pickups, the ship's own engines) — evaluated through both a diffuse-warmth term
(for test 1's base-brightest falloff) and a specular-shaped term (for test 3's streak-like floor
"reflections").** Do not add `MeshReflectorMaterial` or any real `Light` pool as the *primary* mechanism; keep
both in reserve per the fallback ladder below. K fixed globally (not varied per-material) — per §2A, this
sidesteps the `customProgramCacheKey()` hazard entirely; if K ever needs to vary, express it as
`material.defines.NUM_EMITTERS`, never as untracked internal branching in the `onBeforeCompile` closure.

**Why F over A/B (real lights):** F passes all four tests, matches a measured falloff curve exactly rather than
inheriting a built-in light's falloff shape, structurally avoids the shader-recompile risk that A/B require real
discipline (fixed-N + intensity-zeroing, never `.visible`) to avoid, and reuses per-frame position data this
codebase already computes rather than adding new `Light` objects and an allocation policy for a bounded pool.
It is also the only mechanism that can be *authored to the specific measured curve* board 12 shows, rather than
approximated by whichever falloff model three.js's built-in light types impose.

**Why not D/E as the primary floor mechanism:** D (`MeshReflectorMaterial`) is a real, working, verified
mechanism that would look *more* correct in the general case (reflecting scenery, not just streaks) — but it
costs a full extra scene render every frame at race speed on procedurally streamed geometry, a cost this report
could not measure this session and which the specular-streak observation in §1 suggests may not be necessary to
reach the specific look board 12 shows. E is unavailable in the installed stack without a new dependency.

**The fallback ladder, stated explicitly so this isn't a silent bet:**
1. Ship F. Render at the real chase-camera angle, race speed, bloom on and off (per INDEX.md §4's own reviewing
   standing facts).
2. If the floor still reads as "lit" rather than "reflecting" — i.e., the specular-streak theory in §1 turns
   out to be an artifact of viewing static JPEGs and doesn't survive being rendered — add `MeshReflectorMaterial`
   **on the floor only**, one instance for the whole ribbon (never per-panel), and measure its frame-time cost
   before deciding whether it's affordable. F still supplies the monolith/hull falloff either way; D would only
   ever be an addition to the floor specifically.
3. Do not reach for RectAreaLight (B) unless F's authored falloff curve genuinely cannot be shaped to match a
   rail's rectangular geometry with a point-based term — B's extra LTC cost and mandatory manual
   `RectAreaLightUniformsLib.init()` step (not currently called anywhere in this repo — §2B) are real overhead
   for a shape refinement F likely doesn't need.
4. Do not reach for SSR (E) without a dedicated dependency-review cycle — it isn't in the installed stack.
5. Do not pre-emptively adopt a hand-rolled `ShaderMaterial`/BRDF (§2A rungs 3/4) on cost-efficiency grounds
   alone. Per §2A's separability argument, ship rung 2 first; move to rung 4 **only** if the rendered spike
   shows the specular response genuinely cannot be shaped correctly on top of stock GGX, and treat that as a
   distinct, separately-attributed second change, not a bundled first attempt.

### What would make this recommendation wrong

- **If a rendered spike (not a static-JPEG read) shows the GGX-specular-streak theory in §1 does not actually
  reproduce board 12's floor look** — e.g., it reads as a diffuse warm patch instead of a directional streak,
  or the streak doesn't survive at the floor's chosen roughness/metalness — that would mean the floor needs a
  real reflection (D), not just a specular-shaped analytic term, and the recommendation's cost advantage over D
  evaporates for the floor specifically (F would still be right for the monolith/hull falloff).
- **If K (the nearest-emitter uniform array size) has to grow large to avoid visible "popping" as emitters enter
  and leave the K-nearest set** while the ship moves at race speed — this is a real risk this report did not
  playtest (nothing here simulates the actual visual effect of an emitter dropping out of the top-K list
  mid-race) — that would push toward either a larger K (still cheap per §2F's uniform-budget headroom) or a
  smoothed/cross-faded selection rather than a hard cutoff, which is more shader complexity than assumed here.
- **If profiling shows the "reduce the already-computed rail-position array to nearest-K every frame" step is
  not actually free** — e.g., if the full active rail-position list is large enough that a partial sort becomes
  measurable — that would need a spatial structure (grid bucket by z-slice, since the track is a ribbon) rather
  than a linear scan; not expected to bind given track segment counts already in this codebase (`TRACK_SEGMENTS
  = 400`, ADR-006), but not benchmarked this session.
- **If art review decides the floor genuinely needs to show mirrored scenery** (sky, distant rock, the ship's
  own hull) rather than just streaks under bright emitters — that is an art call, not a technical one (flagged
  up per this report's brief, not decided here), and would settle the D-vs-F floor question in D's favor
  regardless of F's cost advantage.

---

## 5. What is an art call, not a technical one — handed up, not decided here

- Whether the floor's reflections need to show mirrored *scenery* (favoring D) or only streaks under bright
  emitters (favoring F alone) — §4's fallback step 2 depends on this and this report cannot settle it from
  source-reading or static images alone.
- The exact measured falloff curve to encode in F's closed-form term (how fast "brightest at base" fades going
  up a monolith face) — this needs either a second, more careful crop-based measurement pass or an in-engine
  tuning session with the owner watching a live render, not a one-shot guess baked into shader code.
- K (how many nearest emitters get a uniform slot) is a tuning number that trades authoring fidelity against
  popping risk (§4's "what would make this wrong") — a call for whoever implements this, informed by a
  playtest, not fixed here.

---

## 6. Confidence summary and what could not be verified

| Claim | Confidence | Tier |
|---|---|---|
| Installed versions (three 0.185.1, fiber 9.7.0, drei 10.7.8, postprocessing 6.39.4) | High | T2 |
| `emissive` lights only its own fragment, no GI pass (baseline fact this report builds on) | High | T2/T3 (re-confirmed via the sky report's own `meshphysical.glsl.js` citation, not re-read from scratch this session) |
| `light.visible = false` removes it from the render-state light count for that frame | High | T3, `WebGLRenderer.js` `projectObject()` read directly |
| `light.intensity = 0` does NOT remove it from the count (still occupies an unrolled loop slot) | High | T3, `WebGLLights.js` `setup()` read directly, no intensity floor found |
| Light position is a per-frame uniform, not part of the program cache key; light *count* is | High | T3, `WebGLPrograms.js`/`WebGLProgram.js` read directly |
| `RectAreaLight`: no shadows, PBR-only, needs manual `RectAreaLightUniformsLib.init()` | High | T3, class JSDoc read directly |
| `RectAreaLight` costs 2× LTC evaluation (diffuse+specular), each with a texture sample + 4-edge sum | High | T3, `lights_physical_pars_fragment.glsl.js` read directly |
| `RectAreaLightUniformsLib.init()` is not called anywhere in this repo today | High | T2, grepped this session |
| `MeshReflectorMaterial` performs a full extra `gl.render(scene, virtualCamera)` every frame, one FBO per instance | High | T3, `drei/core/MeshReflectorMaterial.js` read directly |
| `postprocessing@6.39.4` ships no SSR/screen-space-reflection effect | High (as "not found in installed package") | T3, searched installed `build/` directly |
| `drei <Lightformer>`'s optional `light` prop spawns a real `<pointLight castShadow>` | High | T3, `Lightformer.js`/`.d.ts` read directly |
| `THREE.LightProbe` exists as a class in three 0.185.1 (resolves prior report's UNVERIFIED flag) | High (existence only) | T3, `LightProbe.js` class found |
| This repo already has a working `onBeforeCompile` precedent (`ship-model.tsx` dissolve shader) | High | T2, read directly |
| Track rail positions are already computed per-frame in plain JS before being packed into `instanceMatrix` | High | T2, `track-view.tsx` read directly |
| The floor's board-12 "reflections" are grazing-angle specular streaks, reproducible without a reflection pass | **Medium** — my own optical read of 3 static JPEGs, not a rendered comparison | Direct image read, flagged explicitly as the report's central unverified bet |
| WebGL2 fragment-uniform-vector floor (224 vec4, GLES3 spec) comfortably covers a K=8–16 position array | Medium-high | General graphics-API knowledge (spec minimum), NOT queried against this project's actual runtime `gl.getParameter` this session |
| This project's `<Canvas>` actually requests a WebGL2 context (assumed, not confirmed) | **Unverified this session** | Flagged |
| `numPointLightShadows`/shadow-casting-count follows the identical cache-key mechanism as non-shadow light counts | Medium — inferred by symmetry with the confirmed non-shadow case, not independently traced | Not read this session |
| `RectAreaLight` practical simultaneous-instance budget (a concrete number) | **Unverified — no benchmark run** | N/A, flagged explicitly, not asserted |
| `MeshReflectorMaterial` frame-time cost on this project's target hardware | **Unverified — no benchmark run** | N/A |
| Whether `@react-three/postprocessing@^3.0.4`'s own wrapper (vs. raw `postprocessing`) exposes anything not in raw `postprocessing`'s effect list | Not re-checked this session (relied on the already-verified pin from `conventions/r3f.md`) | T2 (prior verification), not re-run |
| `Material.customProgramCacheKey()` default = `this.onBeforeCompile.toString()`, at `Material.js:543` | High | T3, read directly |
| drei's `MeshReflectorMaterial` avoids overriding `customProgramCacheKey()` by expressing variability as `defines` instead | High | T3, `core/MeshReflectorMaterial.js` + `materials/MeshReflectorMaterial.js` read directly |
| `ShaderChunk` is a public export (`Three.js:8`); every chunk this report cites is a raw string at `ShaderChunk['<name>']` | High | T3, read directly |
| Instancing/skinning/morph/fog/tonemapping/colorspace/shadow-receiving wiring is object/scene-driven, not material-type-gated, and applies to plain `ShaderMaterial` (not `RawShaderMaterial`) | High | T3, `WebGLPrograms.js`/`WebGLProgram.js` read directly, multiple specific line citations |
| A `ShaderMaterial` does NOT auto-inherit `scene.environment`, but manually setting `material.envMap` to an already-PMREM'd texture DOES restore the full cubeUV define/uniform pipeline | High | T3, `WebGLPrograms.js` `getParameters()` read directly, both branches traced |
| `postprocessing@6.39.4`'s typed API/build reference only `WebGLRenderer`, zero `WebGPURenderer` occurrences — TSL/node-material path foreclosed while postprocessing owns bloom | High | T3, typed API + build grepped directly |
| `three@0.185.1` itself ships a `./webgpu` export (the node-material path exists in the installed three version; postprocessing is what forecloses it, not three) | High | T2, `package.json` `exports` read directly |
| Rung 4 (hand-rolled BRDF) still gets IBL roughness→mip sampling "for free" as a reusable chunk (`cube_uv_reflection_fragment`), independent of which direct-light BRDF is used | Medium-high | T3, chunk read (186 lines), reasoned separability — not implemented/rendered to confirm no hidden coupling |
| The near-field-term data design (K-position uniform array) is fully separable from the BRDF/rung choice, making rung 2→4 a safe, non-bundled later escalation | Medium — architectural reasoning, not tested by building both | Inference from verified chunk/define mechanics, not an implementation |

**Could not verify this session, listed plainly, not shipped as fact:** (1) whether the specular-streak theory
in §1 actually survives a real render at this project's chosen floor roughness/metalness — the single most
important open item, and the report's explicit fallback ladder exists because of it; (2) `MeshReflectorMaterial`
and RectAreaLight concrete frame-time costs on target hardware — no profiling tool was run; (3) this project's
actual WebGL context type and live `MAX_FRAGMENT_UNIFORM_VECTORS` value; (4) whether shadow-casting light counts
follow the exact same cache-key mechanism as the non-shadow counts (inferred by symmetry, not traced);
(5) whether rung 2 (patched `MeshStandardMaterial`) actually reaches the measured specular-streak character
well enough that rung 4 (hand-rolled BRDF) is never needed — no rendered comparison between rungs was built
this session; the recommendation to start at rung 2 and escalate only on a named visual failure is an
architectural/cost argument, not a rendered A/B result.
