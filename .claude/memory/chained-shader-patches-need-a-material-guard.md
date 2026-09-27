---
name: chained-shader-patches-need-a-material-guard
description: "onBeforeCompile patches applied from a ref callback re-wrap on every attach; use chainShaderPatch, never a bare `prior` wrap"
metadata:
  node_type: memory
  type: project
  originSessionId: 0a3379a2-ce04-403d-9d59-7e6565f31e3b
  modified: 2026-09-27T05:02:16.723Z
---

A material patch that wraps `material.onBeforeCompile` from an R3F ref callback runs again on every
re-attach (inline ref = every render; StrictMode double attach). Each run wraps the chain again. Result: the
shader edit runs twice (throws, or "redefinition" compile errors → invisible mesh), and a growing
`customProgramCacheKey` rebuilds programs every frame (black frame, ~2 fps in Zen).

A guard keyed on `prior` fails when two helpers chain on one material: each helper's `prior` is the other's
wrapper. Use `chainShaderPatch( material, tag, fn )` in `apps/client/app/game/scene/shader-patch.ts`
(e5f8e20). It tracks tags per material and resets if `onBeforeCompile` is replaced.

**Why:** #310. Removing `patchRailGlow`, which reset the chain by assigning it, exposed this.
Headless Chrome hid the black frame. The owner's Zen showed it.

**How to apply:** every new `onBeforeCompile` patch goes through `chainShaderPatch`. After a shader-patch
change, log console errors and count `linkProgram` over 10 s ([[count-draw-calls-without-repo-edits]]).
