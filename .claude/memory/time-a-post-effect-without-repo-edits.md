---
name: time-a-post-effect-without-repo-edits
description: "Prototype and time a postprocessing Effect with no repo edits by hijacking the page's live EffectComposer over CDP; screenshot to prove it rendered"
metadata:
  node_type: memory
  type: reference
  originSessionId: 595fb26d-5314-4394-9ded-60b0a579b4c2
  modified: 2026-09-26T08:17:44.443Z
---

To cost a new post effect before building it, with no repo edits and no StoreExpose mount:

1. In the page, find the dep URLs: `performance.getEntriesByType('resource')`, and match `/deps/postprocessing.js`
   and `/deps/three.js`. Import those exact URLs, because a different URL gives a second module instance
   ([[cdp-import-of-tuning-hits-an-hmr-orphan]]).
2. Wrap `pp.EffectComposer.prototype.render` once to capture `this` (the live composer), then restore it.
3. `pass = composer.passes.find(p => p instanceof pp.EffectPass)`, then
   `pass.setEffects([myEffect, ...pass.effects]); pass.recompile()`. `setEffects` is `protected` only in the
   `.d.ts`.
4. The frame meter can use `document.querySelector('canvas').getContext('webgl2')`, which returns the live
   context.

**Always screenshot once.** A run showed `useProgram: program not valid`, and until a frame proved the
effect was drawn, the timings could have measured a broken pass. Those errors came at `browser.close()`
teardown, not from the effect.

Script: the #269 lane's scratch `blur-perf.mjs` (2026-09-26). A radial blur at 8–16 taps was below noise at
DPR 1. Related: [[headless-game-tabs-starve-the-gpu]], [[drive-the-live-module-not-a-reload]].
