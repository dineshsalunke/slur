---
name: zoom-the-chase-camera-over-cdp
description: "For a close-up of a small prop on /test-level, pin the MAIN camera's fov with a defineProperty getter; a plain write is overwritten each frame and the first camera found is the rear-view one"
metadata:
  node_type: memory
  type: reference
  originSessionId: d9013cc9-4147-43e3-98ad-6514dd153087
  modified: 2026-09-26T19:21:40.021Z
---

The chase camera sits well behind the ship, so a pickup or gate is a few pixels wide in a headless still.
To take a telephoto close-up with no repo edit (verified 2026-09-27, #303):

1. Import the page's own three: take the `performance.getEntriesByType('resource')` URL that matches
   `/deps\/three\.js/`, then `await import(url)`.
2. Wrap `T.Object3D.prototype.onBeforeRender` for about 300 ms. Keep the first perspective camera whose
   `aspect` equals `innerWidth / innerHeight`, then restore the original. **Filtering on `fov > 30`
   picks the rear-view camera (fov 36).** The main camera has fov 70.
3. `Object.defineProperty(cam, 'fov', { get: () => window.__zoomF || base, set: v => { base = v } })`,
   and call `cam.updateProjectionMatrix()` in your own rAF loop. **A plain `cam.fov = 12` does
   nothing**, because the chase code writes fov every frame.

Place the ship 9–14u short of the prop and off to one side ([[place-the-ship-over-cdp]]), then use
fov 10–28. An extra rAF loop doubles the frame count in a draw-call hook, so filter out zero-draw frames
([[count-draw-calls-without-repo-edits]]). The driver is in the #303 scratch folder as `portal-check.mjs`.
