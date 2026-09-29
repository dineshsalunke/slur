---
name: raycast-luma-probe-per-surface
description: "Measure scene brightness per surface/face/distance by raycasting the live camera and reading the screenshot pixel; metal-1 track at F0 0.07 is the #345 dark cause"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 9b56a231-3599-418f-a76d-432ef6fb03b8
  modified: 2026-09-28T15:42:22.918Z
---

To measure how bright each surface renders, do not pick probe rectangles by eye. In a Playwright
headless page ([[headless-game-tabs-starve-the-gpu]]), capture the main camera through an
`onBeforeRender` wrapper (aspect = innerWidth/innerHeight, fov > 50), then raycast a pixel grid (step 8)
against every visible mesh that has `metalness`. Label each hit by mesh, face normal (top/front/side)
and distance bin, and read that pixel's luma from `page.screenshot()` decoded into a 2D canvas. Add
lights, or change `setNum` dials, live between shots. The frame stays bit-identical, so baseline
repeats within ±0.3.

**Why:** #345 (2026-09-28). The probe found the cause of "dark and uneven". Every track metal has
metalness 1 with `Metal.baseColor` #4a4d52 (F0 ≈ 0.07). The near deck read 15/255 and the far deck
34, because of grazing Fresnel. Camera-facing block fronts read 14, and walls at 30–80u read 5.8.
Hemisphere light and lower metalness barely help at that albedo. A light from behind the camera plus a
brighter base colour does help.

**How to apply:**
- Writing `material.metalness` directly is overwritten each frame by `deck-finish.ts`. Use
  `setNum('Deck.metalness')`.
- `Metal.baseColor` is `rebuild: true`. Emulate it live with `material.color.multiplyScalar(k)` on the
  mapped materials.
- The camera capture failed on `quality=low`, so check the filter there first.
- The driver is in the #345 scratch folder: `light/probe.mjs`. Related:
  [[eyeballing-a-tap-lies-about-brightness]], [[instanced-mesh-footguns]].
