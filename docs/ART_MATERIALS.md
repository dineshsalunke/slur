# SLUR — Art Material Sheet (authoritative for surfaces)

> **Purpose:** name every element in the world, assign it a material family, and define each family
> tightly enough that two people building different assets produce surfaces that belong to the same
> world. **This sheet overrides no scale number and no silhouette** — dimensions belong to
> `docs/ART_SCALE_REFERENCE.md`, identity and mood belong to the boards and written direction in
> `docs/art-direction/`.
>
> **Status:** extends the frozen art package. It exists because the package defines material *names*
> (`handoff/06_IMPLEMENTATION_NOTES_THREEJS.md` lists five, `handoff/07_ASSET_CHECKLIST.md` adds three)
> but never defines what any of them *is*. **Its job is to make the approved look reproducible, not to
> change it.** Section 7 lists every point where it decides something the package left open, and every
> point where it departs from package wording — including the two departures Codex's review caught in
> the first draft.
>
> **Parameter values below are first-pass test presets, not measurements.** Nothing in the package
> supplies roughness, metalness, finish or base colour, so these are starting points to be tuned at a
> human gate and then frozen here. Colour anchors are the package's own (`handoff/HANDOVER.md` §4);
> the ranges and finishes around them are not.
>
> **Revision 4** — 2026-09-20. The deck's panel division, settled on the owner's decisions. Tiles are
> **4u in breaking bond**, closing the question revision 3 left open and reversing revision 3's "it
> must not be built at 4u" (§7 item 7). The **joint groove is 0.2 – 0.8u**, which forced M1's ~1u
> detail floor to be exempted for continuous linear elements (§7 item 8). Both are recorded with the
> wording they replace quoted in full. Joint width and contrast remain open, and §5 now gates them as
> one question. Nothing outside M1 moves.
> *(Revision 3 — 2026-09-19. Folds in the approved golden reference
> (`docs/art-direction/golden-reference/DIRECTION.md`) and the frozen track boards **24** (clean
> baseline) and **25** (wear). Three of revision 2's rules are **dead**, and revision 3 corrects them
> in place rather than leaving them to be read and built: interior seams are no longer non-emissive,
> the environmental tier no longer bans the halo, and M1's panel-division range is superseded by the
> 4u authoring ruler. Every correction is listed in §7 and §8.)*
> *(Revision 2 — 2026-09-19, incorporating Codex's review of revision 1.)*
>
> **Where this sheet sits in the authority order.** Dimensions: `docs/ART_SCALE_REFERENCE.md`, always.
> Appearance: `golden-reference/DIRECTION.md`, then the per-topic briefs under `docs/art-direction/`.
> This sheet sits **below both** and owns surfaces only. Where it disagreed with them it was wrong —
> which is what revision 3 is.

## 0. The central rule

> **Gameplay carries the strongest, clearest marigold signals. Environmental marigold is sparse and
> subordinate. Material, silhouette, placement and lighting work together to distinguish hazards from
> scenery.**

Two independent axes do that work. Keeping them separate is the whole point — the first draft collapsed
them and got the emissive axis wrong as a result.

**Axis 1 — material class.** The world splits into things that were *built* and things that were
*always there*:

| Layer | Elements | Material class |
|---|---|---|
| **Playable** | track ribbon, boundaries, gap slab edges, obstacle blocks, pickups, projectiles, mines, ships, finish line | hard-surface metal — bare or coated |
| **World** | monoliths, asteroids, planets, moons, backdrop | stone, worn concrete, rock |

The package already states half of this — monoliths and asteroids are "dark stone / worn concrete"
(`handoff/02_ENVIRONMENT.md`), the track is "dark graphite / black metallic surface"
(`handoff/03_TRACK.md`). It never resolves the other half: obstacle blocks, pickups and the finish line
sit on a "shared with track/world" fork the package never takes. §7 records the decision taken here.

**Axis 2 — marigold intensity.** Marigold appears on both layers, at clearly different strengths.
Gameplay emissive is the loud voice; environmental emissive is the quiet one. This is quantified in §3
rather than left as an adjective, because "sparse and subordinate" cannot be failed by any asset and a
criterion that cannot be failed is not a criterion.

**Metal needs something to reflect.** Every metal family here assumes an environment source exists in
the scene; a bare metal surface with nothing to reflect renders black and reads as a hole. This is a
constraint on the lighting rig, not a licence to drop metalness until the problem goes away — though it
is one reason several families below are specified as *coated* rather than bare conductor.

## 1. Material families

Nine families. Variation comes from finish, roughness, large-scale form, emissive masks and lighting —
never from adding a tenth (`handoff/06_IMPLEMENTATION_NOTES_THREEJS.md`: "keep material count low").

**Feature scale is given in world units, always.** A detail authored to look right on screen is wrong
the moment the camera moves; at 64u of track width and monoliths 200–400u tall, a feature sized by
pixels is invisible on one asset and a rash on the next. *How* a feature is produced — geometry, normal
detail or roughness variation — is an implementation choice, made on visible benefit at gameplay
distance.

### M1 — Track graphite (bare metal)

The ribbon's deck. The largest surface in frame and the one every other value is judged against.

| Property | Target |
|---|---|
| Finish | bare conductor — exposed dark metal |
| Metalness | 1.0 |
| Roughness | 0.35 – 0.50 |
| Base colour | deep graphite, between `#0A1117` (deep space) and `#303C45` (muted steel) |
| Panel division scale | **4u tiles in breaking bond** — 16 across the 64u ribbon, alternate rows offset 2u. See "Panel division" below |
| Joints | dark by default, low contrast, both axes. **Sparse emissive inserts permitted** — see M7 |
| Joint width | **0.2 – 0.8u** (5 – 20% of the 4u tile), start at the top and dial down. Open — gate it with contrast, §5 |
| Finish wear | broad softly-bounded roughness patches; large features, restrained contrast |
| Scuffs | occasional elongated rub clusters, varied length, weak down-track bias |
| Edge rub | small intermittent worn portions near *selected* joint ends and bevels |
| Detail floor | nothing below ~1u — **except continuous linear elements**, which are governed by contrast instead (§7 item 8) |

Restrained gloss is the brief: enough reflection to carry warm energy across the dark surface, never a
mirror (`handoff/03_TRACK.md`). Roughness is the knob — if the deck starts reflecting recognisable
shapes it has gone too low.

**Reflection and illumination are two different mechanisms; do not tune one expecting the other.** The
deck *reflecting* the marigold boundary strip is a material effect, controlled by roughness, and it is
real. Warm light actually *landing* on nearby surfaces is not: an emissive material does not illuminate
its surroundings, and bloom produces a halo, not lighting. If the brief's "warm reflected spill"
(`handoff/HANDOVER.md` §4) is to reach surfaces the deck cannot reflect it onto, it needs a light
source in the rig. Lowering roughness will not conjure it.

Interior positioning cues are value and material contrast *plus* sparse light: low-contrast panel
divisions, restrained roughness variation, hazard-to-floor contact shading (`handoff/HANDOVER.md` §5),
and the sparse emissive inserts the golden reference now permits. What stays forbidden is the *regular*
version of any of them — no racing line, no safe-route glow, no fully glowing tile grid, no marked
driving lanes (`golden-reference/DIRECTION.md`).

**Panel division — 4u tiles in breaking bond. Owner decision, 2026-09-20; this closes the question
revision 3 left open and reverses revision 3's ban.** Board 24's audit gives *"16 across 64u"*
(`golden-reference/DIRECTION.md`) and `HALF_WIDTH` is defined as *"16 lanes wide (2·HALF_WIDTH/CELL)"* —
so a 4u tile lands exactly 16 across the 64u ribbon, matching the board's own count. Alternate
down-track rows are offset by **half a tile (2u)**, the way real metal decking is laid.

**Why revision 3's ban does not hold.** It reasoned that *"a 4u joint pitch draws a dark line on every
cell boundary, which is exactly the 'visible runtime lanes' the direction forbids"*. That reasoning is
about **longitudinal stripes**, and a tile has transverse joints too. The forbidden read —
*"no racing line, no safe-route glow, no fully glowing tile grid, no marked driving lanes"*
(`golden-reference/DIRECTION.md`) — requires an **uninterrupted** line running to the vanishing point.
Breaking bond removes that structurally: no down-track seam survives past one tile before the next
row's offset interrupts it. Transverse joints were never at risk — they run across the direction of
travel and cannot be steered by, though they are the ones that vanish first at distance, which is the
gate check §5 names. Bond is preferred over simply lowering joint contrast because it kills
the failure mode **by construction**, rather than relying on a contrast ratio still holding up at
distance and at race speed.

Two constraints survive the decision:

- **Joints stay low-contrast value/material divisions, not drawn lines.** At 4u there are 16 tiles
  across the frame; if the joints read as edges the deck becomes a grid whatever the bond. Board 25's
  exclusion list already forbids *"fully outlined tile edges"*, and §4's criteria still govern.
- **Shimmer is a sampling problem, not a size problem.** A 4u pitch on the far deck, at a shallow chase
  angle and race speed, will alias if the texture is undersampled. That is fixed with mips and
  anisotropic filtering. It is **not** a reason to re-open the tile size.

The `CELL = 4u` coincidence is cosmetic. The sim never reads `CELL`, collision is continuous
float-AABB, and `MIN_CLEAR = 7u` is untouched (GDD §0).

**Wear — frozen 2026-09-19 to board 25** (`docs/art-direction/track/25_track_procedural_wear_BRIEF.md`).
Three layers, in strength order: broad softly-bounded finish patches that *interrupt the warm
reflections* while leaving substantial areas untouched; occasional elongated scuff clusters with a weak
down-track bias that never becomes a continuous traffic path; sparse joint-edge rub on selected bevels
rather than a bright outline on every panel. All three are **roughness**, not albedo and not geometry —
the deck's silhouette and collision shape are untouched, and there is no mesh damage.

Two consequences worth stating, because both are easy to get backwards:

- **The wear is only visible inside the reflection.** Board 25 defines it as interrupting the *warm
  reflections*, and a bare conductor under a near-black sky has nothing else to show. Roughness
  variation on an unlit conductor is invisible. Whatever supplies the deck's warm energy must therefore
  exist **before** wear can be judged at all — tuning it first is tuning against black.
- **Wear is subordinate to the panel form** (board 24). If a wear field is reading before the panel
  divisions do, it is too strong regardless of how well it matches a crop.

Excluded, from board 25's own list: rust, flaking paint, grime, skid marks without a contact rationale,
bright silver scratches, dents, craters, debris, all-over fine noise, lane-like wear bands, and fully
outlined tile edges. Wear must never generate a new seam or read as a hole.

### M2 — Hazard metal (coated)

Standard deadly blocks and destructible blocks.

| Property | Target |
|---|---|
| Finish | **coated** — dielectric outer coat over an engineered form |
| Metalness | 0.0 |
| Roughness | 0.45 – 0.60 |
| Base colour | near-black, cooler than M1 |
| Panel / seam language | sparse, narrow, functional; **sparse marigold seams permitted** (§3) |
| Silhouette | continuous, uninterrupted broad faces |

**The separation from the deck is finish, not value.** A coated dielectric block and a bare metal deck
respond to the same light in visibly different ways — the deck carries broad reflection, the block
carries a tighter specular highlight on a diffuse body — and that difference survives lighting states
where a roughness-only difference collapses. It also keeps the block from going black when there is
little for a conductor to reflect.

Roughness remains the primary tuning knob, but it cannot carry the whole read alone: where lighting
defeats it, a modest base-value offset and local lighting are legitimate. The constraint is the "sealed
mass — avoid it" read (`handoff/04_OBSTACLES.md`), not a fixed number; a block lightened until it stops
reading as sealed mass has failed even if it is perfectly visible.

**Destructible variant.** Same family, same 8u envelope, same base values. The difference is
structural, not tonal: a few large sections, broad recessed fractures, and **visible interruptions of
the top and side contours**. Surface crack texture alone is explicitly insufficient
(`handoff/HANDOVER.md` §6). M7 appears inside the fractures, recessed — revealed by the break rather
than painted on the shell — and at gameplay intensity, since this is a hazard-classification signal.
Fracture interior surfaces are the same coat pushed to roughness 0.70 – 0.85: a torn face, not a
machined one.

### M3 — Dark stone (dielectric)

Monoliths: obelisk, gate, arch. The oldest thing in the frame.

| Property | Target |
|---|---|
| Finish | rough dielectric |
| Metalness | 0.0 |
| Roughness | 0.75 – 0.90 — matte to subtle gloss |
| Base colour | around `#303C45` (muted steel), pulled cooler and darker |
| Panel divisions | large, 10 – 40u |
| Wear | near-zero at gameplay distance |
| Emissive | sparse marigold seams at environmental intensity (§3) |

These are 200–400u tall (`handoff/HANDOVER.md` §3). At that size, surface texture is nearly free to
omit and nearly impossible to get right: the read is silhouette, occlusion and cold rim light on a broad
matte face. "May be almost completely solid if that reads better" (`handoff/02_ENVIRONMENT.md`) is the
target, not a fallback. If a monolith only reads as stone once you are close enough to resolve its
texture, the form is wrong and no map will save it.

### M4 — Worn concrete (dielectric, M3 variant)

The second monolith surface. Built-looking where M3 is carved-looking; keeps a monolith field from
reading as one repeated prop.

| Property | Target |
|---|---|
| Finish | rough dielectric |
| Metalness | 0.0 |
| Roughness | 0.85 – 0.95 |
| Base colour | M3 lifted slightly, warmed a touch toward neutral grey |
| Erosion scale | broad, 10 – 40u — soft loss of edge, never fine pitting |

Fine pitting and speckle are invisible at monolith distance and become noise at monolith scale. The
variant must be legible as a *different surface* from 300u away or it is not earning its slot.

### M5 — Asteroid rock (dielectric)

Angular, plate, broken; and the elongated, shattered, cluster variations.

| Property | Target |
|---|---|
| Finish | rough dielectric |
| Metalness | 0.0 |
| Roughness | 0.80 – 0.95 |
| Base colour | the darkest of the stone families |
| Fracture faces | same material, roughness at the low end — a fresh break catches more light than a weathered one |
| Emissive | rare marigold veins at environmental intensity (§3) |

Size classes run S 10–50u to XL 400u+ (`handoff/HANDOVER.md` §3). Silhouette beats surface at all of
them: "the silhouette matters more than the surface at speed" (`handoff/02_ENVIRONMENT.md`). The one
place surface earns its cost is the contrast between weathered outer faces and brighter fresh fracture
planes — that is what says *rock* rather than *dark shape*.

Energy veins are an outlier, not a category: if vein asteroids read as a type of asteroid rather than a
rare event, cut their frequency, not their brightness.

### M6 — Shell (coated metal)

Pickups, deployed mines, the seeker body, and any small hard-surface object on the playable layer.

| Property | Target |
|---|---|
| Finish | **coated** — dark dielectric shell over an engineered form |
| Metalness | 0.0 |
| Roughness | 0.25 – 0.40 — the glossiest family here |
| Base colour | near-black, cooler than M1 |
| Bevels | crisp, 1 – 3% of the object's smallest dimension, on every silhouette edge |
| Core | M7, inset and recessed |

These objects are small and usually moving, so they have very little screen area in which to prove they
are three-dimensional. Tight specular on crisp bevels does that work: a bevel catching a moving
highlight is what separates a physical object from a flat emissive icon, and an alpha plane or flat icon
is explicitly not an acceptable pickup body (`handoff/HANDOVER.md` §7). A coated finish is chosen over
bare conductor here for the same reason as M2 — small objects frequently have nothing worth reflecting,
and a bare-metal pickup silhouettes as a black hole with a glowing dot in it. Judge these while
rotating, strafing and approaching; never face-on.

### M7 — Marigold emissive

The energy material. One family, three anchors, two intensity tiers (§3).

| Role | Colour | Availability |
|---|---|---|
| Primary gainda / marigold | `#F59A24` | both tiers |
| Hot amber | `#FFB52E` | both tiers |
| Bright warm core | `#FFE0A0` | **gameplay tier only** |

The core-to-edge relationship — a hot centre falling off through amber to marigold where it meets the
dark shell — is what makes a small emissive read as *hot* rather than merely bright. **It does not have
to be authored into every insert.** Emission strength, exposure and bloom produce that relationship
from a single colour in most cases; the three anchors are appearance targets for the final image, not a
mandatory painted gradient.

Constraints: the perimeter must read golden, never vermilion or red-orange — verify after tone mapping,
not in the source colour (`handoff/HANDOVER.md` §4). No red hazard code. Cyan is not an alternate
energy family.

**Whatever shape the boundary takes, it is OUTBOARD of the deck — this outranks its styling.** The
deck's rendered top face ends at exactly ±`HALF_WIDTH`; the boundary occupies `[32, 32+w]` beside it
(ADR-012, `ART_SCALE_REFERENCE.md` §1a). This is a gameplay-read constraint, not an art one, so it is
settled before any question of how the boundary looks. A near-edge gap keeps *"an intact supporting
outer floor strip and a straight outer boundary"* (board 24), so the boundary is continuous even where
the deck beside it is not.

**DEPARTURE from board 24 panel 02 — owner's call, 2026-09-20, pending Codex.** The package puts the
emitter *in the top outer corner of the slab*, with the dark cut side-face dropping away beneath it,
and its do-not-copy column excludes *"raised rails or ornamental edge machinery"*. Read as "embedded in
the slab's top face", that wording is **unbuildable without taking deck**: the top face ends at ±32, so
anything embedded in it must extend inward, and every unit of boundary width is a unit of playable floor
repainted as border. That is what shipped, and it is why the deck drew 62u while the player flew 64u.
The owner's resolution is a **1u × 1u chamfered bar standing outboard at ±32.5**, which reads as a
raised rail and therefore departs from the exclusion. See `.claude/art-pass/02-track/PASTE-TO-CODEX-rail-outboard.md`.

**The flush alternative, if Codex holds the line.** The same bar at zero height is a coplanar inlay
outboard of the deck: it satisfies *"must not stand proud of the floor"* literally and still never
touches playable width. What is **not** available is the original reading — embedded and inboard — in
any form. The choice is raised-outboard versus flush-outboard, and it is the owner's with Codex.

**Boundary and interior inserts are separated by continuity, not by intensity.** Both are gameplay tier
and both may be equally hot; board 24's requirement is only that the boundary stay *"visually distinct
from intermittent interior inserts"*. What distinguishes them is that the boundary is **unbroken and
predictable** while the inserts are **short, of varied length, and irregularly spaced**. Making inserts
regular or continuous destroys that separation and produces the lane read the direction forbids —
which is the failure mode, not dimness.

### M8 — Gap slab edges (bare metal, M1 family)

A gap is missing floor geometry (`handoff/03_TRACK.md`). **The void is absence — it has no material.**
What the player actually sees is the cut edge of the slab: its side walls, the underside where visible,
and the rim.

| Property | Target |
|---|---|
| Finish | as M1 — the same deck, seen in section |
| Side walls | M1 base, roughness at the high end (0.50 – 0.65) — a cut face, not a finished one |
| Rim | thin M7 edge definition + slight inner-lip illumination, gameplay tier |
| Behind the walls | nothing — do not model a cavity surface, do not fill with a black plane |

**The cut wall is broad clean metal section, not masonry.** Board 24's own audit names this as the
defect in its generated image: the gap walls *"acquire a masonry-like small-panel texture, which is not
the intended metal section"*, and their *"apparent depth is also exaggerated and must not establish slab
thickness"*. Reproducing either is reproducing a known board defect. Use broad uninterrupted faces, as
the deck's construction implies.

The readability problem is real but it is a *geometry and lighting* problem, not a material one: the
opening must not be perceptually closed by rim brightness, and slab thickness must not conceal it at low
camera height (`handoff/HANDOVER.md` §5). The side walls falling into darkness is what creates the depth
contrast; an authored dark surface is the wrong instrument, and a black floor plane is explicitly
forbidden because it implies traversable material.

### M9 — Celestial (dielectric)

Gas giants, moons, crescent and eclipse bodies.

| Property | Target |
|---|---|
| Finish | rough dielectric |
| Metalness | 0.0 |
| Roughness | 0.90 – 1.0 |
| Base colour | cold and desaturated; no marigold surface colour |
| Emissive | none |

Compositional anchors, not gameplay objects (`handoff/02_ENVIRONMENT.md`). Lit by rim light, backlight
or eclipse. They must not compete with the playable layer for contrast — a planet bright enough to
dominate has become the subject of the frame, and the subject of the frame is the ship.

## 2. Element → material

Every element in the package, and what it is made of. No row reads "shared with track/world".

| Element | Material | Marigold tier |
|---|---|---|
| Track deck | **M1** bare metal | — |
| Track boundary / edge strip | M1 carrier + **M7**, embedded at the outer edge — never a raised rail | gameplay |
| Interior joints | **M1**, value/roughness — dark by default | none |
| Interior seam inserts | **M7**, sparse · short · varied length · irregular spacing | gameplay |
| Track deck wear — finish patches, scuffs, edge rub | **M1**, roughness only | none |
| Hazard-to-floor contact shading | **M1**, lighting only | none |
| Gap slab side walls and underside | **M8** (M1 family, cut face) | — |
| Gap rim and inner lip | **M7**, thin | gameplay |
| Standard deadly block | **M2** coated | gameplay — sparse functional seams |
| Destructible block, intact | **M2** + **M7** in recessed fractures | gameplay |
| Destructible block, fragments / burst | **M2** + **M7** | gameplay |
| Finish-line structure | **M1** / **M2** + **M7** | gameplay |
| Monolith — obelisk, gate, arch | **M3**, varied with **M4** | **environmental** — sparse seams |
| Asteroid — all forms | **M5** | **environmental** — rare veins |
| Gas giant, moon, crescent/eclipse | **M9** | none |
| Nebula / backdrop | not a surface — colour and depth layers | n/a |
| Pickup shells — bolt, boost, shield, mine, seeker | **M6** coated | gameplay — inset core |
| Deployed mine | **M6** + **M7** | gameplay — must stay visible on the track |
| Seeker in flight | **M6** + **M7** rear core | gameplay — sized for rear-view resolution |
| Bolt tracer, boost thrust, shield envelope | **M7** only — no shell | gameplay |
| Engines / thrust | **M7** | gameplay |
| Ship hulls | **M6** family when designed — *deferred*, §6 | gameplay — engines |
| HUD / UI | 2D; graphite and marigold — *deferred*, §6 | n/a |

## 3. The two marigold tiers

The package's own instruction is that the environment stays "**mostly** below bloom threshold"
(`handoff/06_IMPLEMENTATION_NOTES_THREEJS.md`) while monoliths "include selective glowing seams" and
asteroids carry rare glowing fractures (`handoff/HANDOVER.md` §4). Both hold simultaneously through a
two-tier split. Values are starting presets, tuned at the gate and frozen back here.

| | **Gameplay tier** | **Environmental tier** |
|---|---|---|
| Applies to | track boundary, gap rims, block seams and fractures, pickups, projectiles, mines, engines, finish line | monolith seams, rare asteroid veins |
| Reference intensity | **1.0** — the track boundary strip defines it | **≤ 0.25** of gameplay |
| Bloom | above threshold; halo is part of the look | halo permitted, but **tight and local** — see below |
| `#FFE0A0` hot core | permitted | **not permitted** — marigold and amber only |
| Coverage | as the element requires | sparse: a handful of seams per monolith; veins on a small minority of asteroids |

Why the split is worth the bookkeeping: the player makes one judgement continuously and at speed — *is
that thing going to kill me, or is it scenery behind the track?* Every separator that survives distance,
motion and bloom is worth keeping, and the sector concepts deliberately frame monoliths close to the
corridor (`handoff/02_ENVIRONMENT.md`; Monolith Field is a sector in its own right). Hue alone cannot
separate them, because both layers legitimately carry marigold. Intensity and bloom behaviour can, and
they do it without removing anything from the approved look.

This is the sheet's only quantified constraint on the environment, and it is deliberately the minimum
that makes "sparse and subordinate" testable rather than rhetorical.

**The halo ban is dead — and this costs the tiers their easiest separator, so read what replaces it.**
The golden reference approves monolith seams with *"visible vertical marigold seams and localized soft
halos"* (`golden-reference/DIRECTION.md`), and states directly that this supersedes revision 2's
blanket environmental no-halo rule. Halo presence therefore no longer separates the tiers. Three things
still do, and all three must hold together:

1. **Intensity** — environmental stays at ≤ 0.25 of the gameplay reference, unchanged.
2. **Halo extent** — environmental haloing is *localized*: a tight bloom hugging the seam. A halo that
   reads at gameplay distance as a glowing region rather than a glowing line has crossed the tier.
3. **Coverage** — a handful of seams per monolith, veins on a small minority of asteroids. Unchanged,
   and it does more work now that presence alone no longer decides.

The `#FFE0A0` hot core stays gameplay-only, which is what keeps the two tiers reading as different
*temperatures* rather than merely different brightnesses.

## 4. What makes a material correct

A family is finished when these hold — judged in the real chase camera, at race speed, with bloom on
and again with bloom off:

1. **Stone never reads as metal and metal never reads as stone** in the near and mid field, where
   surface response is resolvable. At long distance this is carried by silhouette, placement and
   lighting instead, and is tested as criterion 2 rather than as a material claim.
2. **Hazard versus scenery is unambiguous in the worst framing we ship**: the Monolith Field sector, at
   the closest a monolith is framed to the corridor, at cruise speed. If the read survives there it
   survives everywhere.
3. **A block is distinguishable from the deck it stands on** by finish and value together, under each
   A/B/C lighting state — not only under the one the material was authored in.
4. **Sealed versus fractured is legible without labels**, at A, B and C, with bloom in both states.
5. **A gap reads as an opening, not a seam**, at the lowest camera height under evaluation — and the
   rim does not perceptually close it.
6. **A pickup reads as a solid object while rotating** — bevels catch a moving highlight, side faces
   shade differently from front faces.
7. **Marigold reads golden after tone mapping**, with no reddish spill at the edges.
8. **Environmental emissive halos tightly; gameplay emissive halos openly.** Both halo — the separator
   is extent and intensity, not presence (§3). The difference is visible in a side-by-side frame at
   gameplay distance, not only in a closeup.
9. **The deck's wear interrupts the warm reflections without competing with anything.** Judged on the
   overview first, at speed: hazards, pickups and gap edges must still win the frame, and the panel
   divisions must still read before the wear does.
10. **The interior inserts never resolve into a rhythm.** Watched down a straight at cruise, no
    insert distribution should be predictable enough to steer by.

Values are tuned against these reads and then frozen back into §1. A value that passes a static
screenshot and fails at speed has failed.

## 5. Open — the questions still to settle

**Joint width and joint contrast on the deck (M1) — one question, not two.** The tile *size* is settled
at 4u in breaking bond (§7 item 7). What is open is how wide a joint is and how strongly it reads, and
these must be gated **as a pair**: a wide faint joint and a narrow dark one are indistinguishable at
distance, so a number found for either while the other sat at an arbitrary value is only correct for
that arbitrary value.

**Width — 0.2 – 0.8u, which is 5 – 20% of the tile** (owner, 2026-09-20). Recorded as a fraction as
well as an absolute so it survives if the tile size ever moves. **Start at 0.8u and dial down:** going
too fine shows you what you are losing, whereas a joint that was never visible cannot be judged at all.

**Contrast** stays what it always was — a value/material division, not a drawn line. If the tiling
resolves into a grid, or a joint reads as an edge, it is too high. Board 25 already excludes *"fully
outlined tile edges"*.

**The specific failure to watch for at the gate — the two joint axes do not fade at the same rate.**
At the chase camera's vantage (`CHASE`: 7.5u up, 15u back, 70° FOV) the deck 50u ahead is roughly 8.5°
off edge-on. That grazing angle crushes *transverse* joint spacing by about a factor of seven, while a
*longitudinal* joint runs away from the viewer and keeps its width untouched. So the transverse joints
die into the mip blur first and the mid-to-far deck can revert toward **stripes** — the read breaking
bond was adopted to prevent, re-entering through sampling rather than through geometry. It most likely
survives, because the 2u row offset should blur into a broad faint smear rather than into a crisp,
steerable line. **"Most likely" is not a gate**: look explicitly at the deck 40 – 100u
ahead at race speed and confirm no continuous down-track line has reassembled itself. If one has, the
answer is sampling (mips, anisotropy) or contrast — **not** a change to the tile size, which is settled.

Both numbers freeze back into M1's table at the gate. Until then no number in this sheet licenses a
joint.

**Hazard metal (M2) versus engineered stone.** Coated metal is recorded in §7 as the decision taken for
this revision, and the sheet is written around it. Codex's original engineered-stone proposal remains a
live alternative: blocks cut from the same worked stone as the monoliths, separated from scenery by
scale, seams and placement rather than by material class.

The test that settles it is criterion 2 above, run with both material treatments in the same frame. Do
not settle it from a still.

## 6. Deferred, deliberately

- **Ship hulls.** "Ships and dedicated orthographic passes remain a separate art track"
  (`handoff/HANDOVER.md` §1). Pre-assigned the **M6** family with **M7** engines so the ship track
  inherits a surface language instead of inventing a tenth material; the designs stay open, and
  per-class proportions differ sharply (Comet is wider than long).
- **HUD and UI.** Graphite and marigold is the whole of the current direction; typography, layout,
  motion and the rear-view treatment are open (`CURRENT_STATUS.md`).
- **Fidelity budgets.** No mesh, draw-call or frame-time budget is invented here, matching the
  package's own refusal to invent one.

## 7. Decisions taken, and departures from package wording

**Decisions on questions the package left open.** These are not overrides; the package states no
position.

1. **Obstacle blocks are coated metal (M2).** Decided by the project owner, 2026-09-19.
   `handoff/04_OBSTACLES.md` assigns blocks a "dark material family shared with track/world" — an
   ambiguity between the two material classes it names, sitting directly beneath that same document's
   requirement that blocks "must read differently from environmental monoliths". Selected toward metal,
   with engineered stone retained as the live alternative in §5.
2. **Pickups, weapon shells and the finish line are metal (M6 / M1–M2).** The package describes a "dark
   structural shell" with "beveled/shaded sides" and asks the finish line to use "the same track/world
   language" without naming a family for either.
3. **Finishes are specified per family** — bare conductor for the deck, coated dielectric for blocks and
   shells. The package names no finish anywhere, and the choice materially changes both the numbers and
   the hazard-versus-deck separation.
4. **Environmental marigold is quantified** (§3) rather than left as "sparse" and "selective". No
   element loses its glow; the constraint is intensity, bloom behaviour and the reservation of the
   `#FFE0A0` core to the gameplay tier.

**Departures from package wording.** One, narrow.

1. **`#FFE0A0` becomes gameplay-only.** `handoff/HANDOVER.md` §4 applies "the same family" to monolith
   seams and asteroid veins without restricting the anchor. Reserving the hot core is what lets the two
   tiers stay distinguishable while both remain marigold.

No departure touches a silhouette, a frozen form family, a dimension, a colour anchor's value, the A/B/C
intensity language, or the presence of environmental glow.

**Revision 3 — decisions taken where the direction left a number open.** Neither is an override; both
are places the direction explicitly declines to specify.

5. *(Superseded by revision 4, item 7 — the owner's answer to this item's own flag was that the intent
   was literally 4u.)* **Panel joint pitch is not set to 4u, and is left to be frozen at the gate.**
   Board 24's audit hands its 4u study ruler precedence over revision 2's 8 – 20u range, but the same
   documents call the ruler an authoring reference and say the image's tile count is not certified.
   Adopting 4u as the panel size would put a dark joint on every `CELL` boundary and draw the 16-lane
   authoring grid on the deck, which is the *"visible runtime lanes"* the direction forbids — arrived
   at by accident rather than by choice. M1 therefore records the constraint (near the boards' visual
   relationship, off the 4u grid) and leaves the number to the visual gate. **Flagged to the owner;
   correct this if the intent was literally 4u.**
6. **The three wear layers are specified as roughness, not albedo.** Board 25 specifies appearance and
   explicitly declines to prescribe a shader. Roughness is chosen because the deck is a near-black bare
   conductor whose visible content is almost entirely reflection — the `art/block` lane measured the
   same shape of problem on its own dark metal and found albedo features dilute to nothing while
   roughness variation is what paints a face. Base-colour wear would be invisible on this surface.

**Revision 3 — departures.** None. All three of revision 2's corrected rules were *this sheet* being
behind the direction, not disagreeing with it.

**Revision 4 — the owner's answer to item 5's flag.**

7. **Panel joint pitch is 4u, laid in breaking bond.** Item 5 flagged its own ban to the owner and
   asked to be corrected if the intent was literally 4u. It was — decision taken 2026-09-20. Item 5's
   reasoning was wrong in one specific way, and the fix is structural rather than a matter of degree:
   the ban treated the tiling as a set of longitudinal stripes, but a tile also has transverse joints,
   and the *"visible runtime lanes"* read the direction forbids needs an **uninterrupted** down-track
   line. Offsetting alternate rows by half a tile means no down-track seam survives past one tile, so
   the forbidden read is removed by construction and every tile is still exactly 4×4u. See M1's
   "Panel division". **This is not a departure from the package** — board 24 audits *"16 across 64u"*,
   which is what 4u across a 64u ribbon produces; revision 3 declined to adopt the board's own count
   and revision 4 adopts it.
8. **The ~1u detail floor is exempted for continuous linear elements.** The owner's joint width of
   0.2 – 0.8u sits entirely under M1's *"nothing below ~1u"*, so one of the two had to give. The floor
   gives, because it was written about **isolated features** — §1's rationale is that *"a detail
   authored to look right on screen is wrong the moment the camera moves"*, an argument about specks
   that vanish, and a 0.5u scuff patch is exactly that. A continuous line is a different perceptual
   object: the eye integrates along its length, so a line survives well below a pixel of width as a
   contrast modulation, the way a distant cable or wire does. *(Perceptual reasoning, this sheet's own
   call rather than the package's — the gate can overturn it.)* Linear elements are therefore governed
   by **contrast**, not by a width floor. The floor is unchanged for everything else, wear included.

## 8. Review log

**Revision 3 → 4, the owner's ruling on the 4u flag (2026-09-20).** One change. Revision 3's §7 item 5
flagged its own ban to the owner — *"correct this if the intent was literally 4u"* — and the answer was
that it was. The deck's panel division is now **4u tiles in breaking bond**: 16 across the 64u ribbon,
alternate down-track rows offset 2u.

- **M1's "It must not be built at 4u"** and its table's *"open — gate it"* are both replaced. The ban's
  reasoning held only for longitudinal stripes; breaking bond removes the continuous down-track seam by
  construction, so the *"visible runtime lanes"* read cannot occur at any tile size.
- **§5's "Panel joint pitch on the deck (M1)"** open question is closed and replaced by a narrower one:
  joint *contrast*, still gated at race speed.
- Two constraints carried forward into M1 rather than dropped: joints remain low-contrast value
  divisions rather than drawn lines, and far-deck shimmer at a 4u pitch is a mip/anisotropy problem —
  explicitly **not** grounds to re-open the size.

**Joint width, same day.** The owner set the joint groove itself at **0.2 – 0.8u** (5 – 20% of the
tile), to start at the top and dial down. Two consequences recorded rather than left implicit:

- **M1's `Detail floor` row is amended** — the ~1u floor now exempts continuous linear elements, which
  are governed by contrast instead (§7 item 8). Without this the sheet would have specified a joint it
  elsewhere forbids.
- **§5's open question becomes width *and* contrast together**, plus a named check: the two joint axes
  fade at different rates under the chase camera's grazing angle, so the mid-to-far deck can revert
  toward stripes through mip blur even though breaking bond removed them geometrically. Confirm at the
  gate; the remedy is sampling or contrast, never the tile size.

**Revision 2 → 3, after the golden reference and the frozen track boards (2026-09-19).** Not a review —
revision 2 went stale in the days after it was written, and three of its rules would have been read by
an implementer and built wrong.

Corrected, each superseded by `golden-reference/DIRECTION.md` or board 24:

- **M1's "transverse seams: occasional, low contrast, non-emissive"** and the element table's
  *"interior panel divisions and seams → M1, value/roughness only, tier: none"*. The direction permits
  *"sparse intermittent interior seam lights with varied lengths and irregular spacing"*. Joints and
  inserts are now two separate rows, because they are two different materials doing two different jobs.
- **§3's "below threshold — glows, does not halo"** and §4's criterion 8. Monolith seams may produce
  *"localized soft halos"*. §3 now carries the three separators that survive, spelled out, so the tier
  split does not quietly become untestable.
- **M1's 8 – 20u panel division range**, superseded by board 24's 4u authoring ruler — which is a ruler
  and not a panel size. See §7 item 5 for why revision 3 left this open rather than setting it to 4u —
  and §7 item 7 for revision 4 setting it to 4u anyway, on the owner's ruling.

Added, from the frozen boards rather than corrected:

- **The three wear layers** (board 25, frozen), with their exclusion list and the two consequences that
  are easy to get backwards — wear is invisible outside the reflection, and it is subordinate to the
  panel form.
- **The boundary is an edge, not a rail** (board 24 panel 02), and it is separated from interior
  inserts by **continuity**, not intensity.
- **The gap cut wall is broad metal section, not masonry** — named by board 24's own audit as a defect
  in its generated image, and therefore a thing to avoid reproducing.
- Two review criteria (9, 10) for the wear and insert reads, both judged on the overview at speed.

**Revision 1 → 2, after Codex's review (2026-09-19).**

Accepted: the gap cavity was an invented surface and is now specified as the slab's cut edges with the
void as absence; bloom and illumination were conflated with reflection in M1 and are now separated;
metalness 1.0 was applied without naming a finish, and coated dielectric is now specified where it is
the better physical description; the blanket "environment never blooms" rule contradicted both the
package and this sheet's own asteroid-vein exception; "material separation at every distance" was an
untestable criterion and is replaced by a named worst case; the authored three-colour gradient and the
mandate for geometric panel cuts were over-specification and are now targets with free technique.

Accepted as undeclared changes and reverted: **removing sparse marigold seams from standard blocks**,
and **removing glowing seams from monoliths**. Both were art-direction changes made inside a material
document without being declared as such. Restored, and the readability concern that motivated them is
now carried by the intensity tiers in §3 instead.

Not accepted: that the block material question should return to fully open — the owner selected coated
metal on 2026-09-19, and §5 keeps the alternative live with a named test rather than reopening the
decision. Codex's replacement central rule is adopted verbatim in §0, with §3 added: as prose alone,
"sparse and subordinate" cannot be failed by an asset, and a spec whose central rule cannot be failed is
a mood board.
