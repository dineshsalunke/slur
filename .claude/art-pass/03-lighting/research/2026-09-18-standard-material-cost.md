# MeshStandardMaterial GPU cost — verified from installed three.js source

**Installed version:** three `0.185.1`, confirmed from `apps/client/node_modules/three/package.json` (`"version": "0.185.1"`)
and pinned in `pnpm-workspace.yaml` catalog as `three: ^0.185.1` (caret on 0.x → locked to the 0.185.x minor; comment
notes this is deliberate, to satisfy `postprocessing`'s peer range `>= 0.168 < 0.186`).

All claims below are sourced from `apps/client/node_modules/three/src/**` — file + line cited per claim. This is a
source-reading task; no benchmarking was performed (see "What to measure instead" at the end).

---

## 1. Are unused features compiled out, or always present?

**Compiled out entirely**, confirmed mechanically. three assembles shaders as strings with a `#define`/`#ifdef` prefix
built per-material, per-scene-lighting-state, and calls this permutation the "program cache key." Chain of evidence:

- `WebGLPrograms.js:56` `getParameters()` reads material state into booleans, e.g.
  `HAS_CLEARCOAT = material.clearcoat > 0` (`WebGLPrograms.js:141`), `HAS_TRANSMISSION`, `HAS_SHEEN`, `HAS_IRIDESCENCE`,
  `HAS_ANISOTROPY` (`:140-145`), `HAS_NORMALMAP`, `HAS_AOMAP`, `HAS_LIGHTMAP`, `HAS_EMISSIVEMAP` (`:130-135`).
- `WebGLProgram.js` turns each into a real `#define` in the fragment prefix, e.g.:
  - `parameters.clearcoat ? '#define USE_CLEARCOAT' : ''` — `WebGLProgram.js:706`
  - `parameters.iridescence ? '#define USE_IRIDESCENCE' : ''` — `:713`
  - `parameters.sheen ? '#define USE_SHEEN' : ''` — `:728`
  - `parameters.transmission ? '#define USE_TRANSMISSION' : ''` — `:732`
  - `parameters.anisotropy ? '#define USE_ANISOTROPY' : ''` — `:703`
  - map defines: `USE_NORMALMAP` (`:697`), `USE_AOMAP` (`:695`), `USE_LIGHTMAP` (`:694`), `USE_EMISSIVEMAP` (`:701`),
    `USE_ENVMAP` (`:687`)
- Those defines don't just toggle branches — they gate the *existence* of struct fields and functions. In
  `lights_physical_pars_fragment.glsl.js:14-53`, the `PhysicalMaterial` struct's `clearcoat`, `iridescence`, `sheen`,
  `transmission`, `anisotropy` fields are each wrapped in their own `#ifdef` — when off, those fields **do not exist**
  in the compiled struct, not merely zeroed.
- IBL/env-map sampling is fully gated: `envmap_physical_pars_fragment.glsl.js:2` wraps the entire
  `getIBLIrradiance()` function body in `#ifdef USE_ENVMAP` — with no environment map bound, no IBL sampling code is
  emitted at all (confidence: high, direct read).
- Per-light-type code is gated the same way but by a *count*, not a boolean — see §4 for why that matters more.

**Verdict:** for every optional feature checked (clearcoat, iridescence, sheen, transmission, anisotropy, normal map,
AO map, light map, emissive map, env map), leaving it unset produces case **(a) compiled out entirely** — confirmed
by reading the actual `#ifdef` block, not inferred. Confidence: high (direct source read, not inferred).

---

## 2. MeshStandardMaterial vs MeshPhysicalMaterial — real shader difference or just JS API surface?

**Real, small, always-on difference — confirmed via `defines`, not inferred.**

- `MeshStandardMaterial.js:67` (constructor) and `:412` (`copy()`): `this.defines = { 'STANDARD': '' };`
- `MeshPhysicalMaterial.js:56-59` and `:522-525`: `this.defines = { 'STANDARD': '', 'PHYSICAL': '' };`
- Both use `shaderID: 'physical'` in `WebGLPrograms.js:36-37` (`shaderIDs` map) — same `ShaderLib['physical']` source
  (`meshphysical.glsl.js`), so the *file* is identical; the *compiled program* differs because `PHYSICAL` is a real
  define carried into the shader via `parameters.defines` → `customDefines` in `WebGLProgram.js` (defines are pushed
  into the cache key at `WebGLPrograms.js:413-421`, so `STANDARD`-only vs `STANDARD+PHYSICAL` are **different cache
  keys → different compiled programs**, never shared).
- What `PHYSICAL` gates, read directly from `meshphysical.glsl.js:63-68`:
  ```
  #define STANDARD
  #ifdef PHYSICAL
      #define IOR
      #define USE_SPECULAR
  #endif
  ```
  So `MeshPhysicalMaterial` unconditionally gets `IOR` and `USE_SPECULAR` even with every physical-only feature
  (clearcoat, transmission, etc.) left at its default (0/off).
- Concrete cost of `IOR`/`USE_SPECULAR` at defaults, read from `lights_physical_fragment.glsl.js:14-54`:
  `MeshStandardMaterial` (no `IOR`) takes the `#else` branch — a fixed constant
  `material.specularColor = vec3(0.04)` (line 50). `MeshPhysicalMaterial` (has `IOR`) instead runs
  `material.specularColor = min( pow2( (ior-1)/(ior+1) ) * specularColorFactor, vec3(1.0) ) * specularIntensityFactor`
  (line 45) plus a `mix()` for `specularColorBlended` — a handful of extra scalar ALU ops per fragment, no extra
  texture samples (the specular color/intensity *maps* are separately gated behind their own `USE_SPECULAR_COLORMAP`/
  `USE_SPECULAR_INTENSITYMAP` defines, off by default in either material).

**Answer:** yes, genuinely cheaper program for `MeshStandardMaterial` — not just an API-surface distinction — but the
delta at defaults is small (a few ALU ops, no extra samples, no extra branches in the light loop). The bigger cost
driver is whichever *optional* feature flags (clearcoat/transmission/sheen/anisotropy/maps) either material turns on,
not the Standard-vs-Physical choice itself. Confidence: high.

---

## 3. What's unconditionally present in every MeshStandardMaterial fragment shader

Always compiled in, regardless of feature flags (all read directly, not inferred):

- **GGX BRDF + multiscatter energy compensation**, unconditionally, for **every direct light** in the per-light loop:
  `RE_Direct_Physical` (`lights_physical_pars_fragment.glsl.js:527-559`) calls
  `BRDF_GGX_Multiscatter(...)` at line 556 for every light — not gated by any `#ifdef`. `BRDF_GGX_Multiscatter`
  (`:424-...`) itself samples a `dfgLUT` texture **twice** (view-angle + light-angle, lines 434-435) on top of the
  base `BRDF_GGX` call (line 427). This runs once per light per fragment, unconditionally — new-ish machinery (a
  16×16 `RG16F` precomputed LUT, `renderers/shaders/DFGLUTData.js:1-6`, generated once as a module-level singleton by
  `getDFGLUT()` and cached — not regenerated per frame or per material) that this codebase should know is now part
  of the "free" per-light cost, not something you can disable by avoiding clearcoat/sheen/etc.
- **Colorspace output conversion** — `colorspace_fragment.glsl.js:1-3`: `gl_FragColor = linearToOutputTexel(gl_FragColor)`
  runs with no `#ifdef` guard at all — always executed, once per fragment, cheap (a small matrix/curve op).
- **Tone mapping is gated**, contrary to colorspace conversion: `tonemapping_fragment.glsl.js:2`
  `#if defined( TONE_MAPPING )` — only present when `material.toneMapped` is true AND the renderer isn't rendering to
  an offscreen/XR target with `NoToneMapping` (`WebGLPrograms.js:176-186`). So a material with `toneMapped = false`
  genuinely has zero tone-mapping instructions.
- **Per-light-type loops** are present only if that light type's count is nonzero (see §4) — so "unconditional" here
  really means "unconditional given the scene has that light type," not "always regardless of scene."

Scaling: the GGX/multiscatter evaluation scales **linearly with the number of active direct lights** hitting that
object (every directional + point + spot light in range runs the full per-light block, each with its own 2 dfgLUT
samples). IBL/env-map sampling is a flat, small, per-fragment cost gated by `USE_ENVMAP`, independent of light count.
Tone mapping and colorspace conversion are flat per-fragment, independent of light count.

---

## 4. What actually costs, ranked, with the mechanism that makes each true

1. **Shader permutation count → compile stalls.** `getProgramCacheKey()` (`WebGLPrograms.js:398-436`) builds the
   cache key from `shaderID` + `defines` + a long list of numeric/boolean parameters (`numDirLights`,
   `numPointLights`, every `*Map` boolean, `clearcoat`/`sheen`/`transmission`/`anisotropy`, `toneMapping`,
   `outputColorSpace`, etc). **Any two materials that differ in a feature *flag* (a map present/absent, clearcoat
   on/off) or in *light counts* get separate cache keys → separate `WebGLProgram` instances → a separate GPU shader
   compile** (`acquireProgram()`, `WebGLPrograms.js:620-639`, only reuses a program on an exact cache-key hit).
   Materials that differ only in a *value* (e.g. two different `roughness` numbers, two different colors — these are
   uniforms, not defines) **share one compiled program**. This is the single biggest practical risk: a scene with
   many slightly-different-feature materials (some with normal maps, some without; different light counts hitting
   different objects) multiplies compiled-program count, and each new permutation is a real, synchronous(ish) compile
   hitch the first time it's needed (mitigated somewhat by `KHR_parallel_shader_compile`, checked at
   `WebGLPrograms.js:380`, but that only parallelizes, doesn't eliminate the stall).
2. **Draw calls** — not verified in this pass (out of scope of material-shader-cost question; this is a renderer
   batching concern, not something `WebGLPrograms`/`WebGLProgram` source settles).
3. **Per-light loop cost** — see §5 below; the concrete, load-bearing finding for this project.
4. **envMap sampling** — flat per-fragment cost when `USE_ENVMAP` is set (`envmap_physical_pars_fragment.glsl.js`);
   cost scales with mip level / cube-UV size, not with anything else in the material.
5. **Shadow map sampling** — gated by `USE_SHADOWMAP` (`WebGLProgram.js:587,752`) and, per light, by
   `NUM_*_LIGHT_SHADOWS > 0` (`lights_fragment_begin.glsl.js:60-62`). Not read in depth this pass, but structurally
   it's the same unrolled-per-shadow-casting-light pattern as the light loop, so it inherits the same "each shadow
   caster is a compile-time-fixed loop iteration" cost model as §5.

---

## 5. Project-specific answers

**Q: Does an unused `RectAreaLight` in the scene add cost to materials/shaders it doesn't meaningfully affect?**

No — fully gated, confirmed:
- `lights_pars_begin.glsl.js:173` `#if NUM_RECT_AREA_LIGHTS > 0` wraps the entire `RectAreaLight` struct + uniform
  array declaration.
- `lights_fragment_begin.glsl.js:158` `#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )` wraps the
  loop that evaluates it.
- `lights_physical_pars_fragment.glsl.js:463` `#if NUM_RECT_AREA_LIGHTS > 0` wraps `RE_Direct_RectArea_Physical`.

If zero `RectAreaLight`s are in the scene's active light list, `numRectAreaLights` is `0`
(`WebGLPrograms.js:342`), the string-replace of `NUM_RECT_AREA_LIGHTS` (`WebGLProgram.js:223`) yields `0`, and none of
this code exists in the compiled program for *any* material. It costs nothing to materials that never see it.

**What `RectAreaLightUniformsLib` loads, and how big:** `examples/jsm/lights/RectAreaLightUniformsLib.js:22-36` —
`static init()` calls `RectAreaLightTexturesLib.init()`, which builds 4 small `DataTexture`s (`LTC_FLOAT_1/2`,
`LTC_HALF_1/2` — Linearly Transformed Cosines BRDF-approximation LUTs from Heitz et al., cited in the source
comment `RectAreaLightTexturesLib.js:17-25` as "roughly 80kb in size" total, per the file's own doc comment). This is
a **one-time, renderer-global** init (mutates the shared `UniformsLib` object), not per-material or per-frame —
cheap and irrelevant unless you actually use `RectAreaLight`s. Note this must be called manually
(`RectAreaLightUniformsLib.init()`) — it's an `examples/jsm` addon, not core; if the project uses `RectAreaLight`
without calling `.init()`, the light silently does nothing (out of scope to verify whether this project calls it —
grep the client for `RectAreaLightUniformsLib` if RectAreaLight is in use).

**Q: 20 point lights — bounded by a compile-time `#define NUM_POINT_LIGHTS`, so adding one light recompiles every material?**

**Yes, confirmed directly** — this is the load-bearing finding for this project's "many small emissive objects each
get a real light" design:

- `WebGLProgram.js:214-229` `replaceLightNums()` does a literal string replace:
  `.replace( /NUM_POINT_LIGHTS/g, parameters.numPointLights )` (line 224) — `NUM_POINT_LIGHTS` in the GLSL source
  becomes the literal integer count (e.g. `20`), not a runtime uniform.
- `lights_pars_begin.glsl.js:97` `#if NUM_POINT_LIGHTS > 0` then declares
  `uniform PointLight pointLights[ NUM_POINT_LIGHTS ];` (line 106) — a **fixed-size array sized to the exact current
  count**.
- `lights_fragment_begin.glsl.js:60-77`: `#pragma unroll_loop_start` / `for (int i=0; i<NUM_POINT_LIGHTS; i++)` /
  `#pragma unroll_loop_end` — the GLSL compiler **unrolls** this loop at compile time into `NUM_POINT_LIGHTS`
  duplicated blocks of BRDF+shadow code.
- `numPointLights` is part of the program cache key (`WebGLPrograms.js:339` sets it from `lights.point.length`;
  `getProgramCacheKeyParameters()` pushes it into the key at `WebGLPrograms.js:473`).

**Consequence, stated plainly:** the point-light loop is **not** dynamic — it is a compile-time unrolled count baked
into every material's shader that receives lighting. Three.js's light-collection logic (not fully traced this pass,
but implied by `lights.point.length` being the count of lights *currently affecting that object's render pass*) means
the *effective* count seen by a given material's cache key depends on how many point lights are simultaneously
active/relevant, and that number changing **produces a new cache key → a new compiled program**, for every
`MeshStandardMaterial` (and every other lit material type) in the scene that ends up seeing a different count.

**For a design with many small emissive objects each carrying a real `PointLight`:** every time the *number of
simultaneously-relevant point lights* changes (a light turns on/off, an object enters/leaves whatever grouping
three.js uses to decide which lights affect which objects), any material whose effective light count changed needs a
**new shader compile** — this is a real, structural cost model, not a minor detail, and it directly threatens compile
hitches at runtime if lights are toggled dynamically per-frame (e.g., pickups/projectiles lighting up transiently).
This is exactly the kind of "recompile every material" cost the task description anticipated, and it's confirmed
here, not guessed.

**What this does NOT mean:** a *stable* set of N point lights that never changes count costs you the unrolled-loop
ALU work (`N` × [BRDF + 2 dfgLUT samples + optional shadow sample]) every frame, per fragment, but only **one**
compile per unique `N` (cached and reused via `acquireProgram()`, `WebGLPrograms.js:620-639`) — the danger is
*churn* in the count, not a stable high count.

---

## Confidence summary

| Claim | Confidence | Basis |
|---|---|---|
| Unused features compiled out via `#ifdef` | High | Direct source read, multiple chunks |
| MeshStandard vs MeshPhysical differ in compiled program | High | `defines` diff + `#ifdef PHYSICAL` gate, direct read |
| GGX+multiscatter (dfgLUT, 2 samples) unconditional per light | High | Direct read, no guarding `#ifdef` found on the call site |
| Point/dir/spot/rectArea light loops are compile-time unrolled counts | High | `replaceLightNums` string-replace + `#pragma unroll_loop_start` |
| Light-count changes trigger new program compiles | High (mechanism) / Medium (which real-world triggers change "relevant count" per object) | Cache-key mechanism confirmed; three's light-relevance-grouping logic (which lights get attributed to which object) not traced this pass |
| RectAreaLight fully gated, ~80kb one-time LUT cost | High | Direct read of gating `#if` + the lib's own doc comment |
| Draw-call cost, shadow-map sampling depth | Not verified this pass | Out of scope of `WebGLPrograms`/`WebGLProgram`/ShaderLib read |

## What to measure instead of reason about further

- Actual compile-hitch duration for a permutation change — use `renderer.info.programs.length` growth plus a
  DevTools performance trace around the frame a new light count is introduced, in a real browser session (this
  cannot be done from source reading).
- Real GPU cost of N active point lights vs N=0 — a GPU frame-time capture (e.g. Spector.js or the browser's
  WebGL inspector) comparing scenes with light count held constant vs churning, to see whether the *steady-state*
  per-fragment cost (ALU-bound: BRDF + 2 dfgLUT texture fetches per light) or the *compile-churn* cost dominates in
  this project's actual light-toggling pattern.
