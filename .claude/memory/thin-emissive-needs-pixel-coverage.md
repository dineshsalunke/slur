---
name: thin-emissive-needs-pixel-coverage
description: "A thin emissive seen edge-on blooms weakly even far above threshold; bloom follows lit-pixel area, so check screen width first"
metadata:
  node_type: memory
  type: project
  originSessionId: 0f953a5b-6b0f-4be3-832b-b6e21ec83a82
  modified: 2026-09-23T19:46:09.016Z
---

Bloom output follows the number of lit pixels. It does not follow emissive strength alone. A thin flat
emissive seen at a grazing angle goes sub-pixel. It then renders as a dashed 1 px line (no MSAA,
`antialias:false`) and gets only a thin halo.

Measured on the rail flow seam (#229, 2026-09-24): luminance 0.853, above threshold 0.6+0.2. Core 1 px.
Halo +79 R against +100 for a 3 px monolith seam. Emissive ×4 gave a bigger halo, but the core clipped
to white and stayed 1 px.

**Why:** "no bloom" looks like a threshold or tone-mapping bug. Here it was geometry.

**How to apply:** for "X doesn't bloom", first run an `ab=1` frame tap
([[headless-chrome-for-frame-taps]]). Then print pixel values across the element in both PNGs. Count the core
width before you tune intensity. Zero the element's emissive to confirm which line is which. Related:
[[probe-by-feature-not-by-pixel]].
