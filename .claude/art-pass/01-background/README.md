# Task 1 — Background: deep space, nebula, and the light it casts

**Status:** research
**Depends on:** nothing. This is the root of the arc.
**Blocks:** everything — every later material and silhouette is judged under the light this produces.

---

## 1. What this task delivers

> **⚠ Amended 2026-09-19 — "fully procedural" no longer holds.** The display sky ships as
> `nebula-backdrop.jpg` (the image the boards were composed over) on a camera-locked dome; only the
> **lighting** environment is authored, via `<Lightformer>`s. See `CHEAP-PATH-BRIEF.md`. The two bullets
> below still describe the two *jobs* correctly — what changed is that they are now served by **two separate
> sources**, which is the point.

A **fully procedural** far-field environment (no bitmaps) that is simultaneously:

- **the thing you see** — deep-space gradient, stars, nebula, and a large cold celestial body; and
- **the thing that lights the scene** — a usable image-based-lighting source, plus the directional key
  implied by the bright celestial highlight.

It replaces `apps/client/app/game/scene/scene-backdrop.tsx`, which is today a single flat
`nebula-backdrop.jpg` set as `scene.background` — explicitly marked temporary in its own header.

## 2. The central tension (this is the whole problem)

The art direction wants the background **cold, desaturated, low-contrast, and dark** — "backgrounds stay
low-saturation so the playable layer carries the strongest colour signal" (`handoff/01_ART_DIRECTION.md`).

The scene wants the environment to **actually light things**. And a dark sky is a dark light source: the
current `nebula-backdrop.jpg` measures **~linear 0.01**, so using it as `scene.environment` emits nothing and
every prop's `roughness`/`metalness` becomes invisible. That failure blocked three separate workstreams in
the earlier attempt.

**Scoped down, 2026-09-18** (see §7 Q1): the sky does **not** have to light the track — the track lights
itself from its own emissives. The sky's lighting job is the **far rock field and the planet terminator**.
That makes the tension smaller, but not gone: board 12's asteroid wall is visibly lit by something cold and
ambient, and a near-black sky still cannot supply it.

**Resolving that tension is the deliverable of the research step,** not something to discover by fiddling.
The known lever is that drei's `<Environment>` exposes `backgroundIntensity` and `environmentIntensity`
**separately**, so the same procedural sky can read dark and light brightly. It is *one* candidate, not the
answer.

## 3. What the references actually show

### ⭐ `nebula-backdrop.jpg` IS the boards' sky — top authority for the far field

**The boards were composed over this image** (owner, 2026-09-18). So it is not one reference among many:
the sky visible in board 12 and board 13 *is* this file, minus whatever the rocks occlude. It therefore
**outranks the boards for sky appearance**, because the boards are this image with information removed.

It is retired in slice 4 for being a **bitmap** (the arc mandates procedural), **not** for looking wrong.
Its look is the target.

**The trap — this cost a full review cycle on 2026-09-18.** Judging the isolated `/iso-sky` against the
*composed* boards reads occlusion as intended faintness, and produces the confident-but-wrong conclusion
that the nebula should be nearly invisible. It should not. **Compare the isolated sky against
`nebula-backdrop.jpg`, never against a composed board.**

**Measured target** (nebula only — planet cropped out with `crop=980:941:0:0`; mean luma **26.5**/255,
which corroborates the ~linear 0.01 figure in §2):

| % of pixels above | **TARGET** (backdrop, no planet) | slice-1 derived default | earlier config |
|---|---|---|---|
| mean luma | **26.5** | 13.4 | 30.9 |
| >24 | **27.4%** | 0.16% | 35.2% |
| >48 | **9.9%** | 0% | 18.4% |
| >80 | **2.9%** | 0% | **10.8%** |
| >120 | **0.72%** | 0% | **0.03%** |
| >160 | **0.20%** | 0% | 0.017% |

The two shipped configs **bracket the target from opposite sides** — the earlier one is milky mid-tone bulk
with no hot cores; the derived default is essentially empty. Neither has the reference's long bright tail.

**Read:** the fault is **dynamic range, not brightness** — mean luma is within 17%. The sky is tonally
compressed into the midtones: ~3.7× too much mid-bright bulk and ~24× too few bright cores. The reference
is mostly dark with small hot filament cores punching through. **Crush the mids, let the peaks go hot** —
a sharper ramp, not a dimmer one. Also qualitatively missing: fine filigree, dark dust knots, and the
reference's dense starfield.

**Repro** (no Python — `ffprobe` only):

```sh
ffprobe -v error -f lavfi -i "movie='<img>',format=gray,lut=y=if(gt(val\,80)\,255\,0),signalstats" \
  -show_entries frame_tags=lavfi.signalstats.YAVG -of default=nw=1:nk=1   # ÷255 ×100 = % above 80
```

---

Read `refs/*.small.jpg` (1024px, ~0.6k tokens each). Crop panels at native resolution with `make-refs.sh crop`.

| Reference | What to take from it |
|---|---|
| `12_approved_scene_marigold_depth` | **Top precedence.** The background is *not* empty black — the upper frame is a dense cold **asteroid wall**, a **rim-lit planet limb** upper-right, and a single **bright star/flare**. Nebula cloud is barely present. Note that the flare reads as the scene's key light. |
| `13_original_mood_anchor` | Cosmic scale, looming scenery, **cold rim light, deep shadows**. Ignore its oversized ship/HUD/missile. |
| `01_color_lighting_moodboard` | The A/B/C intensity panels: a large pale planet disc, cold grey haze, heavy desaturation. Also carries the palette swatches — note it still prints the **superseded** Alert Red / Cyan / Purple support colours. **Those are excluded now.** |
| `05_planets_moons_final` | Frozen celestial vocabulary: **Gas giant · Moon · Crescent/eclipse**. Lighting: day side, backlit, eclipse. Keep cold and desaturated — **no marigold surface colour by default**. |
| `02_environment_intensity_A_B_C` | How density/scale/proximity/atmosphere scale A→B→C. **C is not more saturation everywhere.** |
| `06_sector_concepts_final` | Sector identities that the background must eventually serve: Monolith Field, Asteroid Gauntlet, Planetary Horizon, Distant Worlds, Eclipse Corridor, Convergence. |

**⚠ Note the gap:** `docs/art-direction/handoff/` has **no dedicated deep-space/nebula section**. The
background is specified only by reference images and by three prose fragments — "deep-space blue/black",
"backgrounds stay low-saturation", and hierarchy rank 4 "far environmental scale / atmosphere". So the
acceptance criterion has to be **measured off board 12**, not quoted from prose.

## 4. Definition of done

- Procedural sky renders in isolation at `/iso-sky` with live controls, and in `/art-lab` behind the real track.
- Zero bitmap dependency. `nebula-backdrop.jpg` is no longer referenced.
- Produces a **measurably non-trivial** environment: the falsifiable self-test is *a test sphere at
  `roughness 0.2` must look visibly different from one at `roughness 0.9`*. If they match, the environment
  is not lighting anything and the task is not done.
- Background reads **cold and desaturated** — sampled pixels stay low-saturation; nothing in the far field
  competes with the marigold layer for attention.
- **Zero parallax, by design** — the whole sky is camera-locked and shows no relative motion as the ship
  travels. This is correct for a backdrop at cosmic distance, not a shortcut; see §8 "No parallax". Depth is
  delivered by the rock layers in front of the sky (tasks 4/5), never by the sky itself.
- Stable at race speed (no crawling/aliasing/shimmer in the star field under motion).
- Costs are stated: draw calls, texture memory, and whether anything regenerates per frame.

## 5. Out of scope

- Track, floor, rails, gaps (task 2) — the background is judged over whatever the track currently is.
- Final key/rim/fill balance, exposure and bloom tuning (task 3). Task 1 must **prove** the sky can light a
  probe; it does not own the final lighting composition.
- Asteroid and monolith meshes (tasks 4/5). Board 12's asteroid wall is *their* job, not the sky's — do not
  fake it in the backdrop.
- Per-sector A/B/C variants. Build the language so they are parameters; do not author six sectors now.

## 6. How it is judged

`claude-in-chrome`, shared live tab — you and I look at the same pixels.

1. `/iso-sky` — the sky alone, with the roughness-probe self-test visible.
2. `/art-lab` — from the **real chase camera**, moving, at race speed. Not the `/art-gallery` orbit camera.
3. **Bloom on and bloom off.**
4. Side by side against `refs/12_approved_scene_marigold_depth.small.jpg` in an adjacent tab.

## 7. Open questions to settle at the research review

1. ~~**Is the bright celestial highlight the key light?**~~ — **ANSWERED, 2026-09-18: no.** Native-res crops
   of board 12 show the star lights the **asteroids and the planet's terminator**; the track and the
   monoliths beside it are lit by the track's own marigold emissives, brightest at the base and falling off
   upward. See `03-lighting/README.md` §1a for the evidence and the corrected model. **Consequence: the sky
   is NOT the track's main light source and never needed to be** — the sky's lighting job is narrower
   (the far rock field and the planet), and background and track lighting are substantially decoupled.
   Remaining sub-question: should the star be a **real directional light separate from the sky's IBL**,
   rather than a bright spot baked into a cubemap whose convolution averages it away?
2. **Where does the nebula live** — skybox/dome shader, raymarched volume, layered billboards, or
   generated-once cubemap? The IBL path constrains this: some options can feed a PMREM, some cannot.
3. **How much of board 12's upper frame is sky versus asteroid field?** If most of it is rock, the sky's job
   is smaller and quieter than board 01's hazy planet panels suggest.
4. **One-time bake or per-frame?** A sky generated once into a cubemap is cheap and can feed IBL directly; a
   live shader parallaxes for free but needs a separate lighting path.

## 8. Decision

> ## ⚠ SUPERSEDED 2026-09-19 — read `CHEAP-PATH-BRIEF.md` first
>
> **Everything in §8 below describes the PROCEDURAL approach, which was built, measured and then dropped.**
> It is kept as the record of what was tried and why, not as instructions.
>
> **The live decision:** ship `nebula-backdrop.jpg` as the display sky on the camera-locked dome
> (`SkyFollow`), and light the scene from a **separately-authored** environment — drei `<Environment>` +
> `<Lightformer>` children plus one real `DirectionalLight`.
>
> **Why:** the boards were *composed over* that jpg (§3), so the procedural dome's acceptance test was
> "match this JPEG" — and we ship that JPEG. We were approximating an asset we already own. Add that the
> background is ~55–65% occluded and, per `03-lighting/README.md` §1a, lights only the far rock field while
> the track lights itself from its own emissives, and the multi-slice procedural build stopped paying.
>
> **This also dissolves §2's "central tension"** — "art wants a dark sky, but a dark sky is a dark light
> source" is only a problem if the light is derived *from the picture*. Two sources, no tension. The
> roughness probes therefore matter **more**, not less: they are how the `<Lightformer>` rig is proven to
> actually light, which the procedural path never achieved.
>
> **Still true from §8 below:** the star is a **real `DirectionalLight`, not baked** (PMREM's roughness
> convolution cannot preserve a small hard highlight), and **no parallax** (§"No parallax" — apparent shift
> ≈ baseline ÷ distance, and both baselines are tiny, so camera-locking *is* infinite distance).
>
> **Now likely redundant:** the procedural celestial body — the jpg already contains the rim-lit planet limb.
>
> **Preserved:** branch `art/procedural-bg` @ `6d52029`, pushed.

**Settled 2026-09-18** at the research review (owner + Claude), against `research/2026-09-18-procedural-sky.md`.

### Chosen — option F for the light, option D's display architecture for the pixels

One generator instanced twice. The FBM nebula is IN. **Parallax is OUT** — see "No parallax" below.

| Layer | Mechanism |
|---|---|
| **Display — sky** | camera-locked shell (existing `SkyFollow`, **unchanged**): procedural dome shader (cold gradient + restrained domain-warped FBM nebula) + drei `<Stars>` |
| **Display — body** | one celestial body, **camera-locked with the rest of the sky**: custom `ShaderMaterial`, `dot(N,L)` smoothstep terminator + `pow(1 - dot(N,V), k)` fresnel rim |
| **Star (light)** | a real `DirectionalLight`, **not baked** — PMREM convolution cannot preserve a small hard highlight |
| **Sky (light)** | drei `<Environment frames={1}>` with the *same* generator as children at a brighter content-level intensity → one-shot cube bake → auto-PMREM → `scene.environment` |

**Nebula restraint levers** (sourced, §3.2): narrow hand-authored cold ramp + **subtle** warp amplitude + low
octave count. Saturation is a downstream colour choice, not inherent to domain-warped FBM.

**Verified this session, beyond the report:** three's renderer **auto-PMREMs** a `CubeReflectionMapping`
texture assigned to `scene.environment`, caches it per-texture in a `WeakMap`, and **re-convolves when
`texture.pmremVersion` changes** on a render-target texture
(`three@0.185.1/src/renderers/webgl/WebGLEnvironments.js:71–140` **[T3]**). That is the supported re-bake hook
for per-sector variants — no hand-rolled `PMREMGenerator` is needed. drei's portal path defaults to
`frames = 1` and renders into a `HalfFloatType` `WebGLCubeRenderTarget`
(`drei@10.7.8/core/Environment.js:91,111,120` **[T3]**), so the bake is genuinely one-shot and HDR.

### No parallax — correct, not a shortcut (settled 2026-09-18)

Apparent shift ≈ baseline ÷ distance. Both baselines here are tiny against a deep-space sky:

- **Lateral** — the ship is confined to the track, `halfWidth: 32` (`packages/shared/src/constants.ts:91`),
  so the largest possible side-to-side baseline is **64u**.
- **Forward** — a race is 400 segments, and that constant's own comment states
  `finishZ = TRACK_SEGMENTS·SEG_LEN = 8000u` (`packages/shared/src/sim/track.ts:131`). So **8000u** of travel.

At genuine cosmic placement both vanish — a body far enough that 8000u of approach shifts its angular size by
~1% shows no looming, and 64u of strafe shows no lateral shift. **Camera-locking the sky is not an
approximation of that; it IS that**, exactly, and for free. Literally placing geometry at ~500,000u would
demand a far clip plane that wrecks depth precision, for identical pixels.

**Consequences:**

- `SkyFollow` is used **completely unchanged** — no `tracking` prop, no new shared-file surface. It copies
  camera *position* but not *rotation*, which stays right: the sky must still swing as the ship turns.
- **The celestial body is camera-locked too.** An earlier draft of this decision had it world-placed; that was
  wrong — at any renderable distance it would visibly loom across 8000u of travel.
- **Depth is delivered by the layers in front of the sky, never by the sky.** `scene-backdrop.tsx`'s own
  header already argued this: an infinitely-distant nebula "cannot convey depth on its own. Depth is the job
  of the asteroid/monolith layers in front of it" — i.e. tasks 4 and 5.
- The research's recommended "2–3 nebula wisp layers at partial camera tracking" is **dropped**. It was the
  one part of the recommendation the boards supported least, and the geometry above says it would be
  simulating a shift that physically should not exist.

### Rejected

- **E — raymarched volumetric nebula.** Wrong per-frame cost shape, and baking it collapses into this same
  recommendation anyway — so it can never win.
- **C — a pre-baked local `.hdr`.** Not re-parametrizable per sector without leaving the running app, and a
  bitmap on disk contradicts §4's zero-bitmap criterion.
- **D as the whole answer** (analytic lights, no env map). Its *display* architecture is kept; its *lighting*
  architecture is dropped. **⚠ The report's stated reason for this rejection is wrong.** It argued "board 12's
  floor is glossy so we need real reflections" — but an environment cubemap is direction-only and infinitely
  distant, so it *cannot* reflect the near-field rails and engines that board 12's floor actually shows. The
  env map is kept on a narrower, correct ground: **rock specular and roughness legibility on the far field.**
  Consequence: if rock specular proves invisible at art-directed dimness, D becomes live again — the cheapest
  thing to falsify first.
- **`<Environment preset="…">`** — fetches from `raw.githack.com/pmndrs/drei-assets`. Forbidden (offline/LAN).
- **drei `<Sky>`** — atmospheric scattering for a planet's *daytime* sky. Wrong premise, not a candidate.

### Ordering note

The index justified background-first with *"lighting flows from the environment."* `03-lighting` §1a's
corrected model falsifies that premise — the sky lights only the far rock field and the planet; the track
lights itself from its own emissives. Background-first survives as cheap-and-harmless, **not** as
load-bearing. The genuinely load-bearing question (emissive-as-light) is therefore being **researched in
parallel** with this build, per the owner's call, rather than queuing behind it.

### Off-palette debt this supersedes

`env-config.ts`'s `ENV_VARIANTS` are pre-art-direction (cyan `#08324a` dome, magenta canyon walls), and the
shipped `GRID_VOID` variant is off-palette under the widened warm/cold-grey ramp. Task 1 replaces the sky
half. `TubeWalls` stays until tasks 4/5 replace it with real rock.

## 9. As-built

*(filled in after implementation)*
