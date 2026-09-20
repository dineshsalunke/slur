# Task 2 — Track: floor material, edge rail, gaps

**Status:** in progress — the deck, the outboard rail and gaps are built; the emitter array that lights
them is in flight (`art/emitter-array`). Slice 3's floor finish is the open end.
**Depends on:** task 1 (judged under the real sky and its environment light).
**Blocks:** task 3 (lighting balances against a real track), and every composition gate after it.

---

## 1. What this task delivers

The playable ribbon, procedurally: **floor material**, the **marigold edge rail**, and **gap** treatment.
This is the thing the player stares at for two and a half minutes, so material restraint matters more here
than anywhere else.

Current code: `apps/client/app/game/scene/track-floor.tsx`, `track-materials.ts`, `track-texture.ts`,
`track-view.tsx`, `track.tsx`, `tube-walls.tsx`.

## 2. Spec

**Floor** (`handoff/03_TRACK.md`, `HANDOVER.md` §4–5) — dark graphite / black metal · large clean panel
divisions · sparse fine seams · **restrained** gloss, not a mirror · broad warm reflection carrying the rail's
energy across the surface · **no** noisy grunge, greebles, ornamental lights.

**Interior cues** — low-contrast large panel divisions, occasional transverse seams, restrained
material/reflection differences, clear hazard-to-floor contact shading. These exist because edges alone
cannot supply lateral positioning across 64u. **Explicitly forbidden:** an automatic racing line, safe-route
glow, a dense emissive seam grid, or visible runtime lanes. *Not every seam is emissive — edges define the
boundary, interior cues are non-emissive.*

**Edge rail** — continuous or near-continuous marigold energy defining the ribbon. Functional, not
decorative: it reinforces perspective and speed. Must read **golden marigold**, never vermilion, rusty red or
red-orange, **after tone mapping** — check the final displayed pixels, not the input hex.

> **It stands OUTBOARD of the deck, and that outranks its styling — ADR-012 (owner, 2026-09-20).**
> The deck's rendered top face ends at exactly ±`HALF_WIDTH`; the rail occupies `[32, 32+RAIL_W]`
> beside it. As decided: **1u wide × 1u tall, 0.15u chamfer on the long edges, centred pivot ±32.5.**
> It may not take a single unit of playable width, at any setting. The earlier "narrow strip embedded
> at the deck's outer edge" reading is retired — it is unbuildable without eating deck, and it shipped
> a deck drawn 62u wide while the player flew 64u. Departure from board 24 panel 02's exclusion of
> *"raised rails"* is recorded and goes to Codex as `PASTE-TO-CODEX-rail-outboard.md`.

**Gaps** — real missing geometry, never a black plane. Frozen three-part treatment:
1. subtle marigold edge definition around the opening,
2. slight inner-lip glow revealing the cut,
3. darker inner cavity for depth contrast.

Rim brightness **must not perceptually close the opening**. Slab thickness must not conceal the gap at low
camera height. No warning brackets, icons, or off-palette colours.

**Dimensions — from `docs/ART_SCALE_REFERENCE.md` and GDD §0 only.** Ribbon 64u (X −32…+32). Segment 20u.
Gap: 20u down-track, minimum 4u wide, partial to full 64u. Slab thickness is an art choice (1u was a concept
study, not a constant). `MIN_CLEAR = 7u` is a gameplay contract — art does not touch it.

**A/B/C** — do not redesign the track per intensity. Vary glow intensity, reflection intensity, atmospheric
response and environmental spill only. Geometry and readability stay fixed.

## 3. References

`07_track_visual_language_final` — **material language only.** Its printed scale panel is wrong and
superseded; that does not invalidate its material read.
`08_gap_variations_reference` — partial/full-width intent. No lane or dimension authority.
`09_small_gap_readability_final` — edge/lip/void treatment **only**. Its tiny-hole dimensions are superseded.
`12_approved_scene_marigold_depth` — top precedence for how the floor's gloss and warm reflection actually read.

## 4. Definition of done

- Procedural: no bitmap textures in the track pipeline.
- **Gap edges are distinguishable from panel seams and from reflected light** at race speed. This is the
  single hardest read in the task — verify it explicitly, moving, not parked.
- Rail reads marigold (not red-orange) **in the final tone-mapped frame**.
- Floor repetition is not visible — a tiling period the eye can lock onto is a failure.
- Reads correctly with bloom **on and off**.
- A 4 × 20u gap is legible at 55u/s from the production camera.

## 5. Out of scope

Camera height (ADR-010 defers it; `HANDOVER.md` §8's 4–5u proposal is a *prototype*, not approved) ·
obstacle blocks · finish gate · pickups · final lighting balance (task 3).

## 6. How it is judged

`/art-lab`, real chase camera, **at race speed**. Bloom on and off. Against
`refs/12_approved_scene_marigold_depth.small.jpg`.

## 7. Decision / As-built

**Status: D1–D6 are built; the deck's finish is the open end** (2026-09-20). Eight decisions are of-record
below. D1–D5 predate any code; **D6–D8 were taken after #131 landed** and they re-shape what remains.

**#131 landed slice 0 only** — worth being precise because its PR title says "floor material": tone mapping
ON at the ACES default, `/art-lab`'s own `ambientLight` + `directionalLight` deleted with the sky rig
mounted unconditionally, and the track split into leaves with blocks defaulting OFF. At that point
`TrackFloor` and `track-texture.ts` existed but were mounted only behind `/art-lab`'s `slab` toggle.

**That is no longer the state. D1 is DONE** — verified on `dev` @ `1b4d760`: `track-view.tsx` composes three
leaves, `TrackFloor` is the game's floor, and the instanced 0.6u quads are gone. **D3 is done** —
`toneMapped: false` is absent from `track-materials.ts`, with a header comment recording why opting out made
the direction's own "does the rail read marigold in the final frame" test unrunnable. **D5 is done** — the
leaves are split so blocks default off.

**ADR-012 is now true in the code, not just the docs** (#151, `1b4d760`): boundary variants A/B/C are
deleted and the outboard rail is the only boundary, so the deck's top face spans `x0..x1` unconditionally
and no code path can inset it. The committed default had been variant A, which is non-outboard — the deck
drew 62u while the player flew 64u. Deleting rather than re-defaulting is what makes the invariant hold by
construction. A lighting-side corroboration arrived independently from the emitter-array work: **a strip
coplanar with the deck illuminates it at exactly zero** (`dot(N,L) <= 0` against the deck's +Y normal), so
the retired inset reading was not merely awkward to light, it was unlightable at any intensity.

**⚠ The dependency in this file's header is INVERTED on purpose.** It reads *"Depends on: task 1 (judged
under the real sky and its environment light)"*. The owner reversed that: task 1's `/iso-sky` gate is
**deferred until a track is in frame**, because the two roughness probes are not enough scene to judge
composition against — tone mapping, patch FOV and tilt are all whole-frame calls. Deferred, **not skipped and
not failed**. See `01-background/HANDOVER-SESSION-5.md`.

### D1 — `TrackFloor` becomes the game's floor; `TrackView`'s instanced floor quads are deleted

Two floors exist today. `TrackView` renders the game's floor as instanced **0.6u-thick untextured boxes**;
`TrackFloor` is a **single generated continuous mesh**, 2u thick, textured, with computed end caps — and it is
mounted **only** behind `/art-lab`'s `slab` toggle. Nothing in the game uses it.

`TrackFloor` wins for two reasons, neither aesthetic:
1. **Gap treatment is geometry.** The frozen three-part gap read (marigold edge definition · inner-lip glow ·
   darker inner cavity, §2) needs a continuous mesh with real caps. Instanced boxes cannot express an inner lip.
2. **Instanced boxes repeat every 4u**, which is exactly the *"dense emissive seam grid"* §2 forbids.
   One continuous mesh makes panel size a **texture** decision instead of a geometry constraint.

Blocks and rails stay in `TrackView`. Only the floor quads go.

### D2 — the emitter array comes FORWARD from task 3 into task 2

Build the patched-material emitter light now: **`MeshStandardMaterial` patched through `onBeforeCompile`, fed
by a FIXED-SIZE uniform array of the K nearest emitters**, with the **edge rails as the only emitters** in this
task. Mechanism and its ≥5-option enumeration: `03-lighting/research/2026-09-18-emissive-as-light.md`.

**`onBeforeCompile` is the idiom, not a hack** — it is what drei's own `MeshReflectorMaterial` does, and it is
already precedented in this repo by `ship-model.tsx`'s dissolve shader.

**FIXED-SIZE IS LOAD-BEARING AND MUST BE SAID IN THE CODE.** A varying light count **recompiles the shader
mid-race**; a fixed-size array has no count to churn, so it cannot. That is the entire reason the research
chose this shape over a real-light rig. Do not "tidy" it into a dynamic array.

*Why this moves earlier:* §2 requires *"broad warm reflection carrying the rail's energy across the surface"*,
and §8 already resolved that to **grazing-angle specular streaks, not mirrors** — so `MeshReflectorMaterial`
and its extra scene render stay unused. Without this, task 2 delivers a dark grey ribbon with a marigold
stripe: not the spec, and no more judgeable than the two probe spheres, which defeats the reason the track was
reordered ahead of the sky gate. `03-lighting/README.md` §1a agrees — the rig is *"downstream of the **track**
(task 2), not a free-standing thing"*, because the warm half of "Cold Space, Warm Energy" is carried **entirely
by gameplay emissives acting as light sources**.

Task 3 then **balances and extends** this to engines, pickups, projectiles and monolith seams rather than
inventing it.

**Rides along:** the isotropic-vs-anisotropic sub-question (§8) decides whether the patched material is
`MeshStandardMaterial` or `MeshPhysicalMaterial`. Settle it **by rendering**. Footgun already paid for: the
`anisotropy` setter recompiles when the value crosses zero (`this._anisotropy > 0 !== value > 0` → `version++`),
so never animate or toggle it through 0 mid-race.

### D3 — RESOLVED (owner, 2026-09-19): tone mapping is ON, at the renderer default, everywhere

Every surface in `track-materials.ts` sets `toneMapped: false`. But §4's criterion is *"rail reads marigold
(not red-orange) **in the final tone-mapped frame**"* — which those pixels opt out of **by construction**. As
written the test cannot be run.

**It does not become a panel switch.** The owner settled it directly: *"since we will be having everything
tone mapped … lets keep the tone mapping on default."* `toneMapped: false` comes **off** the track surfaces
and the renderer default stands. One less knob, and the frame becomes internally consistent instead of half
the pixels living outside the transform the other half go through.

*Verified-this-session* (installed `@react-three/fiber@9.7.0`, `dist/events-*.esm.js`): `<Canvas>` sets
`gl.toneMapping = ACESFilmicToneMapping` unless the `flat` prop is passed, which it is not anywhere in this
app. So the default here is **ACES Filmic**, and that is load-bearing for the gate: ACES desaturates and
rolls hot saturated warms toward yellow-white, so "does the rail still read marigold" becomes a **real** test
rather than a tautology about the input hex.

**Consequence, expected and not a regression:** every emissive value in `track-materials.ts` was chosen to
*bypass* tone mapping and will not survive being put through it — the rail's `emissiveIntensity: 2.6` first.
Re-tuning them is the work of task 2's first slice.

This also forecloses task 1's deferred `Tone map` knob: ON.

### D4 — NEW (owner, 2026-09-19): `/art-lab` loses its own lights; the shipped sky rig lights it

`art-lab-canvas.tsx` mounts `ambientLight intensity={0.4}` plus `directionalLight intensity={1.1}` **on top
of** `DeepSpaceSky`, which already brings the shipped `StarLight` + `SkyEnvironment` rig. The track would
therefore be judged under two lab-only lights the game does not have — and a flat ambient specifically
contradicts the standing fact that **there is no fill; shadow sides go black** (`INDEX.md` §4). A review
conducted under lighting the game does not ship is worthless, which is the same class of error as judging a
silhouette against a placeholder sky — the deadlock that reset the earlier art attempt.

**Both lab lights are deleted.** The lab is lit by `DeepSpaceSky` and the track's own emissives, nothing else.

**Consequence that must be handled in the same change:** the sky's light and environment currently ride the
`backdrop` layer toggle, so deleting the lab lights would make "backdrop off" mean "pitch black" and destroy
a legitimate review mode. The rig (`StarLight` + `SkyEnvironment`) stays mounted regardless of that toggle;
`backdrop` hides only the visible patch. `DeepSpaceSky` already takes `light` and `environment` props for
exactly this split (`/iso-sky` uses them for its self-test) — mechanism is the lane's call, behaviour is not.

### D5 — REPLACED (owner, 2026-09-19): the blocks come OUT of the review frame; they are not retoned

**What D5 said first, and why it was wrong.** It read: *retone the red `#ff2740` lethal blocks to the warm
ramp as review setup, because red is excluded from the palette and those blocks are in every frame the floor
would be judged in.* True premise, wrong remedy. The owner challenged it directly — *"these obstacles are
just plain box, they don't really help in any way and also block the view. do you really think we need
them?"* — and noted the scrapped earlier art attempt had the same blocks in the same lab for the same
non-reason. **They are right.** Retoning was treating a symptom of leaving them in frame at all.

**The actual cause, verified in the code.** `/art-lab`'s layers bundle blocks and rails into one toggle:
`art-lab-canvas.tsx` mounts `layers.hazards ? <TrackView …>`, and `TrackView` draws floor quads **plus**
lethal blocks **plus** drag blocks **plus the edge rails** in a single component. So `hazards` defaults ON
not because anyone wanted untextured boxes in the shot, but because switching them off also deletes the
**marigold edge rail — the subject of task 2**. `lab-layers.ts` already states the principle the blocks
escaped: *"DEFAULTS: track ONLY. The lab's primary job is judging the track surface itself, and environment,
ships and the finish gate are visual noise while doing that."*

**The decision.** Split the toggle: **rails and blocks become independent layers, and blocks default OFF in
the lab.** Mechanism is the lane's call (a `showBlocks` prop mirroring the existing `showFloor`, or splitting
`TrackView` into two leaves — the latter fits non-negotiable #10 better, and D1 is already reshaping this
component). Behaviour is not: judging the floor, rail and gaps must not require looking past plain boxes.

Blocks stay **one click away**, because §2 does ask for *"clear hazard-to-floor contact shading"* and that
read needs a block present. It is a check you switch on deliberately, not the default frame.

**The retone is therefore cancelled, not deferred-with-a-workaround.** No blocks in frame → no forbidden red
in frame → nothing to hold-retone. `LETHAL_SURFACE`'s `#ff2740` is left exactly as it is and belongs to the
later block-design task, judged when someone is actually judging blocks. **Do not touch
`track-materials.ts`'s lethal or drag colours in task 2.**

### D6 — NEW (owner, 2026-09-19): the track boards govern seam density; board 17 is atmosphere only

Board 17's deck shows **continuous glowing lines running the full length of the deck in a regular lateral
rhythm** — which reads as lane markings, the one thing the written direction forbids outright. Board 25's
overview is the restrained version: short segments, irregular spacing, mostly dark joints. Since board 17 is
the *golden reference*, this had to be settled before a seam existed, or the seam system gets built twice.

**The track boards win. Board 17 is a mood frame, not a seam specification.** The evidence is inside the
track package itself, and it is newer: board 24's panel table specifies *"sparse short emissive segments of
varied lengths and irregular spacing among mostly dark joints"* and puts *"repeated lane-like cadence, full
glowing grid or a highlighted safe route"* in its own do-not-copy column
(`docs/art-direction/track/24_track_BRIEF.md`). `ART_MATERIALS.md` M7 then gives the reason it matters:
*"boundary and interior inserts are separated by continuity, not by intensity… making inserts regular or
continuous destroys that separation and produces the lane read the direction forbids — which is the failure
mode, not dimness."*

So the interior is **sparse, short, varied in length, irregularly spaced, on joints that are mostly dark.**
The boundary is the only continuous marigold signal in the frame. Dimness is **not** the separator and must
not be used as one — both are gameplay tier and both may be equally hot.

### D7 — NEW (owner, 2026-09-19): the emitter array is built BEFORE the floor's finish is judged

The lane brief ordered floor material at slice 2 and the rail + emitter array at slice 3. **That order is
reversed.** It contradicted D2's own justification for pulling the emitter array forward at all — that
without it the task delivers *"a dark grey ribbon with a marigold stripe… no more judgeable than the two
probe spheres"*. That argument applies hardest to the **floor** slice, whose gate is *"the surface reads as
dark metal rather than grey plastic"*: dark metal carries no information until something warm is reflecting
off it, so judging the deck's finish before the rail lights it is judging it under light the finished scene
will not have.

This is the same rule that put the background first in the arc — *lighting flows from the environment, so
anything judged under placeholder light must be re-judged the moment the real light lands*. **Light first,
then the surfaces it lights.** The deck keeps its current material through the rail slice; it is refined
afterwards, once, under final light.

### D8 — NEW (owner, 2026-09-19): board 25's wear lives in the D2 shader patch, in world space

Board 25 froze the wear treatment *after* the lane brief was written, so the brief has no slice for it. It
gets one — and not the obvious one.

**The obvious mechanism fails its own gate.** `track-texture.ts` is a single 1024² canvas mapped to one
16 × 20u panel, so it repeats 4× across the ribbon and ~400× down it. §4 requires *"floor repetition is not
visible — a tiling period the eye can lock onto is a failure"*, and board 25 demands *"sparse, broad, softly
bounded patches"* with *"large readable features"* that *"avoid identical stamps on adjacent tiles or obvious
repeating bands"*. **A tile cannot contain a feature larger than itself**, and a second `roughnessMap`
inherits the identical period. Adding a wear map to this pipeline builds the failure in.

**What is built instead: wear is world-position-driven noise inside the same `onBeforeCompile` patch D2
already adds for the emitter array.** No UVs, no tile, no period — by construction rather than by tuning.
Broad patches may be any size because nothing bounds them; the wear is stationary on the track because it is
keyed to world position; and every control board 25 asks us to expose — overall amount *including zero*,
broad-patch coverage and characteristic size, the dulled-vs-smoother delta, scuff density / length variation
/ directional bias, sparse edge-rub amount, and a stable seed — becomes a **live uniform** rather than a
canvas rebake. Wear and light become one shader instead of two systems that must be kept in agreement.

The existing tiled canvas is **kept**, demoted to what it is genuinely good at: fine grain below ~1u, where
a repeat period is invisible at any real viewing distance. Board 25's exclusion list still binds — no rust,
no skid marks, no bright silver scratches, no dents, no all-over fine noise, no lane-like wear bands, no
fully outlined tile edges.

### M1 was TAKEN — and it is still the likeliest blow-up

`ART_MATERIALS.md` M1 specifies bare conductor: **metalness 1.0, roughness 0.35–0.50**. The earlier reading
of this section — that the code shipped 0.12/0.62 and M1 was a proposal — is **stale**. Verified on `dev`
@ `1b4d760`, `track-materials.ts:14,16`: `FLOOR_ROUGHNESS = 0.42`, `FLOOR_METALNESS = 1.0`. M1 was taken.
Its old reason for backing off ("no environment map in this scene") had already died when the lab lost its
own lights and the shipped sky rig brought `SkyEnvironment`.

Taking it does not settle it. Metalness 1.0 removes diffuse entirely, and `INDEX.md` §4 records the sky at
**~linear 0.01** as an IBL source, so every part of the deck the rail's specular does not reach goes **pure
black**. That may be exactly right — *"there is no fill; shadow sides go black"* is the stated direction —
or it may read as a void with a stripe through it. It was called here as the single most likely thing to
fail at the rail gate, and **it failed.**

### The rail gate result — the deck went black, and metalness is NOT the cause (2026-09-20)

With the emissive out (below), the owner flew `/art-lab` and reported the deck **black everywhere except one
specular patch near the camera, on one side only.** That render settles three things at once.

**The array is not broken.** A visible specular patch proves the `onBeforeCompile` patch compiles, its
uniforms upload and `RE_Direct` runs. Worth stating because this lane had already shipped one fully green
gate with the light doing literally nothing (the emitter sat below the deck plane), so a black deck was
ambiguous evidence until something lit up.

**The black is a correct render of a wrong lighting geometry.** The emitters sit at `|x| = 32.5` with
`RAIL_EMITTER_LIFT = 0.5` against a 64u deck whose normal is +Y. At the centreline that is **0.88° above the
surface plane — `N·L ≈ 0.015`**, rising to only ~0.32 one unit inboard of the rail. At metalness 1.0 there is
no diffuse term, so the deck can produce nothing but a narrow view-dependent glint where the reflection
vector happens to line up. That is exactly what is on screen.

**Backing metalness off does not fix it, and that is the non-obvious part.** `RE_Direct` multiplies *both*
the diffuse and the specular term by `dotNL`. Lowering metalness restores a diffuse lobe that is then
multiplied by the same 0.015. It is the reflexive fix, it costs M1, and it buys nothing. **Do not let this
be "solved" by dropping metalness.**

**The general form, and it is the load-bearing sentence:** two 1u strips at the edges of a 64u plane are,
for everything but the last couple of units, *functionally coplanar with it*. This is the same finding that
killed the inset reading and corroborated ADR-012 from the lighting side — it survived the fix for it.
**Edge rails alone cannot light this deck at any intensity**; at `N·L = 0.015` matching an overhead source
needs ~65×, and the near-rail band would blow out long before the centre lifted.

**Open, and escalated to the owner rather than taken here:** roughness is the next dial — the wet-road case,
where grazing light throws long streaks only off a *smooth* surface, so 0.42 may be scattering the streaks
§8 ruled for into nothing. `floorRoughness`/`floorMetalness` are being wired as live knobs because the two
constants under test were the only ones that could not be turned. Behind that sits a question a slider
cannot answer: whether the deck gets a **cold key from above** (the star contributes nothing to it today),
or whether the deck is *meant* to be a void the rails draw the edges of. *"There is no fill"* is not the
same as *"there is no key"*. The owner's call, not this document's.

**Also outstanding:** the glint appeared on **one side only**, where two rails and a centreline ship predict
a symmetric pair. Suspected the K-nearest scan — with `EMITTER_SLOTS = 12` and runs cut short by deck gaps,
a pure nearest-N distance sort can fill every slot from one rail and starve the other. Under diagnosis; the
fix shape (balance per side vs more slots) is a decision, not a patch.

**What was hiding it, and is now gone (2026-09-20, owner's call on a frame):** the deck also carried
`FLOOR_EMISSIVE = '#c8d0d8'` at intensity 0.05 — a flat cool-grey glow whose own comment recorded it as
*"the deck's only brightness control, measured: 0 blacks it out, while envMap, ambient and the star each
move nothing on it."* It was never art direction; it was a stand-in from when nothing lit the deck at all,
added to stop metalness 1.0 rendering a black void. Emissive is added per-fragment with no dependence on
view angle or light direction, so it laid a **constant grey pedestal with zero form** across the frame and
swamped the low end that grazing-angle specular streaks need to read against — the deck could not be judged
while it was in. The emitter array is the light it was standing in for, so it was **deleted** rather than
dialled down. Expect a much darker frame; that is the point. With it gone, metalness 1.0 is finally being
judged on what it actually does.

### Process deviation, deliberate

`INDEX.md` §3 opens each task with a ≥5-option research agent. **Skipped for task 2, with the owner's
agreement** — that enumeration is already paid for by the 743-line
`03-lighting/research/2026-09-18-emissive-as-light.md`, and §8 settled the reflection question against the
boards. Straight to align.

## 8. The floor-reflection question — RESOLVED by board evidence (2026-09-18)

**Verdict: grazing-angle specular streaks, NOT mirror reflections.** The emissive-as-light research
(`03-lighting/research/2026-09-18-emissive-as-light.md`) flagged this as its own central bet, made from
reading three JPEGs. It was cross-checked across five independent floor regions and it holds.

**The falsifier that decides it.** A mirror reflects *dark* geometry; specular can only ever *add* light.
So: does any board show a dark inverted body on the floor beneath a dark monolith? **No — not once.**
In `12_…b12-under-right-monolith`, two dark slabs stand on the floor and the bright streaks run
straight through the region where their inverted bodies would have to be. The floor is never darkened
by anything above it.

**Corroborating evidence, each independent:**

| Region | What it shows |
|---|---|
| `12_…b12-under-pickup` | The floating diamond pickup throws **one narrow column** far longer than the pickup is tall, with no diamond silhouette and no gap between object and streak. A mirror image would be the same size as the object and offset below the floor plane. |
| same crop, ship | Three engine points → three long tapering smears along the view direction, not three inverted engines. |
| `12_…b12-under-left-monolith` | The edge rail throws soft vertical smears toward camera, broken at panel seams — per-panel, not a continuous mirrored line. |
| `10_…p1floor`, `07_…p1floor` | Same engine-streak signature at a different camera and a different artist pass. |

**Signature, stated so it can be reproduced:** bright-only · elongated **along the view direction** only ·
length ≫ source size · soft-edged, tapering with distance · no silhouette · never inverts.

**What this buys.** `MeshReflectorMaterial` stays in reserve and is very likely never needed — it costs a
full extra scene render per frame. The streaks fall out of GGX specular at grazing incidence, driven by the
same patched-`MeshStandardMaterial` emitter array task 3 builds anyway. The two questions collapse into one
mechanism.

**Open sub-question — isotropic or anisotropic?** Isotropic GGX does stretch at grazing angles, but the
boards' streaks are longer and narrower than that alone tends to give, and the floor panels carry visible
brushed striations running down-track. Anisotropy aligned to the track axis is the likely missing term.
*Verified-this-session:* `three@0.185.1` `MeshPhysicalMaterial` exposes `anisotropy`, `anisotropyRotation`
and `anisotropyMap` (`src/materials/MeshPhysicalMaterial.js`) — but it lives on **Physical**, not
**Standard**, so choosing it changes which material task 3 patches. **Footgun:** the `anisotropy` setter
recompiles the shader when the value crosses zero (`this._anisotropy > 0 !== value > 0` → `version++`) —
never animate or toggle it through 0 mid-race. Settle isotropic-vs-anisotropic by rendering, not by
reading more boards; the boards have now given all they can.

**Caveat that stays on the record.** These are AI-generated concept renders, not a physically consistent
ground truth. They are the art *target*, not evidence about real optics — which, if anything, strengthens
the call: we only have to reproduce the look, and the look is streaks.

**Repro:** `./make-refs.sh crop 02-track 12_approved_scene_marigold_depth 1150 290 560 340 b12-under-right-monolith`
(and the two sibling crops at `250 310 500 300` / `900 380 520 340`). Board 12 is 1983×793.
