---
name: removing-the-composer-blacks-the-canvas
description: "Unmounting the EffectComposer leaves a black canvas — any useFrame priority > 0 turns off R3F's own render; mount a plain gl.render at priority 1 instead"
metadata:
  node_type: memory
  type: project
  originSessionId: 8e54f894-7642-4b8e-b6f8-1bb611e1674d
  modified: 2026-09-28T15:49:43.090Z
---

Any `useFrame( fn, priority )` with priority > 0 turns off R3F's automatic render
(`@react-three/fiber` events-*.esm.js `subscribe`: "takes rendering into its own hands"). EngineLight,
ExhaustField and BoostStreaks use 0.25, so the EffectComposer (renderPriority 1) is the only thing that
draws. Gate the composer off and the canvas goes black, while the HUD still shows 60 FPS.

**Why:** #344 P2 (286c8ef) gated SceneEffects off on the low tier. workerone found the black canvas.
My headless check counted scenes and DPR and never looked at pixels, so it missed it.

**How to apply:** when the composer is off, mount `PlainRender` (game/scene/plain-render). It calls
`gl.render(scene, camera)` at priority 1 (`QualityGate fallback`). Check any render-path change with
a screenshot, not only object counts. The composer also sets `gl.toneMapping = NoToneMapping` while it
is mounted and restores it on unmount. Without it, the CANVAS_GL NeutralToneMapping applies. Related:
[[grab-the-scene]].
