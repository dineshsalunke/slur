# Research — a fully procedural deep-space background that also lights the scene

**Task:** `.claude/art-pass/01-background/README.md`. **Date:** 2026-09-18. **Status:** research (no code
shipped by this report).

---

## 0. Scope and what was actually verified

Every API claim below is tagged with a source tier:
- **[T1]** official docs for the installed version
- **[T2]** this repo — README/CHANGELOG/typed API
- **[T3]** upstream source, read directly (`node_modules/.pnpm/...`, three.js source) — used as last resort
- **[UNVERIFIED]** could not confirm this session; flagged, not shipped as fact

Installed versions, verified **[T2]** from `pnpm-workspace.yaml` catalog + `apps/client/package.json` this
session: `@react-three/fiber` `^9.7.0`, `@react-three/drei` `^10.7.8`, `@react-three/postprocessing` `^3.0.4`
(wraps `postprocessing` `^6.39.4`, peer `three >= 0.168 < 0.186`), `three` `^0.185.1`, React `^19.2.8`. This
matches `conventions/r3f.md`'s pinned versions **[T2]**.

Current implementation read in full **[T2]**, `apps/client/app/game/scene/`:
- `scene-backdrop.tsx` — a single `nebula-backdrop.jpg` set via `<primitive attach="background">`. Header
  self-documents as temporary. Used only by `/art-lab` (grepped; the only importer).
- `environment.tsx` + `env-config.ts` — the **live in-game** sky: flat `<color attach="background">`, linear
  `<fog>`, an optional `<GradientDome>` (a hand-painted vertical-gradient `CanvasTexture` on a camera-locked
  `BackSide` sphere, `toneMapped={false}`, `depthWrite={false}`), drei `<Stars>`, and instanced parallax
  "canyon wall" slabs — all riding a `<SkyFollow>` group that copies camera *position* (not rotation) every
  frame. The shipped variant is `GRID_VOID` (`ENV_VARIANTS[2]`).
- **Neither path sets `scene.environment`.** There is no IBL today — every `roughness`/`metalness` on a prop
  in the live game is currently unlit by environment, only by whatever direct lights exist elsewhere in the
  scene (not read for this report — out of scope, but relevant: task 1 is not starting from a working IBL
  baseline, it is starting from none).

Read `drei` source directly for every claim about `<Environment>`, `<Stars>`, `useEnvironment`, and
`three`'s `PMREMGenerator` — see inline citations. Reference boards read as images: `12` (top precedence),
`13`, `01`, `05`.

---

## 1. What board 12 actually shows — and the lighting model it implies (README §7 Q1 and Q3)

**Revised 2026-09-18 after native-resolution crops.** The original pass of this section answered "is the
flare the key light?" inside a conventional key/fill/rim framing, because that is how the README's Q1 posed
it. That framing is a reflexive default and, per the owner's correction, the wrong model for board 12. Three
new crops were read directly this session: `12_approved_scene_marigold_depth.L-monoliths.jpg`,
`…R-planet-star.jpg`, `…floor-ship.jpg`.

**What the crops actually show:**
- **`L-monoliths`:** every monolith's track-facing edge is a bright vertical seam, and its brightness is
  **not uniform top to bottom** — it is brightest at the base, at floor level, and visibly falls off going
  up the face. A directional light (sun-like, parallel rays, effectively infinite distance) lights a flat
  vertical face **evenly** regardless of height — a top-to-bottom falloff on a vertical plane is the
  signature of a **near-field point/line emitter at the bottom of that plane**, not a distant directional
  source. The emitter is the seam itself (or the adjacent rail), not the sky.
- **`R-planet-star`:** the star is real, sharp, and clearly the brightest single point in the whole image —
  but tracing what it visibly touches: the asteroids' upper-right facets pick up a cool rim highlight, and
  the planet's limb shows a lit/unlit terminator boundary consistent with light from that direction. The
  **monolith standing directly under/near the star in this same crop is unlit by it** — its brightness comes
  from its own vertical seam (visible mid-crack of glowing amber), identical in character to the seam in
  `L-monoliths`. The star lights *rock and planet*, not *track furniture*, in the same frame, side by side.
- **`floor-ship`:** the floor (graphite, per the palette) is **near-black everywhere except direct
  reflections** — the rail line, the dashed seam markers, the ship's own three engine trails pooling
  underneath it as reflected streaks, and a pickup diamond casting a distinct vertical reflection column.
  There is no broad, soft, diffuse-lit patch anywhere on the floor of the kind a strong ambient or a large
  soft key would produce. Every bright floor pixel traces to a specific, nearby, warm emissive object
  reflecting in a glossy (not matte) surface.
- Shadow-side faces (the monoliths' left/back faces, the floor between rail lines) go to near-black — no
  fill light is doing any work. Board `13` states this as text on the board itself: **"COLD SPACE. WARM
  LIGHT."**

**Corrected model** (four distinct light roles, not one key/fill/rim rig):
1. **Warm, dominant, near-field** — the gameplay emissives themselves (rail line, seam dashes, monolith
   seams, pickups, ship engines) are the actual light the track reads by. They must behave as real
   near-field sources with real falloff and real reflection on the glossy floor, or the base-brightest
   monolith falloff and the floor's reflection-only brightness pattern cannot be reproduced.
2. **Cold, distant, single** — one star. It rim-lights/specular-highlights rocks and the planet terminator.
   It reaches the track only faintly if at all (board 12 shows it *not* meaningfully touching the near
   monolith in the same frame it clearly touches the far rock field).
3. **Cold, very low sky ambient** — enough to keep the far asteroid field legible as more than silhouettes
   (there is visible cool light on rock facets throughout, not pure black-on-black), essentially irrelevant
   at track level (the floor stays near-black between reflections).
4. **No fill.** Shadow sides are allowed to go essentially black — this is a stated art-direction choice
   ("deep shadows"), not a gap to patch.

**(a) Answering Q1 directly, corrected:** the sky is **not** the track's key light, and never needed to be.
The star is a real, legitimate cold light — but its job is the **far field** (asteroids, planet terminator),
not the racing surface the player is actually looking at most of the time. The thing that makes the track
readable and "warm" is the **gameplay emissive geometry acting as near-field light**, which is an entirely
different problem from "what does the sky emit." This **narrows task 1's lighting scope substantially**: task
1 must supply (2) and (3) above — a single cold distant light plus a very low sky-IBL contribution for the
rock field — and does **not** need to solve, or even meaningfully touch, the track's own illumination. That
becomes a load-bearing but *separate* question, scoped in the new §5 below, that this task should flag
upward rather than absorb.

**(b) How much light does the far field actually need, concretely:** enough to (i) put a visible cool
specular/rim highlight on asteroid facets so the rock wall reads as dimensional silhouettes rather than flat
black cutouts, and (ii) draw a soft but legible day/night terminator line across the planet's limb. Both are
**highlight-scale, not scene-illumination-scale** — a low-intensity, small-angular-size, high-contrast source
firing at grazing angles across matte rock and a shaded sphere. Given ~55–65% of the upper frame is rock
(§1 original observation, still holds), this is a real cost/benefit shift on the bake path (§2's options
A/B/F): the environment-map contribution can be **much dimmer overall** than a "make roughness 0.2 vs 0.9
visibly different everywhere" framing implies, because the surfaces that need to visibly discriminate
roughness in board 12 are specifically the **rock and the planet**, not the whole scene uniformly. This is
good news for the tension in README §2 — a genuinely dim, art-directed sky (matching the ~linear 0.01 the
brief measured on the old bitmap) may be much closer to *sufficient* for the far field than it is for a
scene-wide IBL, precisely because the far field is the only thing meant to be lit by it. The self-test in
README §4 ("`roughness 0.2` vs `0.9` must look visibly different") should be run **on a rock-like matte
material near the asteroid field**, not on an arbitrary probe sitting on the track — testing it on the track
risks concluding "the sky is too dim to light anything," which board 12 says is *correct*, not a bug.

**(c) Should the star be a real, separate directional light, or a bright spot baked into the cubemap that
PMREM convolution then blurs away? Recommend: a real, separate `DirectionalLight`, not (only) a baked spot.**
Reason: PMREM's whole purpose (verified §3.4/§2A, `PMREMGenerator`'s GGX-VNDF importance-sampled prefilter)
is to produce blurred, per-roughness-level radiance suitable for *diffuse/glossy* reflection sampling — it is
explicitly **not** designed to preserve a small, hard, high-frequency point like a star as a sharp specular
highlight; convolving a single bright pixel into a 256×256-per-face cubemap at typical PMREM resolutions
will either wash it into a barely-there smear or, if boosted in intensity to survive convolution, blow out
the surrounding sky region unrealistically. A real `DirectionalLight` (cheap — one of three.js's lightest
light types, no area/shape math) pointed to match the flare's screen direction gives materials a crisp,
correctly-falling-off specular highlight and a real, sharp terminator on the planet — exactly what
`R-planet-star` shows — while the **sky IBL's job shrinks to just the low, cold ambient fill** for the rock
field (role 3 above), which is exactly what PMREM is good at. This also directly answers §1's original open
"medium confidence" hedge: the flare does **not** need to be sky-sampled content at all; it should be a
hand-placed light, decoupled from whatever the display dome/nebula shader renders, exactly as this report's
original draft speculated but did not commit to. **Recommendation revised accordingly in §4.**

---

## 2. Five-plus distinct approaches

### A. Procedural dome/skybox shader (display) + baked PMREM (light) — the "split" architecture

A `BackSide` sphere or a fullscreen-triangle shader (drei's `<Sky>` pattern, generalized) renders stars +
nebula + the celestial body procedurally, camera-following like the current `GradientDome`/`SkyFollow`. In
parallel, **once at load** (not per-frame), that same generator (or a simplified/brighter variant of it) is
rendered into an offscreen scene and converted to a PMREM via `THREE.PMREMGenerator.fromScene(scene, sigma,
near, far, options)` **[T3, verified from `three@0.185.1` source, `PMREMGenerator.js`]** — this produces a
`WebGLRenderTarget` whose `.texture` is assigned to `scene.environment`. `fromScene` exists specifically
because rendering a live Scene into a PMREM avoids a network image roundtrip **[T3, JSDoc: "can be faster
than using an image if networking bandwidth is low"]** — an intentional design point that lines up with our
"no network fetch" constraint.
- **Light:** yes — full PMREM, prefiltered per roughness (GGX-VNDF importance sampled, per the same JSDoc).
  This is the *only* representation `MeshStandardMaterial` actually consumes correctly across the whole
  roughness range; a flat cubemap or equirect without PMREM pre-filtering will look correct only at very low
  roughness and be undersampled/noisy at high roughness.
- **Cost:** one-time (or on config change) `fromScene` call — a handful of cube-face renders at generator
  resolution (default 256, tunable via `options.size`); zero per-frame GPU cost after that. Memory: one
  `WebGLCubeRenderTarget`-derived PMREM texture (~mipmapped, small — 256² × 6 faces × mip chain, comparable to
  a compressed HDRI).
- **Parallax:** the *displayed* dome can still ride the camera every frame exactly as today (`SkyFollow`); the
  **baked light** is static regardless of camera motion — which is correct, because IBL is meant to represent
  distant, direction-only lighting, not something that should visibly shift as the ship moves 500 units down
  a straight track.
- **Cold/desaturated fit:** excellent — the shader fully controls palette; nothing forces saturation.
- **Makes hard later:** a *decoupled* bake means changing the display sky (new nebula colour, moved flare)
  requires **re-running the bake** to keep light and sky consistent, or accepting they drift. This is
  manageable (bake on mount / on a `sector` change, not per-frame) but is a real coupling surface a naive
  reading of the "decouple background from lighting" README hint might miss — the two are still one visual
  idea, just two renders of it.

### B. Live dual-target render (display shader ≠ light shader), no bake, always dynamic

Two separate shader graphs: a display-only dome (dim, desaturated, exactly what's on screen) and a **second,
brighter/simpler proxy scene** — e.g. a large soft sphere/gradient plus the flare — rendered every N frames
(or once) directly into a small equirect/cube render target sampled by `PMREMGenerator.fromEquirectangular`
or `fromCubemap` **[T3, same file]**. This is architecture A generalized: the light source is an intentionally
*different, art-directed, brighter* asset than the display sky, not merely a rescaled version of it.
- **Light:** yes, same PMREM path.
- **Cost:** same as A if baked once; higher if re-baked periodically (there is no reason to re-bake it every
  frame in this game — nothing in the sky moves relative to world space fast enough, or at all, to need it).
- **Parallax:** display dome free to parallax; light proxy is static and never needs to.
- **Cold/desaturated fit:** best of all options for the *tension itself* — the light source's own colour and
  intensity are a **free parameter**, fully decoupled from what reads on screen. This is the literal
  `backgroundIntensity`/`environmentIntensity` split the README calls "one candidate," implemented at the
  *content* level instead of (or in addition to) the *scalar* level.
- **Makes hard later:** two assets to keep art-directed in sync by hand (there is no automatic reason the
  light-proxy's flare position matches the displayed flare's position) — an explicit invariant someone has to
  maintain, e.g. a single source-of-truth "flare direction" constant feeding both.

### C. `drei <Environment>` with local files/`map`, `backgroundIntensity`/`environmentIntensity` split

Use drei's `<Environment>` **[T3, `Environment.d.ts`/`.js`, drei 10.7.8]** directly. Verified this session:
`EnvironmentProps` includes `background`, `backgroundIntensity`, `backgroundRotation`,
`environmentIntensity`, `environmentRotation` as **independent** props — confirms the README's "standing
fact" is real, not recalled. `<Environment preset="...">` internally calls `useEnvironment`, which for
`preset` sets `path = CUBEMAP_ROOT = 'https://raw.githack.com/pmndrs/drei-assets/...'` **[T3, `useEnvironment.js`
line 8]** — **confirmed forbidden** per the standing fact; `preset` must never be used. `files` (local
paths, e.g. an HDR/EXR in `public/`) or `map` (a `Texture` you already own, including one you built with
`PMREMGenerator` yourself) both avoid any network path — `useLoader` resolves relative to `path`/`public/`,
same as any other local asset. Internally, `EnvironmentCube`/`EnvironmentMap` still runs `applyProps` to set
`backgroundIntensity`/`environmentIntensity` on the scene independently **[T3, `setEnvProps` in
`Environment.js`]**.
- This is not a sixth "distinct" technique in the geometric sense — it's the *packaging* around A/B (drei's
  convenience wrapper for PMREM-from-file, or PMREM-from-a-scene-you-render-yourself via `map`). Listed
  separately because it is the path of least implementation friction if the team decides the source asset
  can be **pre-baked to a static local HDR file at build/authoring time** rather than generated live in the
  browser at all (see D).
- **Cost:** near-zero at runtime if `files` points to a small local `.hdr`; loader work happens once via
  `useLoader`'s cache.
- **Makes hard later:** if the HDR is authored once outside the running app (Blender/an offline script) it
  stops being "fully procedural" in the sense of "generated by the client at runtime" — worth flagging since
  the brief says "fully procedural (no bitmaps)." A `.hdr`/`.exr` is technically still a bitmap on disk, even
  if it was procedurally generated to produce it. This conflicts with README §4 "Zero bitmap dependency" if
  read strictly — see §6 confidence note.

### D. Layered parallax billboards/points (no dome geometry) + tiny analytic light rig

Stars as an instanced point sprite field (drei `<Stars>`, or a hand-rolled `<Points>`/`<InstancedMesh>`
variant — see §3 below), nebula as a small number of large, soft, alpha-blended billboards (drei `<Cloud>`
**[T3, `Cloud.d.ts`, drei 10.7.8]** — built on `MeshLambertMaterial`, i.e. it *does* respond to scene lights,
which is a real, if minor, mechanism for the nebula to inherit whatever key light exists rather than being
pure unlit emissive) at multiple depths for a manual parallax layering, and the celestial body as one
textured/shaded sphere. **No dome mesh, no PMREM at all** — lighting for the scene comes from ordinary
`DirectionalLight`/`AmbientLight`/`HemisphereLight` placed to match the flare's apparent direction, entirely
independent of what the billboards render.
- **Light:** IBL in the strict sense: **no**. This sidesteps the tension by rejecting its premise (per the
  README's explicit invitation to consider "the lighting may not need to come from the sky at all"). A
  `HemisphereLight` (sky-colour/ground-colour, cheap, ambient-only) plus one `DirectionalLight` matching the
  flare gives materials the roughness/metalness read the falsifiable self-test demands, without ever touching
  `scene.environment`.
- **Cost:** cheapest of all options — no PMREM generation, no cube-camera pass, a handful of billboard draw
  calls plus one star-points draw call. Lights are two cheap analytic types.
- **Parallax:** billboards at explicit depths parallax by construction (this is the *only* option here with
  genuine multi-depth parallax rather than a single infinite-radius shell) — matches README's "near star
  layers shift against the far field" requirement more literally than a single-shell dome does (the current
  `SkyFollow` shell has **zero parallax between layers**, since dome+stars share one group and one camera-
  copy; see §3).
- **Cold/desaturated fit:** good — `MeshLambertMaterial`/`MeshBasicMaterial` billboards are just as
  controllable as a shader for palette; no forced saturation.
- **Makes hard later:** roughness/metalness reads correctly for *diffuse and rim response* but **misses
  reflections** — a metal prop's mirror-like environment reflection (a recognizable smeared streak of "the
  sky" across a curved chrome surface) requires an actual environment map; two point/directional lights
  cannot fake that. If the art direction cares about specular reflections of the environment on ships/track
  (plausible — board 12's floor is glossy and reflects the marigold rail lines), this option under-delivers
  on the *specific* failure mode named in the brief ("every prop's roughness/metalness becomes invisible" —
  ambient+directional fixes the *diffuse* half of that but not mirror reflection).

### E. Raymarched volumetric nebula (fullscreen post-pass or dome-fragment raymarch)

A fragment shader raymarches an FBM density field along the view ray against a dome or fullscreen quad
(the "shadertoy nebula" family — e.g. the well-known approach in Inigo Quilez's FBM/raymarch writeups and its
many "space nebula" shader derivatives). Produces genuinely volumetric-looking cloud structure with
self-shadowing/light-scattering terms if desired.
- **Light:** no direct IBL path — a raymarched fragment shader's output is a 2D image on a dome, not a cubemap
  three can prefilter without an extra bake step (which folds this back into option A/B: raymarch once into a
  cubemap render target, then PMREM it).
- **Cost:** **highest of every option** if run per-frame full-screen (per-pixel raymarch loop, typically
  16–64+ steps) — this is the one candidate the "must not cost frame time during a race" constraint actively
  penalizes if implemented naively. Affordable only if (a) baked once to a texture/cubemap and never
  raymarched again at runtime, or (b) resolution/step-count are aggressively capped and it's confined to a
  small screen fraction (unlikely for a full backdrop).
- **Parallax:** a raymarch against a fixed dome radius parallaxes exactly like option A (single shell, one
  group, one camera-follow) — no more, no less.
- **Cold/desaturated fit:** the technique itself is neutral on palette, but the genre's popular reference
  implementations (bright saturated blue/purple/pink "shadertoy nebula") are precisely the aesthetic the art
  direction excludes (README explicitly calls this out) — hitting *restrained* would mean deliberately fighting
  the idiom's usual tuning (crank down saturation, cap density, keep the colour ramp to 2–3 cold stops), not
  a limitation of the math itself.
- **Makes hard later:** the most expensive to author and debug (shader-only, hard to art-direct interactively
  without a live-reload GLSL workflow); the biggest gap between "impressive tech" and "restrained art
  direction" of any option here — highest risk of scope creep into something that reads as a normal
  saturated nebula and needs deliberate suppression.

### F. Generate-once-to-cubemap via a cube camera at load, feed straight into `<Environment>`'s `map`/`scene` path (drei `EnvironmentPortal`)

Distinct from A/B in *how* the bake happens: instead of hand-calling `PMREMGenerator`, use drei's own
`EnvironmentPortal`/`<Environment>` with `children` — verified **[T3, `Environment.js` lines 86–159]**: when
`Environment` receives `children`, it renders them into a `virtualScene` via `createPortal`, drives a
`CubeCamera` (`args=[near, far, fbo]`), and (when `frames=1`, the default-friendly single-shot mode) updates
the cube render target **exactly once** then never again, before calling the same `setEnvProps` used in A.
This is architecturally "A" but wired through drei's existing component instead of a hand-written
`PMREMGenerator` call — i.e., it is drei's *supported*, in-repo mechanism for "build my own procedural scene,
then use it as the environment," which is closer to the project's stated preference (README's "generated-once
cubemap" bullet, worded almost exactly to this API).
- **Light:** yes, full PMREM under the hood — drei's `EnvironmentCube`/`useEnvironment` machinery still ends
  in a `CubeReflectionMapping`/PMREM-ready texture assigned to `scene.environment`.
- **Cost:** one cube-camera render pass (6 faces) at whatever `resolution` prop is set (default 256), at
  mount time only (`frames=1`); zero thereafter.
- **Parallax:** the *baked* content obviously does not parallax (same as A/B); nothing stops a **separate**,
  ordinary always-rendered dome+stars+billboards stack (any of A/B/D's display layer) from being the thing the
  camera actually sees, with this portal purely feeding light.
- **Cold/desaturated fit:** identical to A — whatever procedural children you put in the portal is what gets
  baked; full control.
- **Makes hard later:** same sync-drift risk as B if the portal's children and the on-screen dome are
  authored as two different JSX trees — smallest risk if they are literally the *same* component instanced
  twice (once live, once inside the portal), which is straightforward given the procedural generator is just
  a function of a few uniforms/colours.

**Not separately enumerated as a seventh option, but worth naming:** drei's `<Sky>` (Preetham/Nishita
atmospheric scattering, **[T3, confirmed present at `core/Sky.d.ts`]**) was inspected and rejected outright —
it is an atmospheric-scattering model for a planet's *daytime* sky (sun-elevation-driven blue/orange
gradient); there is no way to make it read as "cold deep space" without fighting its entire premise. Not
counted as a genuine candidate.

---

## 3. Specific technical questions

### 3.1 Star fields under motion

Read drei's `Stars` source in full **[T3, `Stars.js`, drei 10.7.8]**:
- It is a single `THREE.Points` draw call, custom `ShaderMaterial` (`StarfieldMaterial`), positions computed
  once in a `useMemo` (spherical-random distribution, `genStar`), **additive blending**, **`depthWrite:
  false`**, and a **soft circular falloff** in the fragment shader (`1/(1+exp(16*(d-0.25)))`) gated by the
  `fade` uniform — this soft-edged falloff is exactly the kind of thing that suppresses the single-hard-pixel
  aliasing/flicker that plain 1px `gl_PointSize` stars produce under sub-pixel camera motion. Point size is
  computed as `size * (30 / -mvPosition.z) * (3 + sin(time + 100))` — i.e. size shrinks correctly with
  distance (perspective-correct point attenuation) **and** every star pulses in lockstep via one shared
  `sin(time)` term (a fake "twinkle" — not per-star-phased, so on close inspection all stars pulse
  identically; likely invisible at gameplay distance/speed but worth knowing if a reviewer asks why the whole
  field seems to breathe together).
- **Crucially, in this codebase's usage:** the whole `<Stars>` instance is nested inside `<SkyFollow>`, which
  copies **only `camera.position`**, never rotation, into the wrapping group every frame (verified
  **[T2]**, `sky-follow.tsx`). Because the star positions are generated once in world-relative-to-group space
  and the group re-centers on the camera every frame, **the stars never move relative to the camera at all**
  — they have **zero apparent motion, zero crawl, zero shimmer**, by construction, at the cost of also having
  **zero parallax** (this is the direct answer to README's parallax requirement for stars: today's
  implementation does not parallax star layers against anything — it makes them perfectly camera-locked,
  which is a stronger and cheaper guarantee than parallax, but is not what §4's "near star layers shift
  against the far field" describes).
- Practitioner consensus on the general "stars at speed" failure mode (aliasing/crawl), independent of this
  specific library: the dominant failure is **sub-pixel point positions crossing pixel boundaries as the
  camera translates**, producing 1-pixel popping/shimmer — worse the smaller/harder-edged the point. The
  common mitigations, roughly in order of how much they cost: (a) **soft/anti-aliased point sprites** (a
  radial falloff texture or the analytic falloff drei uses) instead of hard 1px points — cheapest, and what's
  already installed; (b) **camera-locked shells with no relative motion** (what this repo already does) —
  eliminates the failure mode entirely by eliminating motion, at the cost of no parallax; (c) **baked star
  textures on a dome** (a single equirect/cubemap painted once) — zero per-frame cost, no shimmer by
  definition (it's a static texture), but is a bitmap and cannot easily vary count/density/twinkle live; (d)
  **temporal supersampling / TAA** — not applicable here (no TAA pass in this stack; `EffectComposer` with
  `multisampling={0}` per `conventions/r3f.md` explicitly favours cheap bloom over MSAA/TAA).
- **Confidence: high** on the drei source reading; **medium** on "zero parallax is fine for this game" — that
  is an art call, not a technical one, and is exactly README open question 4's territory.

### 3.2 Cold, believable nebulae — noise constructions (sourced this session — `WebSearch`/`WebFetch`, 2026-09-18)

**This subsection was previously unsourced general knowledge; it has now been checked against original
practitioner sources.** Tiering note: these are **not** the project's own docs/repo, so none of this is
T1/T2 — everything below is either primary-author writing (Inig Quilez's own site) or a practitioner blog,
tiered explicitly as such, distinct from the drei/three source-code tier used elsewhere in this report.

**The canonical technique — domain-warped FBM.** Inigo Quilez's own article, read directly
([iquilezles.org/articles/warp](https://iquilezles.org/articles/warp/) — primary source, the technique's
originator), gives the recipe: `q = fBm(p)`, `r = fBm(p + q)`, `result = fBm(p + r)` — feeding fractal
Brownian motion noise back into its own domain before the final evaluation, iterated 2–3 times, producing the
"flowing, wispy" structure recognizable as the entire genre of nebula/smoke/marble shaders. The article does
**not** itself discuss colour or saturation — it treats warping purely as a *shape* operation; colour is
applied afterward by whoever uses the technique, and is not part of Quilez's own contribution. This matters:
**the warp technique is saturation-neutral.** Any claim that domain-warped FBM is inherently "the saturated
shadertoy look" is wrong — the saturation comes entirely from what happens downstream of the warp.

**Where saturation actually comes from, and the two poles of practitioner disagreement:**
- **The maximalist pole — "Star Nest"** (Pablo Andrioli / shadertoy user "Kali", `shadertoy.com/view/XlfGRj`,
  MIT-licensed, one of the most reused nebula shaders on the web — confirmed via `WebSearch` across multiple
  independent ports/mirrors including a Godot port and a Natron/OFX preset). It is domain-warped FBM
  raymarched through a volume, with an explicit exposed **`saturation` uniform defaulting to `0.850`** and
  a full HSV-driven rainbow colour cycle across the noise field. This is very plausibly the exact "saturated
  blue-purple galaxy" silhouette the art direction calls out and rejects — it is a demoscene showpiece where
  maximum colour and iteration count *is the point*, not an incidental default.
- **The restraint pole — production/game-adjacent practice.** A detailed practitioner writeup,
  [pegwars.blogspot.com, "Rendering Nebulae" (2018)](http://pegwars.blogspot.com/2018/12/rendering-nebulae.html)
  (read directly), describes a raymarch that accumulates density from an FBM function exactly like Quilez's,
  but makes two restraint-driving choices explicitly, in the author's own words: (1) colour is **not**
  procedural at all — density is used as a 1-D lookup into a **hand-drawn gradient texture sampled from real
  NASA nebula photographs**, i.e. the entire palette is authored once, by eye, off a real reference, not
  generated from noise math; and (2) domain-warp magnitude must stay **subtle** — the author states directly
  that "the variation during the raymarch ended up needing to be very subtle, or the noise field quickly
  degenerates from a lovely blobby or wispy and cohesive image into a torrid mess." This is a named,
  first-hand account of *exactly* the failure mode the art direction is trying to avoid, and a concrete lever
  (warp amplitude) for avoiding it — independent of, and complementary to, the colour-ramp restraint already
  identified in the prior draft of this section.
- **A concrete, R3F-adjacent production example** — [ux3d.io's own site background](https://ux3d.io/en/blog/threejs/)
  (a real shipped react-three-fiber project, described by its authors; read via `WebFetch`, tier: project
  blog, not primary research): fractal **simplex** noise (not value-noise), **two separate noise layers each
  driving a separate colour layer** (rather than one noise field driving one ramp), rendered **per-frame on a
  spherical mesh, not baked**, explicitly to avoid "several tens of megabytes" of baked texture. Stars are a
  **two-layer system** — a base layer of simple one-pixel-scale noise stars, plus a second Voronoi-noise layer
  for a smaller number of larger, variable-size stars, both with a shared sinusoidal twinkle. This is
  independent confirmation that a fully live (non-baked) shader dome is a used-in-production pattern at this
  project's exact stack layer (three.js via R3F), not merely theoretically possible.

**Where practitioners genuinely disagree** (stated plainly, not resolved by picking a side): the maximalist
lineage (Star Nest and its many derivatives — by far the most-forked/most-viewed nebula shader on Shadertoy,
per the search results) treats **high iteration count, wide hue rotation, and high saturation as correct
outputs of the technique**, not artifacts to suppress — for that community the "colourful galaxy" look *is*
the deliverable. The restraint lineage (the pegwars writeup, and implicitly any production VFX pipeline that
nebula-shader authors describe themselves as borrowing from) treats the same underlying FBM/warp math as
a *shape generator only*, and does the actual art-direction work entirely in a hand-authored, narrow-range
colour ramp plus a deliberately dialed-back warp amplitude. **Both camps use the identical core math
(domain-warped FBM)** — the disagreement is entirely about what happens after the density field exists:
procedural rainbow HSV cycling (maximalist) versus a curated 1-D gradient sampled from real references, held
to a narrow value range (restrained). For this project's cold/desaturated/low-contrast mandate, the evidence
points clearly at the restraint camp's *specific* levers — narrow hand-authored ramp + subtle warp amplitude
+ low octave count — as the concrete, sourced answer to "what do practitioners actually do to avoid the
saturated look," not merely this report's own inference from first principles (as the prior, unsourced draft
of this section had to rely on).

**Confidence:** high that domain-warped FBM is the dominant technique family (multiple independent primary
and practitioner sources agree); high that saturation is a downstream/colour-ramp choice, not inherent to
the noise (Quilez's own article never touches colour; Star Nest's saturation is an explicit, separate,
tunable uniform); medium-high on "narrow hand-authored ramp + subtle warp" as *the* practitioner-recommended
restraint lever specifically (strong single first-hand source — pegwars — corroborated in spirit by the
maximalist camp's inverse behaviour, but not cross-checked against a third independent restrained-nebula
writeup this session).

- This project already has a hand-rolled, dependency-free, **trig-free coherent value-noise** implementation
  in `@slur/shared/src/sim/noise.ts` (`valueNoise1D`/2D + `smoothstep`) **[T2, read this session]**, built for
  the (unrelated) determinism-constrained track generator. It is **not** subject to the sky's determinism
  requirements (README explicitly: the sky "never enters the shared simulation" and "has no determinism
  requirement") — but it is a proven, already-tested, zero-new-dependency 2D value-noise primitive sitting
  right there, usable to bake a nebula texture (canvas or render-target) with **no new npm package**. The
  ux3d.io example above uses **simplex**, not value-noise, specifically for better visual isotropy — a real
  tradeoff (value-noise: simpler/already-vetted/zero-dependency vs. Simplex: avoids the axis-aligned
  grid-artifact look value-noise is known for at low octave counts). **Not independently verified this
  session which reads better in practice for this specific palette — this is a call for a quick visual
  spike, not a documentation lookup.**

### 3.3 Large celestial body — terminator, rim light, cold and desaturated

A gas giant/moon/crescent (board `05`'s three frozen types) needs: (1) a day/night terminator with soft
falloff (`dot(N, L)` remapped through a smoothstep band, not a hard clip) — a couple of lines of GLSL on a
`ShaderMaterial`, or achievable with a **stock** `MeshStandardMaterial`/`MeshPhysicalMaterial` if lit by a
real `DirectionalLight` positioned to match the flare (letting three's own PBR terminator math do the work,
consistent with README's framing of the flare as a coupled key); (2) **rim light** specifically (light
wrapping the silhouette edge, visible even on the night side) is *not* something a standard PBR terminator
produces on its own (physically, a diffuse sphere's night side is simply dark) — the "rim glow" seen on
boards `05`/`12`/`13` is an **atmospheric-scattering-style rim term**, commonly faked with a
`pow(1 - dot(N, V), k)` fresnel-style rim added on top of the base shading (cheap, one extra term, does not
need a real atmosphere sim); (3) staying cold/desaturated is purely a palette choice on the diffuse map/ramp
and the rim tint — nothing about terminator/rim math forces warmth. This is squarely a custom
`ShaderMaterial` job (a stock `MeshStandardMaterial` cannot add a rim term without an `onBeforeCompile` patch
or a wrapped material) — small, well-scoped, and independent of which of A–F wins for the sky/nebula, since
the body is one extra mesh either way.

### 3.4 The IBL path end to end

Concretely, for **any** option that produces IBL (A, B, C, F): `scene.environment = <PMREM texture>.texture`
(a `WebGLRenderTarget`'s `.texture`, `CubeReflectionMapping` or PMREM-native mapping) is what
`MeshStandardMaterial`/`MeshPhysicalMaterial` sample for both diffuse irradiance and specular reflection at
render time — this is three's standard PBR IBL contract, not something this project invents. **Where the
conversion happens:** either (a) hand-called once via `new THREE.PMREMGenerator(gl).fromScene(...)` /
`.fromEquirectangular(...)` / `.fromCubemap(...)` **[T3, verified signatures this session]**, assigning the
result to `scene.environment` directly (bypassing drei), or (b) drei's `<Environment>` does the equivalent
internally and exposes it as JSX (`EnvironmentCube` for `files`/`preset`, `EnvironmentPortal` for
`children`-driven cube-camera capture) **[T3, verified `Environment.js`]** — same underlying three machinery,
different ergonomics. **Cost:** the PMREM convolution itself is a handful of shader passes over a small
cubemap (default 256×256×6) — on the order of low-single-digit milliseconds on a bad day, and it is a
**one-time** (or on-sector-change) cost, never a per-frame one, provided nothing re-triggers the bake every
render. **When it runs:** at mount (or when the sky's generating parameters — sector, seed — change), inside
a `useLayoutEffect`/`useMemo`-driven one-shot, never inside `useFrame`. **Per-material cost is separate and
already a standing fact [T2, INDEX.md §4]:** `envMapIntensity` is per-material, so every `MeshStandardMaterial`
that should be lit by this environment needs it set explicitly (or defaulted via a material factory) — a
scene-level intensity does not retroactively fix materials that don't sample the environment at all.

### 3.5 Determinism / cost / offline constraints

Confirmed **[T2, README + non-negotiables]**: the sky is cosmetic, never enters `simulate()`, so none of the
project's determinism rules (`sim/noise.ts`'s trig-free/no-transcendentals constraint) apply to it — a sky
shader is free to use `sin`/`cos`/`pow`/whatever GLSL offers. The two constraints that **do** bind: (1) **no
per-frame cost during a race** — rules out E (raymarch) unless baked, and rules out any "regenerate the
nebula every frame" scheme; a one-time bake (any of A/B/C/F) or an always-cheap display shader (a dome
fragment shader with a *few* FBM octaves, evaluated per-pixel once per frame, is genuinely cheap — full-
screen-ish pixel count but simple math, unlike a multi-step raymarch) both satisfy this. (2) **zero network
fetch, fully offline/LAN** — rules out `<Environment preset="...">` outright (confirmed CDN URL in source,
§2C) and rules out any external texture/HDR CDN; local `public/` assets or fully generated-in-browser content
both satisfy it.

---

## 4. Recommendation

**Recommend option F (drei `<EnvironmentPortal>`-style generate-once-to-cubemap) as the IBL mechanism,
paired with a hand-rolled procedural dome+billboard display stack (the display half of D, not a raymarch)
as what's actually seen on screen, with the SAME generator function instanced twice — once live for display,
once inside the portal for the bake.** In short: **F for the light, D's display architecture for the pixels,
sharing one source of truth for palette/flare placement so B's "two assets drift" risk doesn't materialize.**

Concretely:
- **Display layer:** keep the existing `SkyFollow` camera-locked shell pattern (it already produces the
  correct "stars never crawl" property for free — §3.1) but split it into genuine parallax **depth layers**
  per README's requirement — e.g. a far starfield shell (drei `<Stars>`, unmodified, camera-position-locked
  as today) plus 2–3 *nearer*, independently-scaled billboard/`<Cloud>` layers for nebula wisps that are
  allowed a small fraction of camera-position tracking (say 10–30% instead of 100%) so they visibly shift
  against the far shell — this is a small, cheap change to the existing `SkyFollow` idea (a tracking-factor
  prop), not a rewrite. The one celestial body is a single custom-shader sphere (§3.3), placed once, not
  camera-following (it should recede/approach like real distant scenery, consistent with board `12`'s single,
  specific placement — not an infinite shell).
- **Light layer:** the identical dome/body components, mounted once inside a portal (or manually rendered
  into an offscreen `Scene` + `PMREMGenerator.fromScene`) at a **brighter, unclamped intensity** — this is
  where `backgroundIntensity`/`environmentIntensity`-style decoupling actually happens, but at the *content*
  level (a second render of the same generator with higher emissive/exposure values on the flare and nebula)
  rather than only a global scalar, so the *displayed* sky can stay at art-directed low luminance while the
  *sampled* one is bright enough to light `roughness 0.2` vs `0.9` visibly differently (the README's
  falsifiable test).
- **Amended 2026-09-18, per the corrected §1 lighting model — the star is a real `DirectionalLight`, NOT
  baked into the cubemap.** §1(c) revises the "light layer" bullet above: PMREM's per-roughness convolution
  (§2A/§3.4) is not designed to preserve a small, hard, bright point — baking the flare in and boosting it to
  survive convolution either smears it to nothing or blows out the surrounding sky. Recommend instead: (i) a
  single `DirectionalLight` (or, if it needs shape/soft-shadowing, a small-angle `SpotLight`) placed
  separately, pointed to match the flare's on-screen direction, giving a crisp specular highlight and a real
  terminator on the planet mesh — cheap, and exactly what `R-planet-star.jpg` shows; (ii) the bake (F) now
  only needs to carry the **low, cold, ambient** contribution for the rock field (§1(b)) — a dim, largely
  flat/soft sky, not a sky with a bright flare baked in. This *shrinks* the bake's job relative to the
  original draft of this recommendation (no need to chase a "bright enough to survive PMREM convolution"
  flare intensity in the display-vs-light content split described two bullets up) and **narrows this task's
  lighting scope to the far field only** — the track's own near-field illumination (rail/seam/pickup light
  the floor actually reads by) is explicitly out of scope here and is the subject of the new §5 scoping
  section, to be handed to its own downstream research task.
- **Why not the simpler "just scale `environmentIntensity`" (the README's literal candidate) alone:** it is
  compatible with this recommendation and should still be used as the final trim knob, but scaling a
  near-black source is scaling noise — README's own numbers (~linear 0.01 measured on the old bitmap) suggest
  a low-luminance procedural sky, scaled up, still risks being *flat* (uniform dim colour lit up uniformly)
  rather than *directional* (a proper key from the flare). A content-level brighter bake gives the PMREM
  actual directional structure to prefilter, not just a brighter flat colour — this is what makes reflections
  and roughness variation actually legible, not just "less dark."
- **Why F over hand-called `PMREMGenerator` (A) directly:** no material difference in what gets produced —
  recommend F purely because it is the **in-repo, already-typed, drei-idiomatic** path (`conventions/r3f.md`'s
  own rule #13: "write to the installed stack" — drei's `<Environment>` is the stack's designated wrapper for
  exactly this), and because a hand-rolled `PMREMGenerator` call means also hand-managing a `CubeCamera`,
  disposal, and re-bake triggers that `EnvironmentPortal` already does correctly (verified in its source:
  cleans up `fbo.dispose()` on unmount, supports `frames=1` one-shot).
- **Reject E (raymarch)** outright for this project: the per-frame cost is the wrong shape for a "never costs
  frame time during a race" constraint unless baked, and baking a raymarch collapses it into exactly this
  recommendation anyway (bake to cubemap, PMREM it) — so there is no scenario where raymarching wins over
  authoring the same visual with cheaper FBM-in-a-fragment-shader on a dome, baked the same way.
- **Reject D-as-the-whole-answer (pure analytic lights, no environment map at all):** it solves the
  diffuse/roughness half of the tension but not specular environment reflection (§2D) — and board 12's floor
  is visibly glossy/reflective, so an engineer building task 3 will likely want real reflections. Use D's
  *display* architecture (billboards for genuine multi-depth parallax) but do not stop at D's *lighting*
  architecture (skip the environment map).
- **Reject C-as-primary (a pre-baked local `.hdr` file):** technically simplest, but a static authored HDR
  is not "fully procedural" in the sense of parametrized/regenerable per-sector without an offline
  authoring step, which cuts against README §5's "per-sector A/B/C variants... build the language so they
  are parameters" — a runtime-generated cubemap can be re-parametrized per sector live; a static `.hdr` file
  cannot without leaving the running app.

### What would make this recommendation wrong

- **If a visual spike shows the "bright, content-shifted bake" still looks flat/undirectional** (i.e., even a
  brighter version of the same nebula+flare doesn't prefilter into a legible directional key) — that would
  mean the flare needs to be a much larger fraction of the bake scene's luminance than art direction wants it
  to *look* like on screen, at which point B's fully-decoupled "light proxy is a different asset, not just a
  brighter version" becomes the better fit, not F's "same generator, two intensities."
- **If the roughness self-test (README's `0.2` vs `0.9` sphere) still reads flat after this pipeline** —
  check bake resolution first (default 256 may be too coarse if the flare is a small fraction of the sphere;
  raise `resolution`/`size` before concluding the architecture is wrong).
- **If profiling shows the PMREM bake (even one-shot) causing a visible frame hitch on target hardware** —
  this would push toward doing the bake at a route-transition/loading-screen boundary rather than on first
  mount of the race scene, or toward option C (a truly static pre-authored asset) if even a one-time
  in-browser bake is unaffordable on the weakest target device (not measured this session — ask the user
  what the floor hardware is before treating this as settled).
- **If task 3 (lighting) determines the flare must be interactively re-aimable per sector at runtime by a
  human, not just per-sector-config at load** — this recommendation's "bake once at mount" cadence would need
  to become "bake on config change," which `EnvironmentPortal`'s `frames` prop supports (`frames={Infinity}`
  keeps re-capturing every frame) but that reintroduces a per-frame cost this report explicitly rejects for
  raceplay; would need a `frames=1`-triggered-by-a-key-changing pattern instead (feasible, just not free).
- **If the owner decides board 12's asteroid density (§1) means the "sky" is so minor a screen fraction that
  none of this is worth building** — i.e., if 55–65% of the frame is going to be asteroid geometry (task 4/5)
  regardless, the marginal value of a sophisticated nebula/dome system shrinks and a much simpler dome +
  stars + one shader body (skip the billboard parallax layers entirely) may be the right-sized answer. This
  is a legitimate scope call this report cannot make unilaterally.

---

## 5. SCOPING ONLY — Emissive geometry as a light source in three.js 0.185 / R3F 9

**Marked explicitly as scoping for a downstream task, not this one.** §1's corrected lighting model makes
"how does the track's own emissive geometry (rail, seams, pickups, ship engines) actually light nearby
surfaces and the floor's reflections" the load-bearing question the art pass as a whole now depends on — but
it is **not** the sky's job (§1(a)) and is out of this report's scope (README §5 excludes "final key/rim/fill
balance" — task 3 — and the track's own material is task 2's). This section enumerates the option space at
the shape level only, so the downstream research brief for that task starts from a verified API surface
instead of re-deriving it. **No recommendation is made here.**

**First, the load-bearing fact, verified this session directly from installed source, not recalled:**
`MeshStandardMaterial.emissive`/`emissiveIntensity` does **not** illuminate other objects. Read
`meshphysical.glsl.js` **[T3, `three@0.185.1` source]**: `totalEmissiveRadiance` is computed per-fragment
from the material's own `emissive` uniform and (optionally) `emissiveMap`, then summed directly into that
same fragment's `outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance` — it is added to the
glowing object's *own* output colour and never written to any uniform, light-probe, or buffer that a
different object's shader reads. Three.js's forward rasterizer has no global-illumination pass; a fragment
only receives incoming light from (a) the scene's `Light` objects via the `lights` UBO/uniform array and (b)
`scene.environment` (IBL). **A glowing monolith seam, by itself, lights nothing but its own pixels** — the
warm floor reflections and the base-brightest falloff board 12 shows must come from one of the mechanisms
below, not from `emissive` alone, however high `emissiveIntensity` is pushed.

**Candidate mechanisms** (verified against installed three 0.185.1 / drei 10.7.8 / fiber 9.7.0 unless noted):

- **`THREE.RectAreaLight`** **[T3, `three@0.185.1/src/lights/RectAreaLight.js`, JSDoc read directly]**. Purpose-
  built for exactly this shape — the class doc literally says "simulate light sources such as bright windows
  or strip lighting." Emits from a rectangular plane, so a rail/seam segment maps to it almost literally
  (width/height args). **Constraints, verified from the same JSDoc:** no shadow support at all; only
  "PBR materials are supported" (i.e. `MeshStandardMaterial`/`MeshPhysicalMaterial`, not
  `MeshBasicMaterial`/`MeshLambertMaterial`); requires an explicit init call before use —
  `RectAreaLightUniformsLib.init()` for the WebGL renderer (a separate import/one-time setup step, not
  automatic). Cost/count characterises the option: each instance is a real per-pixel BRDF-integrated light
  (LTC-based), non-trivial per light — the open question for the downstream brief is how many simultaneous
  rail/seam segments the track needs lit this way at once (the whole rail, or only the segment nearest the
  ship?).
- **drei `<Lightformer>`, used inside `<Environment>` children** **[T3, `Lightformer.d.ts`/`.js`, drei
  10.7.8, read directly]**. Not a light class itself — it is a plain mesh (`meshBasicMaterial` by default,
  `toneMapped={false}`, colour pre-multiplied by an `intensity` prop) shaped as a rect/ring/circle/box,
  meant to be placed as a bright shape *inside* an `<Environment>` portal so it gets baked into the PMREM
  cubemap (this is drei's own documented use of `EnvironmentPortal`, confirmed in §2F) — i.e., this is
  fundamentally an **environment/IBL contribution**, not a near-field per-object light. Notably, `Lightformer`
  also accepts an optional `light` prop that, if given, additionally spawns a real `THREE.PointLight` with
  `castShadow: true` colocated with the shape — so it can straddle both categories (bake for reflections +
  a real point light for direct falloff) in one component, which is directly relevant to the near-field-vs-
  infinite-distance distinction below.
- **Camera-following point/spot light rigs.** A small number of `PointLight`/`SpotLight`s attached to the
  ship (or to a moving window around the ship) rather than fixed to the track geometry — cheap (point/spot
  lights are among three's lightest), gives correct 1/d² near-field falloff by construction, and moves with
  the player so it only ever needs to light what's nearby. Does not by itself explain track segments *ahead*
  of or *behind* the ship being lit by their own local emissives (board 12 shows monoliths receding into the
  distance still showing base-brightest falloff) — a single ship-relative rig would need many instances or a
  pooling scheme to cover a whole visible stretch of track, which is exactly the kind of instancing-cost
  question `conventions/r3f.md`'s per-archetype instancing rules (max ~1000 instances, `<Instances>`) would
  need to answer for it.
- **An analytic line-light term computed in the floor's own shader.** Instead of real `Light` objects at all,
  hand-code a closed-form falloff (e.g. distance-to-nearest-rail-segment → intensity curve) directly in the
  floor material's fragment shader (a custom `ShaderMaterial` or an `onBeforeCompile` patch on
  `MeshStandardMaterial`), using the rail's known world-space geometry as a uniform/attribute rather than a
  scene `Light`. This is the only option in this list that can be **exactly** analytically shaped to match
  a specific measured falloff curve (e.g. board 12's specific base-to-top monolith gradient) rather than
  inheriting whatever falloff model three's built-in light types impose — at the cost of being bespoke,
  floor-specific code that other materials (the monolith faces themselves, the ship hull) would not
  automatically benefit from unless the same term is duplicated into their shaders too.
- **Light probes / irradiance volumes.** Three.js ships `THREE.LightProbe` (spherical-harmonics ambient
  term, typically generated from a `LightProbeGenerator` off a cubemap/PMREM) — **[UNVERIFIED this session
  which exact API/class names ship in `three@0.185.1`; flagged, not asserted]**. Conceptually this is a
  *sampled, spatially-varying* ambient term (multiple probes placed around the track interpolate between
  different local lighting), which is the natural fit for "the rock field needs a different ambient level
  than the track floor" (§1(b)) — but it is fundamentally still an environment/IBL-family mechanism (baked,
  low-frequency, no sharp near-field falloff), not a substitute for the RectAreaLight/point-light mechanisms
  above for the sharp base-brightest seam falloff.
- **Screen-space approaches** (e.g. a post-process pass that samples bright/emissive screen pixels and
  fakes a local-light contribution on nearby geometry — a "screen-space emissive bounce" in the general
  family of screen-space GI/SSR-adjacent tricks). Not verified against this project's installed
  `postprocessing` **6.39.4** package this session — **[UNVERIFIED]** whether it ships anything in this
  family out of the box. Flagged as a candidate to check, not evaluated.
- **Baked lightmaps / vertex-baked AO+bounce on static track geometry.** Classic real-time-rendering
  technique — precompute a bounce/occlusion term per static mesh (drei ships `<BakeShadows>` for the shadow-
  map half of this, verified in `conventions/r3f.md` **[T2]** — a full baked-radiosity lightmap is a
  different, heavier offline step not currently in this stack). Would give exactly-correct-looking bounce
  light on static geometry at zero runtime cost, at the cost of needing a bake step and being wrong the
  moment track geometry is procedurally regenerated per-race (this project's track **is** procedurally
  regenerated — ADR-006/007 — so a per-mesh static bake would need to run at track-generation time, not
  author time, which is a real architectural wrinkle worth flagging to whoever picks this up).

**The distinction that matters most (per the coordinator's framing), stated plainly:** `RectAreaLight`,
camera-following point/spot rigs, and the analytic floor-shader term can all produce **genuine near-field
falloff that varies believably along a moving track** — they are the candidates that can explain board 12's
base-brightest-falling-off-upward monolith edge. `Lightformer`-in-`Environment`, light probes/irradiance
volumes, and any PMREM/IBL-family mechanism are **effectively infinitely-distant, direction-only
contributions** — correct for the sky's own narrowed job (§1) but structurally unable to reproduce a falloff
that depends on proximity to a specific nearby emitter, no matter how the bake is tuned. Baked lightmaps sit
in between (spatially varying but static, not proximity-reactive to a *moving* ship). This is exactly why
§1(a) concluded the sky and the track's near-field lighting are two separate problems: the mechanisms that
solve one cannot substitute for the mechanisms that solve the other.

---

## 6. Confidence summary and what could not be verified

| Claim | Confidence | Tier |
|---|---|---|
| Installed versions (fiber 9.7.0, drei 10.7.8, postprocessing 3.0.4/6.39.4, three 0.185.1) | High | T2 |
| `<Environment>` prop shape incl. `backgroundIntensity`/`environmentIntensity` independence | High | T3 (`.d.ts` + `.js` read) |
| `preset` fetches from a CDN (`raw.githack.com/pmndrs/drei-assets`) | High | T3 (source line read) |
| `PMREMGenerator.fromScene/fromEquirectangular/fromCubemap` signatures and purpose | High | T3 (JSDoc + method signatures read in `three@0.185.1` source) |
| drei `Stars` is one `Points` draw call, additive, soft-falloff, no per-star phase offset | High | T3 (full source read) |
| Current `SkyFollow` gives stars zero relative motion (position-only camera copy) | High | T2 (source read) + derivation |
| `envMapIntensity` is per-material, not scene-global | High | T2 (INDEX.md standing fact, consistent with three's documented material API — not independently re-verified against `MeshStandardMaterial.d.ts` this session) |
| Board 12's flare reads as the key light direction for the composited art | High (as an art observation) | Direct image read |
| Board 12's flare *must* architecturally drive the engine's key light | Medium — plausible, not proven | Inference from one image |
| FBM/domain-warp is the dominant nebula technique; saturation is a downstream colour-ramp/warp-amplitude choice, not inherent to the noise | High | WebFetch — Quilez primary source (iquilezles.org/articles/warp) + pegwars.blogspot.com practitioner writeup, both read directly this session |
| "Star Nest" (saturated pole) vs pegwars-style restrained ramp (restrained pole) as the two practitioner camps, using the same core math | Medium-high | WebSearch (Star Nest, multiple independent ports/mirrors) + WebFetch (pegwars) — single first-hand source per pole, not triple-corroborated |
| ux3d.io live per-frame R3F nebula+star shader as a shipped-production example of this stack layer | Medium | WebFetch on a project blog post (not primary research, not this project's own repo) |
| Emissive geometry (§5 scoping) — `emissive` does not light other objects; RectAreaLight/Lightformer/etc. API shapes | High | T3 — `three@0.185.1` and `drei@10.7.8` source read directly this session |
| Whether project's existing `valueNoise2D` visually outperforms/underperforms Simplex for a soft nebula | Unverified — flagged explicitly | N/A, needs a visual spike |
| PMREM bake cost in concrete milliseconds on target hardware | Unverified — no profiling run this session | N/A |
| `drei <Cloud>` (`MeshLambertMaterial`-based) actually responds usefully to the recommended `DirectionalLight`/env at the intensities this game will use | Unverified — inferred from `.d.ts` only, not run | T3 (types only, not executed) |

**Updated 2026-09-18:** the original draft of this report flagged nebula-noise practitioner consensus as
unsourced general knowledge and explicitly did not run WebFetch/WebSearch. That gap has been closed (§3.2)
— Quilez's own domain-warp article, the pegwars restrained-nebula writeup, Star Nest as the saturated
counter-example, and a shipped R3F production example were all read directly this session and are cited with
tiers above. **Still not done this session:** a third independent restrained-nebula source to fully
triple-corroborate the "narrow ramp + subtle warp" restraint lever (currently resting on one strong first-hand
account); a profiling run for PMREM bake cost in milliseconds; a visual spike comparing the project's existing
`valueNoise2D` against Simplex for the nebula specifically; and confirmation of `THREE.LightProbe`'s exact
API shape in `three@0.185.1` (flagged UNVERIFIED in §5).
