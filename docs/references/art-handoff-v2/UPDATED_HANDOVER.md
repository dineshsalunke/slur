# SLUR — Updated production handover

Version 2 · 2026-09-17 · For Claude / content and engineering

## 1. Implementation brief

Continue the existing scene/world art direction. Preserve the original golden reference's cosmic depth, looming scenery, cold rim light, deep shadows and luminous warm reflections. The latest approved single-shot image restores that character while proposing true 3D pickups and golden marigold lighting. Do not return to the foggy, flat, empty-space or red-orange intermediate revisions.

Implement the approved corrections: 64u track; 8u constant-height obstacles; 20u-long gaps; subtle interior navigation cues; broken-contour destructible blocks; volumetric pickups; golden marigold energy. Prototype a 4–5u camera and selective occlusion fade. Camera and fade are proposals, not validated production settings.

No changes to gameplay dimensions are authorized by visual inaccuracies in an illustration. Do not add slow blocks, special floors, holed asteroid families, runtime lanes, or vertical block stacks. Ships and dedicated orthographic passes remain a separate art track.

## 2. Decision status

| Status | Decision |
|---|---|
| Approved art direction | Original cosmic mood, desaturated blue-grey world, golden marigold energy and visible localized bloom |
| Approved readability | Subtle interior floor cues AND broken outer contours on destructible blocks; both are required |
| Approved pickup treatment | Physical thickness, volume, dark structural shell, beveled/shaded sides and emissive core |
| Accepted engineering dimensions | Values in section 3; reported from source by engineering, not independently audited here |
| Latest approved visual | `GOLDEN_REFERENCES/12_approved_scene_marigold_depth.png` |
| Prototype / test | Camera height 4–5u, nominal 4.5u, with selective occlusion fade |
| Not finalized | Ship designs, exact camera setback/FOV/aim, fade parameters, mesh budgets, shader implementation, HUD/rear mirror details |

Approval of a concept image is approval of visual intent, not proof that its perspective encodes exact dimensions or that every generated asset matches its dedicated sheet.

## 3. Spatial contract

World convention: X lateral, Y up, +Z forward; floor top at Y=0. Use the project's established unit convention; nominally 1u ≈ 1m.

| Property | Value / rule |
|---|---|
| Ribbon width | 64u, X = −32 to +32 |
| Authoring scaffold | 16 lanes; not a visible or runtime grid |
| Segment length | 20u |
| Total track length | 8000u / 400 segments |
| Gap length down-track | 20u under the reported current implementation |
| Gap width | Minimum 4u; partial to full 64u width; do not quantize from pictures |
| Obstacle height | Exactly 8u for every gameplay block |
| Obstacle width and depth | Free real-valued dimensions; current build example 4u wide × 8u deep |
| Minimum guaranteed threadable clearance | 7u; preserve the game's route contract, including required gap traversal |
| Track slab thickness | Art/implementation choice; 1u was a concept-study choice, not a game constant |

A full-width gap necessarily interrupts continuous floor: the 7u clearance statement must not be interpreted as requiring a walkable bypass beside every gap. Confirm the project's precise route guarantee when laying out test content.

**Dimension order in this document: width X × depth Z × height Y.** Reference block = **4 × 8 × 8u**. Other footprints are permitted. Narrow posts, broad walls and deep slabs all remain 8u high. Group horizontally or in depth only. No “tall” variant changing height, no vertical stacking, no cell notation.

| Ship class | Width | Length |
|---|---:|---:|
| Interceptor | 2.00u | 1.84u |
| Fighter / reference | 2.60u | 2.52u |
| Comet | 2.20u | 1.18u |
| Phantom | 2.40u | 5.02u |
| Freighter | 2.50u | 6.00u |

These are engineering-supplied footprints, not finalized meshes. Do not turn all ships into elongated needles: Comet is wider than long. Use a proxy until each design is frozen.

The Fighter-to-track width ratio is 2.6/64 = 4.0625%, measured in world space or at equal depth. It is not a mandate that the craft occupy 4% of the full screenshot. Camera perspective, framing and cropping matter. Never fake scale by merely shrinking a sprite.

Environment sizes retained from the accepted references: obelisk 200–400u; gate 200–350u; arch 150–300u. Asteroid size classes: S 10–50u, M 50–200u, L 200–400u, XL 400u+. Environmental scale must stay clearly distinct from 8u gameplay hazards.

Engineering reports bolt speed 900u/s, ship cruise 48–70u/s, bolt expiry range roughly 1530u. Use a fast elongated tracer, not a glowing sphere. These numbers are contextual; do not retune weapons from the art document.

## 4. Visual fidelity: recover and preserve the golden reference

### Color and lighting

| Role | Reference color |
|---|---|
| Primary gainda / marigold | #F59A24 |
| Hot amber | #FFB52E |
| Bright warm core | #FFE0A0 |
| Cold blue-grey reference | #53616B |
| Muted steel reference | #303C45 |
| Deep space reference | #0A1117 |

These are art color anchors, not guaranteed screen samples after lighting and tone mapping. Tune final displayed appearance against the approved image. The track perimeter must read golden marigold, not vermilion, rusty red or red-orange. Apply the same family to engines, pickups, fractures, monolith seams and rare asteroid veins. No new red hazard code is approved. Cyan is not an alternate energy family.

Visible optical bloom is part of the look. Use bright warm cores, soft local halos and warm reflected spill. Do not eliminate bloom to fix haze. Equally, do not lift all black levels or spread glow into a fog veil. Keep silhouette separation and gap rims readable at A, B and C.

### Environment and material

Preserve a rich desaturated deep-space/nebula backdrop, planetary rim light, layered distant debris, close framing asteroids and immense monoliths. Distant cosmic dust provides depth; foreground fog must not wash out gameplay. Avoid substituting a bare black starfield or a highly saturated blue galaxy.

Monoliths: obelisk, gate, arch; dark stone/worn-concrete family; simple solid forms; sparse panel divisions and near-zero wear. Include selective glowing seams. Asteroids: angular, plate, broken; elongated, shattered and cluster variants; no holed family. Most remain cold/dark; glowing fractures are rare accents.

Track: dark graphite/black metal, clean large panels, sparse seams, restrained gloss and warm reflections. No noisy grunge, excessive greebles, ornamental lights or mirror-floor mandate. The latest image does not authorize replicating every tiny fleck or emissive seam.

Retain the frozen celestial and sector families in `02_ENVIRONMENT.md`. A→B→C increases density, proximity, scale and selective energy, while preserving contrast for gameplay. No intensity state may make hazards unfairly hard to read.

## 5. Track interior cues and gaps

Track edges define the ribbon boundary; they cannot supply all fine positioning across 64u. Add low-contrast large panel divisions, occasional transverse seams, restrained material/reflection differences and clear hazard-to-floor contact shading. These supply speed and lateral-motion cues without creating visible gameplay lanes.

No automatic racing line, safe-route glow, dense emissive seam grid or dependence on monolith spacing for steering. Interior cues and block readability are complementary, not competing alternatives.

Gaps are real missing floor geometry. Minimum example for validation: 4u wide × 20u long. Preserve thin marigold edge definition, slight inner-lip illumination and dark open void. Do not fill with a black floor plane or imply a safely traversable material. Rim brightness must not close the opening perceptually. Slab thickness must not conceal the gap at low camera height. Earlier 1 × 2u tiny-hole examples are superseded by the reported current geometry contract.

## 6. Standard versus destructible obstacles

**Sealed mass = avoid. Broken-contour shell = shoot to clear.** Both remain collision hazards until cleared according to gameplay. Destructible does not mean safe to ram.

Standard blocks have a continuous outer silhouette and uninterrupted broad faces, with sparse narrow functional seams. Destructible blocks share the family but use a few large sections, broad recessed fractures, internal marigold energy and visible interruptions at top/side contours. Surface crack texture alone is insufficient for the approved read.

Keep outer envelope height 8u. Small silhouette notches should not advertise a fly-through opening where collision remains solid. No wholesale fragment explosion in the intact state. Prefer pre-authored geometry and a simple state change; runtime fracturing is unnecessary. Crack masks can reinforce volume but cannot replace required edge breaks.

Suggested sequence: intact breakable shell → hit response/brightening → fragments or mesh swap → short energy burst → cleared opening. Collision changes follow existing gameplay events, never a visual fade.

The latest integrated image is approved for overall appearance, but its generated crack pattern is not a topology blueprint. Implement the explicit broken-contour requirement and test it at distance.

## 7. Pickups and weapons

Retain `11_pickups_weapons_final.png` as the exact family design reference. The latest integrated image demonstrates thickness and color, not authorization to replace finalized silhouettes with newly generated icons.

Pickups must read as 3D objects: substantial geometry, side faces, bevels, dark shell/frame, inset luminous core, clear parallax and shading. A glow sprite may supplement a physical mesh; an alpha plane or flat emissive icon is not an acceptable primary pickup body. Validate while rotating, strafing and approaching, not from a single face-on view.

Bolt: elongated/linear identity; active effect a tracer. Boost: directional/chevron identity and thrust effect. Shield: enclosing/circular identity. Mine: compact radial identity. Homing Seeker: elongated square-profile untapered body with four fins, one per side. No cylinder, bulging middle, tapered rocket or octagonal eight-fin substitution. Active seeker must remain visible in the actual rear-view mirror resolution.

## 8. Low camera and occlusion proposal

User requested 4–5u eye height, with roughly 4.5u as the trial baseline, below 8u obstacles. This is approved to prototype, not frozen as the final camera. Actual setback, FOV, look-ahead target, smoothing and jump response remain to tune.

Prototype selective block transparency when a block obstructs the player or necessary forward visibility. Retain enough silhouette/footprint to communicate lethal obstruction. Fade affects rendering only: no change to collision, destructibility, aim targeting or obstacle classification. Do not fade every block, use transparency to signal breakability, or make collision hazards invisible.

Implementation choices are open: partial opacity, dithered fade or a localized reveal may be evaluated. Check ordering/overlap, shadows and emissive/bloom behavior; no particular rendering technique has been accepted. Define which sightlines trigger fading and smooth transitions to avoid popping. Multiple occluders must not erase the hazard field.

Low camera can hide short visible ground spans and flatten gap depth. Fade does not by itself solve gap visibility; test nearby gap rims separately. Retain an 6–8u comparison camera while validating the lower proposal. Do not label a generated image as proof of exact camera height.

## 9. First production slice and acceptance checks

Build a measured scene using the current game renderer and actual camera, not a painting:

- 64u floor with clear edge lights and subtle interior cues.
- 2.6 × 2.52u reference craft proxy.
- Sealed and broken-contour blocks, both 8u high, with at least one 4 × 8u footprint and additional width/depth variants.
- 4 × 20u opening plus a broader partial-width and full-width gap case.
- A measured 7u passage between obstacles, preserving the level's actual route contract.
- Finalized volumetric Bolt and Boost pickup meshes.
- Representative monolith, angular asteroid and desaturated celestial background.
- A/B/C environment settings and visible localized bloom.

Acceptance checks:

1. Inspect coordinates/bounds to verify dimensions; do not validate dimensions from pixels in generated art.
2. Compare 4u, 4.5u and 5u cameras with a higher control view. Assess gap visibility, route look-ahead and ship visibility.
3. Approach at representative 55u/s and the actual range of supported speeds. At 55u/s, half a second is 27.5u travel; obstacle height does not establish the detection window.
4. Show block classes without labels, with bloom enabled/disabled and under A/B/C lighting. Confirm consistent classification; do not assert a pass without observation.
5. Verify gap edges remain distinct from panel seams and reflected light.
6. Inspect pickups from several angles and at gameplay resolution: thickness and distinct silhouettes must persist.
7. Check gold-marigold appearance under final tone mapping/exposure; avoid reddish edge spill.
8. Test single and overlapping occluders, lateral movement and jump states. Faded blocks must remain recognizable hazards.
9. Test seeker readability in rear-view output separately; full-screen visibility is insufficient.
10. Measure frame time and draw-call/material cost on target hardware before committing to full asset production. No numeric budget is invented here.

Return measured screenshots/clips, camera settings, actual geometry values and any failed reads. If a constraint conflicts with current code, flag it rather than silently changing the art or gameplay.

## 10. Evidence and remaining limits

The original v1 package and its text were read for this update. Engineering's attached feedback supplied the dimensional corrections. The user approved both interior cues and broken contours, then the final golden-marigold, volumetric-pickup proposal.

The earlier interactive scale study was an approximate camera experiment with exact input dimensions, not the game engine. It received user approval of the visual approach; no production renderer, performance benchmark or player-recognition study has been completed here. Generated concept images are not certified scale drawings.

Retain original asset sheets for asset identity, latest scene for the approved integrated look, and this document/current verified code for dimensions. Do not resume iterating from the rejected foggy, empty-space, flat-pickup or red-orange revisions.
