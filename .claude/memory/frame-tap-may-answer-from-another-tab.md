---
name: frame-tap-may-answer-from-another-tab
description: "/__frame-tap is served by whichever page responds, which may be another agent's tab; screenshot the tab you drive via CDP instead"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c4aee720-5af9-46db-8e98-cf73d0c20042
  modified: 2026-09-23T10:06:01.007Z
---

`POST /__frame-tap` is answered by **whichever page responds**, not necessarily the one you are
driving. Other sessions keep their own `/test-level` tab open on :5173, and the owner keeps one too
(see [[leave-the-browser-tab-open]]). So a tap can capture a page that never saw your changes.

**Why:** combined with [[cdp-import-of-tuning-hits-an-hmr-orphan]] this gives two independent ways to
measure the wrong thing at once, and neither announces itself — the tap returns `ok: true` and a
plausible PNG.

**How to apply:** when a reading must correspond to state you just set in a specific tab, use CDP
`Page.captureScreenshot` against that tab's own `webSocketDebuggerUrl` rather than the tap endpoint.
Keep `/__frame-tap` for "what does the build look like" captures where any tab will do. When a tap
does return, `responders` in the verdict is the thing to check.
