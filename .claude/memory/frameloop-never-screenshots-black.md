---
name: frameloop-never-screenshots-black
description: "After setFrameloop('never') + advance(), Page.captureScreenshot returns a black canvas; read the canvas with toDataURL in the same task as advance()"
metadata:
  node_type: memory
  type: reference
  originSessionId: 1e4684a0-b2ae-44f1-bf3c-d2f37efaeb89
  modified: 2026-09-26T08:28:30.701Z
---

With R3F stepped by hand ([[step-the-r3f-clock-for-timed-taps]]), a CDP `Page.captureScreenshot` taken
after `advance(t)` came back fully black on every VFX frame. This was measured on 2026-09-26 in the #277
look check. The same tab screenshotted normally while the frameloop was running.

Fix: in the same `Runtime.evaluate` that calls `advance()`, read `document.querySelector('canvas')`
into a 2D canvas with `drawImage` (crop and scale there if you like), and return `toDataURL('image/png')`.
The drawing buffer is still intact within that task.

**Why:** the canvas has no `preserveDrawingBuffer`. The capture happens after the compositor has
presented and cleared the buffer (inferred). Five black crops looked like "the effect did not render".

**How to apply:** use in-task readback for any hand-stepped tap. Always take one baseline frame
first, so that "black" or "empty" is known to be a capture problem, not the scene. Related:
[[fake-performance-now-for-timed-taps]], [[headless-chrome-for-frame-taps]].
