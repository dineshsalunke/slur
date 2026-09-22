---
name: browser-extension-throttles-fps
description: Frame rate measured through the Chrome extension is worthless — the driven tab is backgrounded and rAF is throttled
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 8d1222da-a10a-4764-959a-5da4dc9922b1
  modified: 2026-09-22T02:51:27.355Z
---

Never measure wall-clock frame rate in the tab driven by the `claude-in-chrome` extension. Driving it
backgrounds the window, so `document.visibilityState` goes `hidden`, Chrome throttles
`requestAnimationFrame` to ~30 Hz, and when fully hidden rAF stops firing altogether — a sampling
loop then never completes and the CDP call times out.

**Why:** a session spent real effort chasing a 30 fps "regression" that was the throttle. The same
build ran at 120 fps in the owner's own browser.

**How to apply:** measure frame rate by reading an in-app readout on the owner's foreground browser
(`dev/fps-readout.tsx` in this repo), or ask them. What *is* trustworthy from the extension is
**CPU time per frame** — `addEffect` → `addAfterEffect` — because it does not depend on vsync; use it
to decide CPU-bound vs GPU-bound. See [[leave-the-browser-tab-open]].
