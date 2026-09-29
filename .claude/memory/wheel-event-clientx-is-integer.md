---
name: wheel-event-clientx-is-integer
description: A synthetic wheel at a fractional pixel reaches the page with an integer clientX; probe cursor-anchored zoom at whole pixels or you measure a fake drift
metadata:
  node_type: memory
  type: reference
  originSessionId: a3d9cf52-41e9-47aa-bff6-81347993f938
  modified: 2026-09-26T20:54:48.537Z
---

Playwright `mouse.wheel` at a fractional position (e.g. `box.width * 0.7`) delivers a `WheelEvent`
whose `clientX` is a whole pixel (verified 2026-09-27, #304 editor zoom). A driver that reads the
world point under the *fractional* position sees a drift of `frac × (1/scaleBefore − 1/scaleAfter)`:
0.054u at 100 % → 300 %, which looked like a zoom-anchor bug. At integer pixels the anchor held to
1e-14.

**How to apply:** round the probe point to whole CSS pixels (`Math.round(box.x + …) - box.x`) before
any cursor-anchored check. React `onWheel` is passive, so a Ctrl+wheel zoom needs a native
`addEventListener('wheel', …, { passive: false })` to `preventDefault` the page zoom. Related:
[[tuning-over-cdp]].
