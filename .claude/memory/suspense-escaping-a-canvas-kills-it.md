---
name: suspense-escaping-a-canvas-kills-it
description: "A suspending hook (drei useTexture/useGLTF) with no Suspense inside an R3F Canvas escapes to the DOM Suspense via R3F's Block; React runs the Canvas layout cleanup and R3F forces a WebGL context loss 500 ms later"
metadata:
  node_type: memory
  type: project
  originSessionId: 28505603-dac4-4c97-9e22-97d0b030d0c3
  modified: 2026-09-29T11:53:18.739Z
---

On the home landing (2026-09-29, #386), `SceneBackdrop` and `RockField` call drei `useTexture`, and no
`Suspense` sat inside the landing `<Canvas>`. R3F's internal Suspense fallback is `Block`, which rethrows the
promise to the DOM tree. The DOM `Suspense` in `LandingBackdrop` hid the tree and React ran the Canvas layout
cleanup. That cleanup calls `unmountComponentAtNode`, and 500 ms later R3F calls `gl.forceContextLoss()`.
The `webglcontextlost` listener (`dropBackdrop3d`) then swapped in the still backdrop. This happened on every
cold and warm load, with no console error.

**Why:** the context loss looks like a GPU failure, but R3F caused it on unmount. Trace it by wrapping
`WEBGL_lose_context.loseContext` (the stack shows `forceContextLoss`). Also count `onCreated`: two calls on
one canvas mean the Canvas remounted.

**How to apply:** every `<Canvas>` whose children can suspend needs a `<Suspense>` inside the Canvas. Fixed
for the landing in 04684954; `NetCanvas` has none but no DOM Suspense above it [inferred why it survives].
When a headless probe shows a scene part missing once (rocks gone, 67 draws not 74), rerun it before you
believe it: the next run was identical to old. Related: [[headless-game-tabs-starve-the-gpu]],
[[removing-the-composer-blacks-the-canvas]].
