# 06 — Three.js / R3F Production Notes

> **V2:** Read `UPDATED_HANDOVER.md` first. Its dimension contract, approved corrections and validation status supersede conflicting legacy wording or image annotations.

These are implementation suggestions, not frozen engine requirements. Preserve the visual result while choosing the simplest performant technique.

## General production philosophy

- Prefer reusable geometry over unique one-off meshes.
- Prefer silhouette and lighting over high-frequency detail.
- Use instancing for repeated environment fillers where practical.
- Use LOD / simplified distant meshes for large fields.
- Keep material count low.
- Use emissive accents selectively.
- Keep bloom visibly luminous but localized; evaluate shape readability with bloom disabled as well.

## Materials

A small shared material library can cover most of the world:

1. Track graphite metal
2. Dark stone / concrete
3. Asteroid rock
4. Neutral dark pickup/weapon shell
5. Marigold emissive

Variation should come from roughness, large-scale normal detail, emissive masks, lighting, and geometry—not dozens of unrelated materials.

## Track

Recommended:

- modular floor slabs / repeated track sections
- large panel lines baked into mesh/texture/material
- separate emissive edge strip geometry or a stable emissive channel
- restrained rough metal surface

Do not build a dense physical seam grid if a texture or simple material treatment gives the same read.

## Gaps

Use actual missing floor geometry for gameplay gaps.

For tiny-gap readability:

- thin emissive rim/edge geometry or emissive mask
- darker cavity / side wall material
- subtle inner lip illumination

Do not add floating icons or warning decals unless later gameplay testing proves geometry cues are insufficient.

## Monoliths

Good candidates for:

- simple box-based modular geometry
- instanced variants
- a small number of obelisk/gate/arch prefabs
- large-scale panel-line material

At distance, texture detail can be extremely light.

## Asteroids

Use a small set of authored base forms and derive variety by:

- scale
- rotation
- non-gameplay placement
- cluster composition
- selective material/fracture variation

For distant fields, use aggressive LOD or impostors if needed.

Energy-veined asteroids should be rare variants, not every instance.

## Destructible blocks

**Do not default to runtime CSG or runtime mesh fracturing.**

Preferred production options, roughly simplest-first:

- pre-authored broken-contour intact mesh + emissive fracture reinforcement + destroyed-state disappearance
- visibly segmented intact mesh → fragment replacement on hit/break
- pre-authored fragment set with short physics/VFX burst
- shader/material crack progression

The art requirement is the readable fracture state, not physically accurate destruction.

## Pickups

Pickups should be low-complexity, strong-silhouette meshes with emissive elements.

Consider:

- gentle rotation / hover
- restrained halo or light
- distance-readable emissive core

Avoid large particle clouds while the pickup is idle.

## Homing Seeker

Build around a simple long box / square-prism shell with four fins.

This is intentionally production-friendly:

- simple silhouette
- few parts
- easy LOD
- strong rear/front energy core
- readable in rear-view rendering

Ensure the active seeker remains readable when rendered at the rear-view mirror's actual resolution. Test there early rather than at full-screen resolution only.

## Post-processing

If using bloom:

- keep the environment mostly below bloom threshold
- prioritize track edges, engines, pickups, projectiles, and functional energy
- avoid turning every marigold seam into a large halo

Motion effects should reinforce speed without hiding obstacles or gap edges.
