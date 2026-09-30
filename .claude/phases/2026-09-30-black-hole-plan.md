# Black hole port — plan (#394)

Agent: workerthree · 2026-09-30 · **PLAN ONLY. Nothing is built until the owner approves.**

Source: https://vgpu.sh/examples/optimized-black-hole. Full source read this session from
`https://vgpu.sh/examples/optimized-black-hole/source.md` (2286 lines, 14 files).

## 1. What the effect is (from its source)

It is a **fragment-only, multi-pass** pipeline. There is **no compute shader**. The expensive physics
runs **once**. Each frame only shades a stored result.

| Pass | File | When | What it does |
|---|---|---|---|
| bake | `bake.wgsl` + `geodesic.wgsl` | once (and on resize) | Marches a light ray per pixel through a Schwarzschild-like field. `MAX_STEPS: i32 = 768`. Stores the first two disk crossings, the escaped ray direction and a hole/escaped flag in a **4-target G-buffer** (`rg32float, rg32float, rgba16float, rgba16float`). |
| refine | `refine.wgsl` | once | Finds pixels on the photon ring or a disk edge (5×5 neighbour test). Re-traces those pixels with **4×4 sub-rays** for coverage. Writes `rg8unorm` + `rgba16float`. |
| shade | `shade.wgsl` + `disk.wgsl` + `stars.wgsl` | every frame | Decodes the G-buffer. Shades the back and front disk layers with domain-warped fBm from a **64³ `r8unorm` 3D noise texture**. Adds Doppler beaming, gravitational redshift and a procedural 3-layer star field sampled along the **bent** ray direction. |
| bloom ×9 | `bloom.wgsl` | every frame | Threshold, 3 mip levels, separable 5-tap Gaussian. |
| composite | `composite.wgsl` | every frame | Bloom sum, ACES, vignette, gamma. |

Facts that shape the port:

- **The camera is frozen at bake time.** `renderer.ts` sets `forceBake = true` only on resize and layout
  change. Motion comes from two per-frame uniforms: `time` (disk flow) and `sceneYaw`, a rotation of
  the *stored* crossings about the hole axis (`rotateLayers( baked, -shade.sceneYaw )`). The mouse drives
  `sceneYaw` with `mouseYaw: 0.15`.
- **The shipped look is greyscale.** `composite.wgsl`: *"`const SATURATION: f32 = 0.0;`"* and
  *"`return mix(vec3f(luma), color, SATURATION);`"*. The disk colour under that is warm:
  `disk.wgsl` ramps `vec3f(0.52, 0.14, 0.03)` → `vec3f(1.0, 0.56, 0.17)` → `vec3f(1.0, 0.94, 0.83)`.
  With saturation kept, that ramp is already close to marigold. [inferred — not rendered yet]
- **Per-frame shade cost is texture reads.** One disk layer runs `smokeField` for up to two lobes
  (2 + 3 + 3 + 5 octaves = 13 3D reads each) plus a 2-octave cloud: up to ~28 3D reads. Two layers.
  Ring pixels shade the front layer up to `AA_TAPS: i32 = 6` times. [counted from source]
- It renders at `dpr: 1` into its own canvas and paces itself to 60 Hz on its own rAF loop.

## 2. Licence

**MIT.** `github.com/vercel-labs/vgpu`, `LICENSE`: *"MIT License — Copyright (c) 2025 Vercel, Inc."*
(fetched this session; the GitHub API reports `spdx_id: MIT`). A port is a derivative work. MIT needs
the copyright and permission notice kept. Source comments are banned (CLAUDE.md #14), so the notice
goes in **`CREDITS.md`** in a new "Code" section with the full MIT text. That is the only obligation.

## 3. Our stack, verified this session

- **Renderer is WebGL2.** No `WebGPURenderer`, `three/webgpu` or `three/tsl` import in
  `apps/client/app`. `game/scene/canvas-gl.ts` passes a plain WebGL option object
  (`antialias: false, alpha: false`).
- three **0.185.1** (`node_modules/three/package.json`). `RenderTarget` takes
  *"`[count=1] - Defines the number of color attachments`"* (`src/core/RenderTarget.js:37`), so a
  4-target MRT is supported. `Data3DTexture` exists.
- `postprocessing` is pinned *"`peer three ">= 0.168 < 0.186"`"* (`pnpm-workspace.yaml:17`). It is
  WebGL-only.
- Post slots: `POST_SLOTS = [ 'beforeBloom', 'bloom', 'afterBloom', 'beforeToneMap' ]`
  (`scene-effects.constants.ts:4`). Bloom and tone mapping are already ours.
- Frame phases include **`prerender: 0.5`** (`game/frame/frame-phase.constants.ts`) — the place for an
  offscreen pass, on the one shared clock.
- The in-race sky is a **screen-space** quad: `SceneBackdrop` draws `/textures/nebula-backdrop.jpg`
  cover-fit, `depthTest={ false }` (`scene-backdrop.tsx`). It does not turn with the camera.
- Quality tiers (`quality/quality.constants.ts`): low has `post: false`, `dprCap: 1`,
  `landing3d: false`; medium `dprCap: 1.5`; high `dprCap: 2`, `msaa: true`.

## 4. Port options (CLAUDE.md #13)

| # | Option | Correct look? | Runtime cost | Fit with our stack | Verdict |
|---|---|---|---|---|---|
| A | **GLSL port into fixed-size offscreen targets.** Bake + refine once into a 4-target `WebGLRenderTarget` (`count: 4`). A `prerender` system shades one square target per frame. A quad in the scene samples it. Our bloom and tone map finish it. | Full: same geodesics, ring AA, disk. | Fixed by target size (§6), not by screen size. | WebGL2, one clock (frame schedule), no new deps, no renderer change. | **Recommended.** |
| B | Direct billboard `ShaderMaterial` that runs shade per screen pixel it covers (bake still offscreen). | Full. | Scales with screen coverage — a close finish landmark at DPR 2 covers millions of pixels × ~60 reads. | Good. | Rejected: cost is unbounded. A caps it. |
| C | Screen-space **post effect** in `beforeBloom` that lenses the whole frame. | Only if re-baked each frame, because the camera moves. 768 steps × every pixel × every frame is not viable. | Very high. | Good slot fit. | Rejected for the port. A cheap analytic lens-warp of the frame is a separate, later idea. |
| D | **TSL node material / `WebGPURenderer`.** | Full, and closest to WGSL. | Similar to A. | Needs a renderer migration: `postprocessing` is WebGL-only, and our `onBeforeCompile` shader patches (`chainShaderPatch`) and GLSL `ShaderMaterial`s do not run under `WebGPURenderer`. | Rejected: one effect does not pay for a renderer swap. |
| E | **Run vgpu itself** on a second WebGPU canvas layered with the game canvas. | Exact. | A second GPU device, a second rAF loop, and a compositor blend (we turned canvas `alpha` off to save about 1 ms, perf-analysis §5). | Two clocks (breaks #13's "reuses-existing-loop"), no depth interplay, no WebGPU in some browsers, new dependency. | Rejected. |
| F | **Baked sprite sheet / video.** Render N frames offline, ship as an atlas or video texture. | Frozen view; the disk loop has a seam. | Lowest: one read per pixel. | Good. | Rejected as the main path (asset size, loop seam). **Kept as the low-tier idea** in its simplest form: one still frame (§6). |
| G | **Single-pass analytic fake** (impact-parameter bend + warped disk texture, no march). | Loses the photon ring and the second disk image. | Low. | Good. | Rejected unless A misses budget. It is the fallback plan. |

### Option A in detail

- **Shaders.** Translate the WGSL to GLSL ES 3.00: `bake`, `refine`, `shade`, `disk`, `gbuffer`,
  `geodesic`. The translation is mechanical (`fwidth`/`dpdx` → `fwidth`/`dFdx`, structs, `select` →
  ternary, `textureLoad` → `texelFetch`). Drop `bloom.wgsl` and `composite.wgsl`: `SceneEffects`
  already blooms and tone-maps.
- **Colour.** Keep the disk's own warm ramp and do **not** desaturate. The shade pass writes HDR into
  an `RGBA16F` target so our bloom picks up the hot inner edge.
- **Sky.** Replace `stars.wgsl` with a **lensed read of our nebula backdrop**. The bake already stores
  the escaped ray direction (`gSky.xyz`). Convert its deviation from the straight ray into a UV offset
  into `nebula-backdrop.jpg`. At the quad's edge the deviation goes to zero, so the lensed sky meets the
  real backdrop with no seam. [inferred; the prototype checks it]
- **Noise.** Port `noise-volume.mjs` to a 64³ `Data3DTexture` (`RedFormat`, `UnsignedByteType`,
  262 KB), built on the client at mount. It is deterministic.
- **Bake.** Run once at mount, at the target size. It can take a hitch-sized frame on a weak GPU, so
  split it into horizontal bands over several frames (scissor), behind the existing load reveal.
- **Motion.** `time` from the frame clock. `sceneYaw` from the ship's lateral offset, so strafing gives
  a small parallax turn, as the mouse does in the original.
- **Float targets.** `rg32float` render targets need `EXT_color_buffer_float`. It is near-universal on
  WebGL2 [recalled]; if it is missing, drop the effect to the low-tier still.
- **Ownership.** One module-level target set, created on first mount, disposed on unmount of the last
  user (CLAUDE.md #8; memory `r3f-disposes-only-the-object`).

## 5. Where it lives — owner picks

| # | Placement | For | Against |
|---|---|---|---|
| P1 | **Landing / home hero** | What vgpu built it for (`index.tsx`: *"renderer formerly used by the homepage"*). No gameplay read risk. Low tier already skips the 3D landing (`landing3d: false`). | Seen for a few seconds per session. |
| P2 | **Finish-line landmark** | A goal you fly toward and watch grow. Always seen near head-on down +z, so a frozen bake angle holds. Warm disk = "Warm Energy". | Needs `fog: false` (memory: fog hides emissive past 420 u). Must not out-shout pickups and the finish gate. |
| P3 | **In-race sky set piece** | Always visible. Lenses the nebula. | Constant motion at the edge of vision in a racer. Competes with the track read. Should stay small (~15 % of screen height). |
| P4 | **Portal visual** | One shared target serves every portal instance. | Portals are small on screen, so the detail is wasted. A black hole reads as "death", not "teleport". |
| P5 | Gravity-well **hazard** that pulls ships | Strongest party-game hook. | Gameplay: a sim + server change (ADR-000). Out of scope here — a separate issue if wanted. |

My recommendation: **P2 first, P1 second** — they share one module. P3 only if P2 reads well.

## 6. Cost budget per quality tier

Measured baseline (perf-analysis §6, M3 Pro, 3456×2160): 10.0 ms full frame; the whole sky pass is
1.4 ms for ~7.4 M pixels × ~7 reads. Draw-call caps: soft 200, hard 300 (§7).

Estimates below are **[inferred, unmeasured]**, scaled from the sky pass by read count. The prototype
measures them.

| Tier | Target size | Shade rate | Per-frame GPU | Draw calls | One-off |
|---|---|---|---|---|---|
| high | 512² | every frame | **≤ 0.6 ms** (262 k px × ≤ 60 reads ≈ 16 M reads) | +2 (shade, quad) | bake + refine ≈ 13 MB VRAM |
| medium | 384² | every 2nd frame | **≤ 0.25 ms** averaged | +2 / +1 | ≈ 7 MB VRAM |
| low | 256² | **shade once, then freeze** | **≤ 0.05 ms** (one texture read per covered pixel) | +1 (quad) | bake targets freed after the one shade |

- Low tier and `prefersReducedMotion()` (`game/scene/reduced-motion.ts`) both use the frozen still.
- Bloom adds nothing: the effect feeds the bloom pass we already run. Low has `post: false`, so the
  still carries its own glow baked in.
- **Gate:** if high measures over 0.6 ms, drop to 384² before touching the shader. If still over, go to
  option G.
- **Method:** perf-analysis `scripts/perf.mjs` with a new `blackhole` toggle, GPU-synced median, best
  of two, baseline first and last, driving. Plus the CDP WebGL wrapper for draw calls during a race.

## 7. Prototype for the look check — throwaway, on `/test-level`

- A URL param **`?blackhole=finish|sky`** on `/test-level`, read in the route loader (not a
  `useEffect`), mounts `<BlackHole placement>` inside the test-level canvas. No param = nothing mounted.
- A few live tunables under a `BlackHole.*` folder in `dev/tuning-schema.ts`: size, tilt (bake pitch,
  `rebuild: true`), brightness, disk speed, lens strength.
- Two looks side by side for the owner: warm (source ramp, saturation kept) and a marigold-tinted ramp.
- Removal once the owner picks: delete the param and the folder; the chosen placement moves to its
  real home (finish gate or landing scene) in a follow-up issue.

Files the prototype will claim (all new unless marked):

- `apps/client/app/game/scene/black-hole/` — `black-hole.tsx`, `black-hole.constants.ts`,
  `black-hole.utils.ts`, `black-hole.state.ts`, `black-hole-noise.ts`, shader `*.glsl.ts` modules, tests.
- `apps/client/app/routes/test-level/test-level-canvas/test-level-canvas.tsx` (edit)
- `apps/client/app/routes/test-level/route.tsx` (edit, loader param)
- `apps/client/app/dev/tuning-schema.ts` (edit)
- `CREDITS.md` (edit, MIT notice)

Build order: noise volume + unit test → bake/refine to targets, dump the G-buffer as a debug view →
shade → quad + lensed backdrop → tier switch → measure → screenshots to the owner.

## 8. Open questions for the owner

1. Placement: P1 · P2 · P3 · P4 (P5 = separate issue)?
2. Colour: the source's warm ramp as-is, a marigold tint, or the source's greyscale?
3. OK to credit the MIT port in `CREDITS.md` under a new "Code" section?
4. OK to ship the effect without an animated low tier (a frozen still)?

## 9. As built — prototype (2026-09-30)

Owner decisions: P2 finish-line landmark · cold tint on `BlackHole.*` dials · CREDITS.md Code section ·
frozen still on low. Option A built. Look check: `/test-level?blackhole=finish`.

- Module `apps/client/app/game/scene/black-hole/`. Passes run in the `prerender` phase. The quad is
  placed in the `view` phase: clamped inside the far plane (`DRAW_MAX = 900`), same angular size as the
  true place, floored at `BlackHole.minAngle`.
- Changes from §4: no stars (the lensed nebula backdrop replaces them). The source's bloom and composite
  are dropped; ours do that work. The disk ramp reads `BlackHole.deep/mid/hot` (defaults `#0e3a66` ·
  `#3bd6ff` · `#eaf8ff`, ADD Cyan Accent in the middle).
- Tier sizes as built: high 512² every frame · medium 384² every 2nd frame · low **384²** (not 256²:
  256² stepped at the shadow edge), shaded once then frozen.
- Bake is split into 8 bands and refine into 24 bands, one band per frame.

Measured (headless Chrome, Metal, 1728×1080 at DPR 2, tier DPR caps apply, GPU-synced median with
readPixels, best of two, landmark on vs off with `BlackHole.behind`, ship parked at `finishZ − 1400`):

| Tier | Frame on | Frame off | Delta | Draw calls on/off |
|---|---|---|---|---|
| high | 17.7 ms | 18.0 ms | −0.3 ms | 76 / 74 |
| medium | 13.3 ms | 13.0 ms | +0.3 ms | 76 / 74 |
| low | 5.0 ms | 4.8 ms | +0.2 ms | 51 / 49 |

- The steady cost is **below the meter's noise** (about ±0.5 ms) on every tier.
- The one-off bake/refine (at mount, and on a pitch/roll/distance change) raises frames to **up to
  ~34 ms for about 8 frames** at high (refine bands through the photon ring). With 8 refine bands
  it was ~43 ms.
