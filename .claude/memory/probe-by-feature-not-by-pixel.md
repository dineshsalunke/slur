---
name: probe-by-feature-not-by-pixel
description: "Locate a surface in each frame from its own emissive and sample at offsets from that; a fixed pixel probe measures whatever drifted under it"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c6b397f8-45e0-40d8-94dc-131a36dfa292
  modified: 2026-09-23T05:37:23.969Z
---

To measure a surface across two frame taps, find it **in each frame** from a feature and sample at
offsets from there. Never reuse a pixel rectangle between runs.

Two forms that worked for #162:
- **Walk a line.** For each column across the rail, find the strip's own pixel in that column, then
  sample the deck at fixed `+px` offsets below it. Both samples then sit at the **same depth**,
  which is the only fair comparison between a thin distant emitter and a large near surface.
- **Anchor on a seam.** Find the brightest warm vertical run, then sample the face at `-px` from it.

Derive scale from the feature, not from a remembered number: the rail strip is `RAIL_W` 2.0 ×
`RAIL_EMISSIVE_SHARE` 0.125 = **0.25u**, so its measured width gives px/u in that frame. This fails
where the feature runs near-parallel to the scanline — a 36px "strip" on one row was a rail seen
edge-on.

**Why:** camera drift between runs is real ([[freeze-the-sim-to-ab-a-light]]), and a fixed probe
silently follows it onto the neighbouring surface. Worse, the surface you assume is often the wrong
one: the bright marigold line on the deck near the chase camera is the **gap-rim cord**
(`Rail.rimEmissive`), not the rail — `Rail.railEmissive` 0 leaves it untouched. Three runs were
measured against it before `drawbox` caught it.

**How to apply:** locate the probe in the `bloom-off` tap and read values from the composed tap —
`bloom-off` is `gl.render(scene, camera)` (`frame-tap-pump.ts:65`), which bypasses the whole
`EffectComposer` including `ToneMapping`, so its **edges are trustworthy and its values are not**.
For bloom off inside the shipped pipeline, set `Bloom.intensity` 0. Then verify every path with
`drawbox` before believing a number ([[eyeballing-a-tap-lies-about-brightness]]).
