# SLUR — Art Design Document (ADD)

> Status: **v1**. Scene/world art direction is **FROZEN** by the external art-direction package
> `docs/art-direction/` (adopted 2026-09-17, ADR-008). Ship art direction is still in progress.
>
> **Precedence — read this first.** Where this file and the handoff disagree, **the handoff wins** on
> anything visual; this file records what the direction *means* for the build and what it costs. Where the
> handoff and *gameplay* disagree (scale, mechanics, the GDD §0 spatial contract), **gameplay wins** — see
> **`docs/ART_SCALE_REFERENCE.md`**, which overrides every scale number printed on a concept board.

## 0. Where the art direction actually lives

| Thing | Authority |
|---|---|
| Visual direction, palette, material/shape language, A→B→C | **`docs/art-direction/handoff/`** — supersedes v1 |
| Concept boards | `docs/art-direction/boards/` (all 14 boards, consolidated — v1's + v2's board `12`) |
| The approved integrated look | **`docs/art-direction/boards/12_approved_scene_marigold_depth.png`** |
| **Real dimensions of everything** | **`docs/ART_SCALE_REFERENCE.md`** (source-verified; overrides the boards) |
| Gameplay + spatial contract | **GDD §0** (continuous sim; `CELL` is authoring-only) |
| This file | the bridge: consequences, costs, and the open problems the handoff didn't answer |

## 1. Visual pillar

> **Cold Space. Warm Energy. Minimal forms. Readable gameplay.**

**A cold, desaturated universe containing warm, saturated gameplay energy.** The environment is vast,
silent, severe, and ancient. The active game layer is fast, hot, precise, and alive. The contrast between
those two registers *is* the art direction — everything else follows from protecting it.

**TRON-influenced, not TRON-literal** (adopted 2026-09-17, supersedes the 2026-08-12 "full TRON" pivot).
The debt is to high-contrast **functional** light — light that tells you where to go and what will kill
you — not to circuit-trace pastiche. This also retires the clone-risk that dogged both the LCARS blend and
the pure-TRON pivot. **Issue #117's "which TRON era" question is therefore closed as moot**: the answer is
neither, and the handoff package is the direction.

This is also a **performance strategy**: a near-black world, one warm emissive family, and heavy instancing
means few materials and few draw calls.

**Minimalism rule.** Prefer large forms, clean silhouettes, broad planes, restrained seams, limited material
families, sparse emissive accents. Avoid dense greebling, technical decals, noisy normals at gameplay
distance, many tiny emissive marks, and ornament with no readability purpose.

Anchor reference: **cuberun** (neon-on-black). Motion reference: **SkyRoads** (floating ribbon in space).
Energy reference: **Blur** (glowing pickups, punchy combat VFX).

## 2. Mood / one-liner
> "Cold Space. Warm Energy. Straight to infinity."

## 3. Color — **marigold-primary** (adopted 2026-09-17, ADR-008)

**Marigold is the signature and the only energy colour.** It carries *every* functional/energetic read:
track boundaries, critical seams, pickups, projectiles, engines and boost, monolith seams, asteroid energy
veins, the finish line, and destructible-block internals.

| Role | Colour | Hex |
|---|---|---|
| **Primary energy** | Marigold | `#F59A24` |
| Energy — hot | Amber | `#FFB52E` |
| Energy — glow | Energy Glow | `#FFE0A0` |
| Energy — core | Hot White | `#FFFBE7` |
| Environment | Deep Space | `#0A1117` |
| Environment | Space Grey | `#162028` |
| Environment | Blue Grey | `#303C45` |
| Environment | Steel | `#53616B` |
| Support (sparing) | Alert Red | `#FF4B3E` |
| Support (sparing) | Cyan Accent | `#3BD6FF` |
| Support (sparing) | Purple FX | `#B46BFF` |
| Support (sparing) | Green Pickup | `#7CFF9B` |

**Approximate usage ratio:** Background 70% · Environment 20% · Gameplay 8% · Highlights 2%.

**Environment is cold and desaturated** — blue-grey, graphite, charcoal, cold metallic grey, deep-space
blue/black. Backgrounds stay low-saturation so the playable layer carries the strongest colour signal.

**Do not flood the world with marigold.** It is valuable because it is controlled.

**This supersedes the 2026-08-10 cyan×marigold "gainda" duo.** Cyan is demoted from co-primary to a sparing
support accent at `#3BD6FF`; the locked marigold also shifts `#ff9f1c` → `#F59A24`. The old rule *"colour
carries meaning — never use a player hue for a hazard"* is **retired**: under a single-energy-colour system
colour no longer discriminates between object classes, so **discrimination moves to silhouette, material
state, and motion** (see §4).

### Player colour — deliberately deferred

The world is **uniformly marigold for every player** (decided 2026-09-17). Hue-shifting is reserved for one
job only — telling *opponent* ships apart — and is deferred until a real playtest shows it is needed.
`COLOR_COUNT = 12` already exists in `@slur/shared` as palette *capacity*; it is not a committed visual
direction. See §10 OQ3.

## 4. Shape language

Colour no longer separates object classes, so **silhouette and material state must**. This is the load-
bearing readability contract of the marigold-primary system:

| Read | Cue | Never |
|---|---|---|
| **Deadly block** | sealed, solid, monolithic mass; sparse functional seams | fractured |
| **Breakable block** | visibly fractured shell, internal marigold energy through the cracks | sealed |
| **Track pillar** | one identical square column, repeated in mirrored pairs flush to the rail — it holds the track up | varied in size, shape or spacing |
| **Environment monolith** | huge (200–400u), background-scale, framing — never track-adjacent mass | mistakable for a hazard |
| **Track boundary** | continuous marigold edge channel | matched by any decorative seam |
| **Pickup** | floating geometric icon, rotating, distinct silhouette per type | static |

- **Ships:** simple, low-poly, angular/arrow silhouettes — distinguishable at distance by **silhouette**,
  not detail or colour. *Ship art direction is still open — see §0/§10.*
- **Track:** dark graphite ribbon, large clean panel divisions, sparse fine seams, restrained gloss,
  functional marigold edge channels. **No ornamental greebling.**
- **Environment:** monoliths (Obelisk · Gate · Arch) and asteroids (Angular · Plate · Broken, varied by
  Elongated · Shattered · Cluster). Asteroids stay dark stone / worn concrete. **Monoliths moved onto the
  block metal family** (`docs/ART_MATERIALS.md` rev. 6, 2026-09-23) — hazard-vs-scenery separation for
  monoliths now rests on scale and placement alone (the row below), not material. Planets and moons stay
  cold and desaturated — **no marigold surface colour by default**.
- **Track pillars (ADR-018).** The columns beside the deck are **the pillars that hold the track up**.
  They are not scenery monoliths, and the rule for them is fixed:
  - **Equal size.** Every pillar is the same box: a square **12u × 12u** footprint, **50u** tall above the
    deck, and sunk 60u below it. There is no taper, no obelisk and no per-pillar scale.
  - **Mirrored.** Pillars stand in pairs, one each side, at the same z. One side never runs out of step
    with the other.
  - **Flush to the rail.** The inner face touches the rail's outer edge. No pillar stands back.
  - **Evenly spaced.** No row is dropped and no spacing is jittered. The pitch follows `intensityAt(z)`
    from **400u** (calm) to **200u** (intense). That is the only variation, and it is the same on both
    sides.
  - **Variety belongs to other props, never to the pillars.** Obelisks, gates, arches and asteroids carry
    the silhouette variety. An arch (#220) takes the place of a whole pillar pair at that pair's z. It
    never shifts or drops the pairs around it.
- **Geometry stays angular** — hard edges, chamfered corners, trapezoidal/hex forms. Roundness is reserved
  for **lights** (status pips, glows), never structural panels.
- Minimal texture detail; the "detail" is light, motion, and trails.

### A → B → C intensity

One world language at three intensities — **Subtle → Balanced → Intense** — varying *density, scale,
proximity, lighting pressure, particles, and selective warm energy*. **C is not "more saturation
everywhere"**; gameplay contrast is invariant across all three.

**A→B→C is driven by `intensityAt(z)`, not hand-authored.** The handoff's "example level flow" curve
(calm entry → build → challenge → recovery → final stretch → finish) is the *same curve* as ADR-006's
Believer arrangement envelope, which is already implemented. Binding the art to the existing function means
the environment breathes with real difficulty, deterministically, with **zero new synced state** (it is
cosmetic and client-side — ADR-002 clean). This is the single highest-leverage integration in the package.

## 5. VFX (the juice)
- **Bloom** (postprocessing EffectComposer) — the signature. Emissive materials + selective bloom on ships/pickups/track lines. See `conventions/r3f.md`.
- **Speed cues:** motion streaks, FOV/camera-shake on boost, star/grid parallax, chromatic aberration ramp with speed.
- **Combat VFX:** **(S5 built)** marigold bolt tracers with an Energy Glow head (instanced+interpolated), marigold hit-spark burst (additive HDR, bolt hits and block bounces), on-ship stun-flicker. **Planned:** shield shimmer, mine pulse, hit-spin, ship light-trails.
- **Trails:** each ship leaves a fading light-trail in its hue (identity + speed read).
- VFX are **client-local** (not networked) — driven by ECS/game events. See TDD §5.

## 6. Camera — **third-person chase** (decided)
- Chase cam behind + slightly above the ship, low and close for speed. First-person is rejected: it hides your ship's hue/trail (your **identity** signal) and worsens dodge awareness.
- **Aim at a look-ahead point** *ahead* of the ship (not the ship itself) so you read incoming track early.
- **Framing tuned to keep your ship readable (first pass, 2026-08-14 — feel-gate pending).** The
  raised-above-walls vantage (ADR-006: height > `BLOCK_HEIGHT` = 8u so you see over the pillars and plan your
  line) compounded with a *far* look-ahead + wide FOV made the player's own ship a tiny speck low on screen
  (near-invisible for the short-hulled Comet/`bob`). Resolution: **keep the height** (see-over is load-bearing)
  and pull the ship bigger + higher via the other three levers — **shorter look-ahead, tighter base FOV,
  closer trail, lifted aim**. Knobs are named + commented in `apps/client/app/game/camera/chase.ts` (`CHASE`),
  live-tunable. On-screen ship *size* is dominated by this framing, **not** by model scale (locked to the
  collision footprint — GDD §5.5), so "the ship looks small" is a camera or class-size question, never a scale
  bug. The look-ahead↔see-over trade stays a feel-gate tune.
- **Speed cues:** FOV widens + camera pulls back on boost; subtle bank into strafes; light shake at high speed.
- **On hit/stun: spin the *ship*, keep the *camera* stable** — disrupt without disorienting (fair, not nauseating).
- **Comfort options (day one):** sliders to dampen shake / FOV-kick / chromatic aberration — cheap motion-sickness insurance.
- **Death:** TRON derezz, then **spectator** follow-cam on the pack / cycle players.

## 7. UI / HUD — **still open, but no longer blocked on "which TRON"**
- **Direction (2026-09-17):** minimal, functional, angular panels in the §3 palette — dark graphite frames,
  marigold for functional/active state only, thin geometric type, high negative space. Not circuit-trace
  pastiche (§1: TRON-influenced, not TRON-literal).
- **Issue #117 ("which TRON era — 1982 vs Legacy") is closed as moot** — the handoff package answered the
  aesthetic question from a different direction, and neither era is being cloned. The *remaining* open work
  is the concrete frame/type/motion spec and a typeface, which is a normal design task, not an era decision.
- **Explicitly NOT frozen by the handoff** (per its own `00_STATUS_AND_SCOPE.md`): final HUD/UI treatment,
  including the rear-view mirror.
- HUD content: speed/fuel, held power-up, position/alive-count, mini threat indicators (incoming bolt/mine). **(S5 built:** `heldPower` chip + directional threat-warning HUD; dev stun/held/bolt readout. Speed/position/alive-count still to do.)
- Diegetic-lite and minimal — never clutter the flight view; readable in peripheral vision at speed.
- Death = **TRON derezz** dissolve; respawn = materialize-in.
- *Caveat: it's an office toy — evoke TRON, keep it original; don't lift film assets/logos.*

## 8. Performance-driven art constraints (hard rules)
These exist so the art *stays* 60fps with 12 ships + pickups + projectiles:
1. **Few materials.** Emissive + basic PBR only; reuse materials → instancing works.
2. **Instance everything repeated:** track segments, pickups, projectiles, stars (`InstancedMesh`/drei `<Instances>`).
3. **Low-poly, no heavy textures.** Light does the work, not texels.
4. **One bloom pass**, tuned — not per-object glow hacks.
5. **Budget:** *OPEN* — set tri-count + draw-call budgets after first perf test.
6. **WYSIWYG collision (hard rule — ADR-002).** The rendered track IS the physics hull; any authored mesh
   must faithfully cover the collidable hull (no invisible lethal walls, no visible walls you pass through).
   Full statement + the ADR-000 litmus live in **§12** (added by the ADR-002 implementation).

## 9. Asset pipeline — **procedural-first** (decided 2026-09-17)

**Generate as much as possible in code; author as little as possible.** The handoff's minimal-forms language
makes this cheap, and it keeps the zero-asset-pipeline property.

| Asset | Approach | Confidence |
|---|---|---|
| Track slab | **BUILT** — one generated mesh from real `FloorSpan` data + procedural canvas texture | **done** |
| Edge channels | procedural **sweep of a 2D cross-section** along z (the ribbon never turns, so a sweep is a quad strip per profile segment — no `ExtrudeGeometry`, no authored mesh). Shell and glow as **separate geometries** so the one emissive face is tunable without touching the shell | **~100%** |
| Gaps, finish gate | procedural geometry (chamfered boxes + emissive strips) | **~100%** |
| Obstacle blocks (both states) | procedural geometry | **~100%** |
| Track pillars | **BUILT** — one instanced chamfered box, mirrored pairs (ADR-018) | **done** |
| Monoliths (Obelisk · Gate · Arch) | procedural — three box arrangements + scale/rotate variation | **~100%** |
| Asteroids (Angular · Plate · Broken) | **BUILT** — displaced icosahedron with planar cuts, three streamed bands, shader spin and drift, triplanar CC0 rock maps (see below) | **done** |
| Nebula sky | **BUILT** — domain-warped fBm and Worley noise baked to a cubemap, composited live, and the source of the IBL and the key light (see below) | **done** |
| Planets / moons | **BUILT** — analytic discs in the sky pass: terminator, lit limb, noise-volume relief; one planet in each preset (size 21 in Nebula, 17 in Deep Space), no moons by default (`Sky.planet*`, `Sky.moons` = 0) | **done** |
| Pickups | procedural — low-poly geometric icons | high |
| **Ships** | **keep the authored Quaternius CC0 models** — already integrated, WYSIWYG-locked (GDD §5.5) | — |

**Surface detail is the one real exception** — the "worn concrete / dark stone" read and the fracture
patterns. These still do **not** need image files: **fBm noise** covers stone, and **Worley (cellular)
noise is natively a crack generator**, which is exactly the destructible-block fracture language. Both are
GLSL functions, so "procedural textures" rather than "texture assets".

> **AS-BUILT (2026-09-18) — the track slab took the canvas route, not the shader route.**
> `scene/track-texture.ts` generates a `CanvasTexture` rather than writing GLSL. Cheaper to build, trivially
> tunable from named constants (which is what an art pass actually needs), and it costs no per-pixel ALU.
> The shader approach stays the plan for anything needing *world-space continuous* detail — asteroid stone
> and destructible fractures — where a tiling canvas would visibly repeat.
>
> **One tile = one panel, 16 × 20u.** 16u divides the 64u ribbon into exactly 4 panels with no partial panel
> at the edges; 20u matches `SEG_LEN` so transverse seams land on segment boundaries and agree with gap
> edges rather than cutting across them.
>
> **Hard-won rule: size texture features in WORLD units, never pixels.** The first version used a ~3px seam,
> which over a 16u tile is 0.05u — a five-centimetre line on a 64u ribbon, sub-pixel at any real distance.
> The surface read as flat grey until this was fixed.

**The sky is procedural (issue #215).** `scene/nebula-baker.ts` bakes the nebula once, and again only when
a structural tunable changes. The bake writes four continuous fields into a 1024² cubemap: glow (crest
lines across a warped band, with self-shadowed billow texture), clump density, crest proximity and cloud
shading. The fields are smooth, so the live pass can threshold them per pixel: the dark clumps get crisp
edges at any DPR, and a directional derivative of the density toward the crest lights only the side of
each clump that faces it. Stars are drawn live from a hash, not baked. The live pass reads the cubemap
four times and a 64³ tiling noise volume three times (`scene/nebula-noise-volume.ts`; the volume replaces
per-pixel hash noise, which was ALU-bound at DPR 2). Motion is a two-phase shear around the band axis,
faster near the crest, plus a brightness stream that travels along the crest and star twinkle. The sky
box follows the camera with no parallax term: a strafe offset on a sky layer reads as a rotation, so the
asteroids carry all parallax. Sky output is soft-knee limited to 0.56 linear, under the bloom threshold.
The same shade also goes into a 128² cube, with a ground disc and a thin marigold band at the horizon,
and that cube is PMREM-filtered into `scene.environment`. **The sky lights the scene.** Deck, rails,
monoliths, blocks, ships and rocks all reflect the sky the player sees; the flat grey gradient IBL is
gone. The cube re-renders only when a sky or `Env.*` tunable changes, never per frame. A 64×32 probe
measures two values: the horizon colour (`NEBULA_HORIZON`, which the scene fog follows) and the
direction and colour of the rock key light. The `Nebula` and `Deep Space` presets on the `/test-level`
panel make the two sky families from one parameter set. Measured sky-only cost, M3 Pro, 1600×900:
0.62 ms at DPR 1, 1.05 ms at DPR 2.

**Planets are analytic, not meshes.** Each is a disc test in the same sky pass: the direction's offset
from the planet centre gives a sphere normal, a sun direction (`Sky.planetPhase` around the view axis,
`Sky.planetTilt` around the planet) gives the terminator, `pow( r, 16 )` gives the lit limb, and three
reads of the noise volume give relief. The planets are in the light cube too, so a large Deep Space
planet contributes to the IBL.

**The rail glow is an analytic line light in the deck material** (`scene/rail-glow.ts`), not a scene
light. Two lines at the rail x positions give a wrapped `1/d` diffuse term and a specular
streak from the closest point on the line to the reflection ray, patched into `lights_fragment_end`
of the floor material only. A per-segment rail mask (built from `buildRailRuns`) turns each line off
where its rail is absent, with a 2u ramp at run ends. The lines are in world space and the shader
moves them to view space with `viewMatrix`, so the rear-view pass lights the deck correctly. The six `RectAreaLight`s it replaced were the single largest cost of a
DPR 2 frame (8 ms of 17.7 on an M3 Pro at 3456×2160), because three.js evaluates every area light
with LTC on every fragment of every standard material. The line light costs a few dozen ALU on deck
fragments. The `Environment` band cylinder still gives blocks, monoliths and ships their marigold.

**DPR 2 frame budget, M3 Pro, 3456×2160, GPU-synced medians while driving** (`readPixels` each
frame; plain rAF timing does not track the GPU under ANGLE Metal): 10.0 ms with everything, 5.4 ms
with every mesh hidden (post chain, rear view, HUD, present), deck 2.1 ms, sky 1.4 ms, rocks 0.9 ms,
point lights 0.5 ms. The canvas is created with `antialias: false, alpha: false` (`scene/canvas-gl.ts`):
the composer's final quad gains nothing from a multisampled default framebuffer, and an opaque
canvas skips the compositor blend. The next millisecond lives in the post chain, not the scene.

**The rock maps are the only bitmaps in the pipeline.** They are `public/textures/dark-rock-*.jpg`, Poly
Haven `dark_rock` (CC0), 1k. The asteroid shader uses the luminance of the diffuse map, tinted to
graphite, and the AO, roughness and normal maps. It samples them triplanar in object space, so the
maps rotate with the rock. The maps are not in LFS. `rock-field.tsx` loads them with `useTexture` and
has no error boundary, so a missing map is expected to throw out of the Canvas (not tested). The `nebula-backdrop.jpg` placeholder is deleted.

> **Honest cost:** shader noise trades texture memory for per-pixel ALU, which is in tension with §8 rule 3
> ("light does the work, not texels"). With instanced fields and 12 ships it is usually a win, but it is a
> real cost — **measure it at the 12-ship perf gate (§10 OQ5 / issue #17), don't assume it.**

A Blender MCP toolchain remains available if an authored asset turns out to be genuinely cheaper.

## 10. OPEN QUESTIONS
1. ~~**Fidelity of ships**~~ — **RESOLVED:** keep the authored CC0 models (§9); everything else procedural.
2. ~~**Track look** — tube vs open ribbon~~ — **RESOLVED (2026-08-10, reaffirmed):** hybrid open ribbon with
   distant non-collidable framing. The handoff's monolith/asteroid/celestial vocabulary *is* that framing.
3. ~~**Palette lock**~~ — **RESOLVED (2026-09-17):** §3 marigold-primary palette. Player-hue question
   deliberately deferred — one world colour for everyone; hue-shift opponents only if playtest demands it.
4. **Chromatic aberration / heavy post** — still open; gate behind a comfort slider. The handoff adds a
   constraint: *"readability should survive with bloom disabled."*
5. **Perf budgets** — still open. Now carries the procedural-shader cost from §9. Set at the 12-ship gate.
6. ~~**edge-glow is a weak guide at true scale**~~ — **ANSWERED by the art-direction handoff (`docs/art-direction/handoff/`) §5.** Confirmed: *"Track
   edges define the ribbon boundary; they cannot supply all fine positioning across 64u."* The answer is
   **interior cues**: low-contrast large panel divisions, occasional transverse seams, restrained
   material/reflection differences, and clear hazard-to-floor **contact shading**.
   **Explicitly rejected** — and this is the important half — *"no automatic racing line, safe-route glow,
   dense emissive seam grid, or dependence on monolith spacing for steering."* That kills the guide-rail
   failure we were worried about: cues give speed and lateral-motion feedback **without** revealing the safe
   path. Visible on board `12`.
7. ~~**deadly vs breakable must read in ~0.5s**~~ — **ANSWERED by the art-direction handoff (`docs/art-direction/handoff/`) §6.** The rule is
   **"sealed mass = avoid; broken-contour shell = shoot to clear"**, and crucially: *"Surface crack texture
   alone is insufficient for the approved read."* The distinction must break the **outer silhouette** —
   visible interruptions at top/side contours — not merely decorate the faces. Interior floor cues and block
   readability are **both** required, not alternatives.
   **`Alert Red` as a fallback is rejected**: *"No new red hazard code is approved. Cyan is not an alternate
   energy family."* So the single-energy-colour system holds and silhouette carries the load.
   *Correction to our own framing:* we claimed an 8u block gives "half a second" to react. v2 rightly notes
   *"at 55 u/s, half a second is 27.5u travel; obstacle height does not establish the detection window"* —
   the window is set by draw distance and framing, not block height. The gate still stands, measured properly.
8. **NEW — camera height 4–5u vs the 8u see-over-walls rule.** v2 proposes a low camera (nominal **4.5u**)
   with **selective occlusion fade**. This collides directly with ADR-006, where the chase cam sits at **+9u**
   *specifically* so you can see over the 8u pillars and plan a line (see `camera/chase.ts`). Fading occluders
   is the proposed mitigation, and v2 is clear it is **a prototype, not a frozen setting**, requiring a 6–8u
   control camera alongside. **This is a gameplay-affecting change, not an art change** — it needs an ADR and
   a feel-gate before any of it lands. It also overlaps PR #120 (chase-cam reframe), which is still open.

## 11. As-built + art research (2026-08-10) — inputs for the S6 art pass

*(S5 shipped the first real combat VFX; a research pass then inventoried the scene + surveyed the aesthetic
space. This section **persists that research** — it is INPUT for S6, not locked decisions.)*

**As-built scene reality (the gap vs the pillar):**
- **Bloom is timid** in the networked race (`intensity 0.5, threshold 0.6`). The signature look only half-exists. *(The `/solo` half of this note is stale — `/solo` was removed in `52f5a04`.)*
- **No atmosphere:** flat `#05060a` void — no fog, skybox/gradient, or real starfield (cuberun, our anchor, leans on fog + a ~10k-star field + a galaxy skybox for depth). *(STALE 2026-09-22 — the scene now carries a nebula backdrop, a drei starfield and linear scene fog (`scene/scene-fog.tsx`, issue #210, `Fog.*` in the tuning panel). Fog reaches full density at 420u, inside the block streaming edge `AHEAD = 900`, so blocks arrive fully fogged. Its colour is the measured mean of the backdrop at the vanishing point (`BACKDROP_HORIZON`), so distance converges on the sky instead of going darker than it.)*
- **Ship identity is a beacon pip**, not the hull — at speed you read a small glowing dot, not a coloured ship. *(Re-scoped 2026-09-17: under the single-marigold world this matters less for identity and more for simple presence.)*
- ~~**`COLOR_COUNT` is 8**~~ — **STALE. `COLOR_COUNT = 12` in source, verified 2026-09-17.** The 8→12 task is done. Instancing discipline is solid (few draw calls) — the art can get much richer with no perf bill.

**Cheap, high-impact moves (S6):** unify solo/net into one scene module + push bloom (~`1.0–1.5` / threshold `~0.4`); add **atmosphere** (`fog` + drei `<Stars>` + gradient backdrop → new `scene/environment.tsx`); put the team hue **on the hull**; vignette + subtle grain; speed-ramped chromatic aberration (the core set merges into ~one full-screen pass — largely ship-count-independent).

**Research-informed answers to §10:**
- **OQ1 (ship fidelity):** keep the authored Quaternius CC0 models — already integrated, WYSIWYG collision (GDD §5.5). Pure-primitive is a bigger pivot; don't chase it.
- **OQ2 (tube vs ribbon):** still open — tube = cheap enclosed atmosphere + speed cues; open ribbon fits the current sim/hazards. Trade-off, unresolved.
- **OQ3 (palette):** colour science caps categorical palettes at ~8; 12 against black under bloom is hard. Three concrete proposals exist (Wong-extended / max-chroma neon-wheel / value-staggered); lean on **silhouette + value-staggering** as the colourblind backstop, or auto-assign for max pairwise distance among present players. **Decide in S6** (and raise `COLOR_COUNT` 8→12).
- **OQ4 (heavy post):** the synthwave set (Bloom/Vignette/ChromaticAberration/Noise/Scanline) is confirmed in `@react-three/postprocessing` and composes cheaply — but it directly threatens **combat legibility** (bolts + 12 ships wash to white). Gate it behind a **comfort/intensity slider** (§6/§7); consider **SelectiveBloom** now that combat is on screen. Verify exotic effects (DoF/N8AO/GodRays) against the pinned `3.0.4` before use.
- **OQ5 (perf budgets):** set after a first 12-ship test; drei `<PerformanceMonitor>` + `<AdaptiveDpr>` as insurance.

*Key files an S6 art pass would touch: `net-canvas.tsx`, `scene/track-view.tsx`, `scene/scenery.tsx`, `scene/ship-model.tsx`, `colors.ts` (+ `@slur/shared` `COLOR_COUNT`), `scene/explosions.tsx`; new `scene/environment.tsx` (built — env-lab), `scene/trails.tsx`.*

**S6 direction LOCKED (2026-08-10):** aesthetic = ~~**TRON colour/material × Trek-Wars geometry, de-rounded**~~
**→ SUPERSEDED by the 2026-08-12 full-TRON pivot below** (§1/§4/§7; the angular result is unchanged, the
Trek/Wars borrowings are dropped); palette = **cyan `#00e5ff` × marigold `#ff9f1c` ("gainda")**, magenta → one player hue; world =
**hybrid open ribbon + distant non-collidable tube-walls** (resolves OQ2); post = **conservative** — bloom + fog
+ starfield + gradient only, chromatic-aberration / scanline / vignette **DEFERRED** to a post-12-ship
legibility gate (resolves OQ4); **`COLOR_COUNT` 8→12**, value-staggered / max-pairwise auto-assign (resolves
OQ3). Chosen environment prototype = **Grid Void** (`scene/environment.tsx`; view at `/env-lab`, keys 1/2/3).
Integrate into the net canvas + landing during S6 Implement; retune wall density/height + bloom at the gate.
**AS-BUILT (2026-08-10):** landing UI shipped (de-rounded neon over Grid-Void, cyan×marigold); **REMAINING** —
in-game net-canvas env integration, hull-colour on the ship, `COLOR_COUNT` 8→12, ship trails, dissolve derezz.

**AESTHETIC PIVOT (2026-08-12 — user direction) — ⚠ ITSELF NOW SUPERSEDED, see ADR-008 / §1 above.**
LCARS was dropped in favour of **full TRON** as the single language for colour, material, geometry, UI and
audio, with the cyan×marigold "gainda" duo kept and the era question (1982 vs *Legacy*) gated behind issue
**#117**.

**What replaced it (2026-09-17, ADR-008):** the external package (then `art-handoff-v1`, now consolidated
unversioned at `docs/art-direction/`) was adopted as the frozen scene/world direction. Three things changed:
1. **Marigold `#F59A24` became primary** and the only energy colour; cyan demoted to a sparing support
   accent. The "gainda" duo is retired as a *duo*.
2. **TRON-influenced, not TRON-literal** — so **#117 closes as moot**. Neither era is being cloned, and the
   UI/audio work it blocked is now ordinary open design work.
3. The **angular geometry survives both pivots** unchanged — it was right under all three framings.

*Kept here rather than deleted because this is the §11 research-and-history section; the live direction is
§1–§4. History is forward-framed per the project's docs convention.*

## 12. Physics ⇄ visual split — **FROZEN** (ADR-002, 2026-08-10)

**WYSIWYG collision stays a documented rule, not code.** The hull the player sees IS the collidable
footprint, and the rendered track IS the physics `Segment` set — `scene/track-view.tsx` renders the shared
sim's physics `Segment`s **directly**. There is deliberately **no** `resolveVisual` / `VisualTrack` / visual
abstraction: introducing one before authored content or the art pass actually needs the visual to diverge from
the hull would be speculative structure.

- **Where the seam sits:** gameplay data that both clients must agree on (pickups today; hazards/checkpoints
  later) is a first-class `Track.anchors[]`, materialized by the provider and derived from the descriptor — see
  ADR-002 and `sim/track.ts`. Cosmetic-only data does **not** go on the `Track`.
- **Litmus (ADR-000) for anything new:** "would two clients disagreeing on this desync the game?" **yes →** it
  is gameplay data (a `Track` anchor / physics `Segment`); **cosmetic-only →** it would belong to the future
  (currently unbuilt) VisualTrack, never the physics `Track`.
- **Unfreeze when:** authored levels or the art pass require the rendered geometry to diverge from the
  collidable hull. Until then, render output is byte-for-byte the physics track.
