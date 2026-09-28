---
name: scene-env-intensity-overrides-material
description: three 0.185 replaces material.envMapIntensity with scene.environmentIntensity when material.envMap is null — per-material env dials are dead
metadata:
  node_type: memory
  type: project
  originSessionId: 4c4a9afb-6e2e-4fe8-a74a-af2ada955bb9
  modified: 2026-09-28T18:01:27.096Z
---

three 0.185.1 `WebGLRenderer.js:2694` writes `m_uniforms.envMapIntensity.value = scene.environmentIntensity`
for every Standard/Lambert/Phong material whose own `material.envMap === null`, while `scene.environment` is
set. Every SLUR lit material relies on `scene.environment`, so `Deck/Rail/Rock/Ship.envMapIntensity` do
nothing. Only `Environment.intensity` reaches the shader.

**Why:** measured for #355 (2026-09-28). A CDP read of `renderer.properties.get(m).uniforms.envMapIntensity`
followed the scene dial exactly on every material, and `material.envMapIntensity` (0.45, 1, 1.5) was ignored.
The global dial itself works: on a fresh page, 0 / 1.2 / 5 gave a mean frame luma of 17 / 85 / 147 on high
and 18 / 92 / 135 on low, both through `setNum` and through the leva input.

**How to apply:** to give a surface its own env strength, set `material.envMap` explicitly. That takes it off
the scene dial, so compose the two by hand (per-material × global). A "dial does nothing" report may be a
black main view instead: `3c576aa` blacked quality=high in headless.
Related: [[raycast-luma-probe-per-surface]].
