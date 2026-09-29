---
name: nozzle-colour-lives-in-two-glb-materials
description: "Ship nozzle hue comes from two GLB materials (Engine_core, Marigold_emission), both overridden to accent() in collectSurfaces; isolate them with Exhaust.glow 0"
metadata:
  node_type: memory
  type: project
  originSessionId: ff0b9142-66e0-427d-8757-0be1484bcb3a
  modified: 2026-09-29T04:45:52.034Z
---

The ship nozzle is two GLB materials. `Engine_core` is the grille bars. `Marigold_emission` is the face
plates, authored at hue 34° (not the 40° accent). Since 4c66045 (#369, ADR-033) `collectSurfaces`
(`ship-model.utils.ts`) sets both emissives to `accent()` over a black base, via `tintNozzle`. The
EngineLight point light is deleted.

**Why:** the GLB colours plus a peach base colour and a high `Ship.engineCruise` read 29.8° peach after
Neutral tone mapping. Changing only `Engine_core` left a 35° top band.

**How to apply:**
- Retune nozzle colour in `ship-materials.ts`, not the GLB. Measure hue per brightness band in a crop,
  not a mean over the crop.
- To A/B the nozzle emissive alone, set `Exhaust.glow` 0 first: the plume saturates the rear faces.
- A route rewrite of `ship-model.utils.ts` must match with a regex: Vite serves it reformatted, with
  no spaces inside parens ([[preview-a-constant-by-route-rewrite]]).
- Related: [[freeze-the-sim]], [[probe-by-feature-not-by-pixel]], [[tuning-over-cdp]].
