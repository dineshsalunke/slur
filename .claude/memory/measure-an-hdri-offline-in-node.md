---
name: measure-an-hdri-offline-in-node
description: "Compare HDRIs (key direction, per-face irradiance, env-band share) with three's HDRLoader in plain node — no browser"
metadata:
  node_type: memory
  type: reference
  originSessionId: b0dbb31a-e79c-4a54-b350-bdae780be506
  modified: 2026-09-29T02:45:03.932Z
---

three's `HDRLoader` parses in plain node: import it from `apps/client/node_modules/three/examples/jsm/loaders/HDRLoader.js`,
`setDataType(THREE.FloatType)`, `parse(arrayBuffer)` → `{ data, width, height }` (RGBA floats, row 0 = zenith).
Weight each texel by `cos(el)·dθ·dφ` and sum `L·max(0, n·d)` per face normal to get irradiance; add the
#356 band term the same way to get its share. Takes under a second at 1k. Script shape used for #362:
peak texel → key light azimuth/elevation (compare against `Environment.rotation`), mean radiance, and
band % on ±x/±z/up/down faces.

**Why:** swapping the default HDRI changes brightness and band share far more than the eye reports; a
browser tap is slower and noisier ([[headless-game-tabs-starve-the-gpu]]).

**How to apply:** before judging an HDRI swap or a band dial, run the numbers offline first, then brief the
owner on `/test-level` ([[owner-tests-on-test-level]]).
