---
name: narrow-headless-captures-need-cdp-viewport
description: Headless Chrome --window-size=390 lays the page out wider and crops it; force phone viewports with CDP Emulation.setDeviceMetricsOverride
metadata:
  node_type: memory
  type: feedback
  originSessionId: a26c0a9e-1bdf-402b-be97-4901c71be37a
  modified: 2026-09-23T20:42:09.981Z
---

`chrome --headless=new --window-size=390,844 --screenshot` does NOT give a 390-wide layout. The page
lays out wider (text runs off the right edge), and the capture is cropped to 390. The frame looks
plausible, so a positional reading taken from it is wrong. A finish reviewer rejected one on
2026-09-24.

**Why:** Chrome enforces a minimum window width [inferred ~500px]. Only the viewport emulation
changes the layout width.

**How to apply:** for any phone-size capture, launch headless Chrome with
`--remote-debugging-port` and send `Emulation.setDeviceMetricsOverride` (width, height,
deviceScaleFactor 1, mobile true) before `Page.navigate`. Then `Page.captureScreenshot`. Probe
`innerWidth` and `document.documentElement.scrollWidth` in the same run. Both must equal the target
width. For reduced motion, add `Emulation.setEmulatedMedia` with
`prefers-reduced-motion: reduce`. Check the port is free first ([[check-the-cdp-port-is-yours]]).
Kill the Chrome afterwards ([[headless-game-tabs-starve-the-gpu]]).
