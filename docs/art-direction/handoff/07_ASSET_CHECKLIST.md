# 07 — Initial Production Asset Checklist

> **V2:** Read `UPDATED_HANDOVER.md` first. Its dimension contract, approved corrections and validation status supersede conflicting legacy wording or image annotations.

This is a practical first-pass content list. Exact counts can be adjusted during implementation.

## Shared materials / shaders

- [ ] Track graphite material
- [ ] Dark stone material
- [ ] Worn concrete variant
- [ ] Asteroid rock material
- [ ] Marigold emissive material / mask system
- [ ] Dark cavity material for gaps
- [ ] Shared pickup/weapon shell material
- [ ] Optional fracture-emissive material variant

## Track

- [ ] Repeating floor section
- [ ] Track boundary / edge strip
- [ ] Gap side/interior treatment
- [ ] 4 × 20u minimum-gap rim treatment
- [ ] Finish-line structure

## Monoliths

- [ ] Obelisk small/medium/large
- [ ] Gate small/medium/large
- [ ] Arch small/medium/large
- [ ] Optional sparse marigold seam variants

## Asteroids

Base meshes:

- [ ] Angular
- [ ] Plate
- [ ] Broken

Composition variants:

- [ ] Elongated
- [ ] Shattered set
- [ ] Cluster set

Material variants:

- [ ] cold/dark default
- [ ] fractured
- [ ] rare energy-vein

## Planets / moons / sky

- [ ] Gas giant background setup
- [ ] Moon setup
- [ ] Crescent/eclipse setup
- [ ] Day-side lighting configuration
- [ ] Backlit configuration
- [ ] Eclipse configuration

## Sector presets

- [ ] Monolith Field
- [ ] Asteroid Gauntlet — controlled density
- [ ] Planetary Horizon
- [ ] Distant Worlds
- [ ] Eclipse Corridor
- [ ] Convergence — reduced clutter

## Obstacles

- [ ] Standard deadly block base form
- [ ] Variable-width/depth variants and horizontal groups; every block 8u tall
- [ ] Destructible block intact visual
- [ ] Destructible hit/crack visual progression
- [ ] Destroyed / fragment / clear state

## Pickups / weapons

- [ ] Bolt pickup
- [ ] Bolt active tracer
- [ ] Boost pickup
- [ ] Boost active effect
- [ ] Shield pickup
- [ ] Shield active envelope
- [ ] Mine pickup
- [ ] Mine deployed hazard
- [ ] Square 4-fin Homing Seeker pickup
- [ ] Square 4-fin Homing Seeker active mesh/effect
- [ ] Rear-view visibility test for seeker

## VFX tests

- [ ] Engine glow / trail baseline
- [ ] Boost trail
- [ ] Bolt tracer
- [ ] Shield envelope
- [ ] Mine activation
- [ ] Seeker trail
- [ ] Destructible-block break burst
- [ ] Finish-line treatment

## Readability validation

Test each in the actual chase camera:

- [ ] small partial gap
- [ ] large gap
- [ ] standard deadly block
- [ ] destructible block
- [ ] pickup silhouettes
- [ ] seeker in rear-view mirror
- [ ] A/B/C background intensity without gameplay loss
