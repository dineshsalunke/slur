---
name: aniso-stretches-the-hdri-not-emissives
description: Deck anisotropy smears the cold HDRI planet lobe and point lights, never emissive glows; Physical at 0 = Standard
metadata:
  type: project
---

Measured 2026-09-29 (#354 part 2b). The deck as `MeshPhysicalMaterial` with anisotropy 0 renders the
same as `MeshStandardMaterial` (luma 51.0 vs 50.8): three 0.185 gives both F0 0.04 and F90 1. Along the
track (rotation π/2, since the deck tangent is +x) anisotropy 0.5 drags the planet reflection into a
white wash, luma +15. Rails and seams do not streak because emissives are not in the env map.

**Why:** anisotropy only reshapes IBL and punctual-light lobes. Warm streaks need the fake
additive streaks ([[deck-glare-is-the-hdri-lobe]]).

**How to apply:** do not reach for anisotropy to get warm reflections. To preview material props
without a repo edit, set them live via the __THREE_DEVTOOLS__ hook ([[three-devtools-hook-gives-the-scene]]).
For an uncapped frame meter in headless, add `--disable-gpu-vsync --disable-frame-rate-limit`.
