---
name: msaa-edge-samples-extrapolate-varyings
description: "With composer MSAA on, a pow() on an unclamped varying writes NaN and bloom blacks out the whole frame"
metadata:
  node_type: memory
  type: project
  originSessionId: b15452d0-891e-4b6d-80ea-7b16cea185ff
  modified: 2026-09-23T20:29:32.311Z
---

With composer MSAA on, the fragment shader runs at the pixel centre even when the centre is
outside the triangle. So a varying can come out past its vertex range, e.g. `vAxial > 1`.
`pow( 1.0 - vAxial, k )` then has a negative base, and GLSL `pow` of a negative base is undefined:
the result is NaN. A few NaN texels in the RGBA16F scene buffer are enough. The bloom + tone-map
chain spreads them, and the **whole frame goes black**. At MSAA 0 the same shader is clean. Found
2026-09-24: exhaust plume, 77/120 live frames black at MSAA 4. Fixed in 0bf4e88.

**Why:** a whole-frame black flash does not point at one mesh, so the cause is hard to find
without the method below.

**How to apply:**
- Clamp every `pow`/`sqrt`/`log` base that comes from a varying: `clamp( x, 0.0, 1.0 )`.
- Diagnose by wrapping `EffectComposer.prototype.render` (the prebundled
  `/node_modules/.vite/deps/postprocessing.js?v=…` is the page's own instance). After each render,
  `readRenderTargetPixels( this.inputBuffer, … , Uint16Array )` and count half-floats with exponent
  `0x7c00` and a non-zero mantissa. Then hide `scene.children[i]` one at a time until the count is 0.
- Do not add a scene-wide NaN scrub unless a second source appears. Supervisor ruling, 2026-09-24.

Related: [[sub-pixel-geometry-drops-out-without-aa]], [[drive-the-live-module-not-a-reload]].
