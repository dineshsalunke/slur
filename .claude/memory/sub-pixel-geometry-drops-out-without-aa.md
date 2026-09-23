---
name: sub-pixel-geometry-drops-out-without-aa
description: The scene has no AA (composer multisampling 0); a strip under ~1 px wide vanishes for whole frames as it crosses a column. Check a dial actually applied before trusting a null result
metadata:
  node_type: memory
  type: feedback
  originSessionId: 6c057076-c1f8-4633-b314-c723b4c8e022
  modified: 2026-09-23T20:16:05.990Z
---

The main scene renders with **no anti-aliasing**: `EffectComposer multisampling={ 0 }`
(`scene-effects.tsx`) into a plain `DEPTH_COMPONENT24` 1600×813 target (verified 2026-09-24). The
canvas `antialias: false` (`canvas-gl.ts`) does not matter, because the composer owns the scene pass.

So any emissive strip narrower than ~1 px on screen is point-sampled. When it straddles a column
boundary, no pixel centre falls inside it, and the whole strip is missing for a frame. Monolith seam
(`EDGE_SEAM.width` 0.5u), DPR 1, 354–414u from the camera: whole-seam drops to 0.65 of neighbours
every ~7 frames, one drop per 1 px of lateral travel. Brighter emissive makes it worse (bloom amplifies).
Anything that widens the footprint cures it: width 0.75, proud 1.0, or `polygonOffset` −1/−1.

**Why:** "Flicker far, gone close" is this mechanism. It is not z-fight: at 374u a 24-bit
depth step is ~0.008u, far under the 0.25u a proud seam stands out.

**How to apply:**
- Measure with a stepped clock at ~1u per frame ([[step-the-r3f-clock-for-timed-taps]]) and look for
  whole-feature drops in lockstep with 1 px of lateral travel.
- **Prove the dial applied before believing a null.** Read the value back from the live mesh after
  setting it. Two whole dial sweeps came back bit-identical to baseline: in **zsh**, `for a in "x y z";
  node s.mjs $a` passes ONE argument (zsh does not word-split). Use `${=a}`.
- A dial applied right after a reload can be lost when the mesh re-mounts. Apply it after the settle frames.

Related: [[thin-emissive-needs-pixel-coverage]], [[probe-by-feature-not-by-pixel]].
