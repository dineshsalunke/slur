# Task 2 — Track: floor material, edge rail, gaps

**Status:** not started
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

**Status: DECIDED, NOT YET BUILT** (2026-09-19). Three decisions are of-record below. No task-2 code exists.

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

### D3 — `toneMapped: false` contradicts the done-criterion; it becomes a panel switch

Every surface in `track-materials.ts` sets `toneMapped: false`. But §4's criterion is *"rail reads marigold
(not red-orange) **in the final tone-mapped frame**"* — which those pixels opt out of **by construction**. As
written the test cannot be run.

This is the **same decision** as task 1's deferred `Tone map` switch, so it is settled **once, for the whole
frame**, on one panel, with the track in shot.

### Noted, technically out of scope, but it will poison the read

Lethal blocks are saturated red `#ff2740` (`LETHAL_SURFACE`), and **red is explicitly excluded** from the
widened palette (`INDEX.md` §2: *"No cyan, no magenta, no red. A red hazard colour code is explicitly
excluded."*). Block design belongs to a later task, but those blocks are in **every frame** the floor material
would be judged in. Retone them to the warm ramp as part of task 2's **review setup**, or every material read
is taken against a colour the direction forbids.

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
