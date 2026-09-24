---
name: pacing-board-needs-cdp-not-screenshot-flag
description: "headless `--screenshot` of /pacing is blank even with --virtual-time-budget; the analysis runs in a Web Worker. Drive CDP and poll for the lane's rects first"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 013617c5-d2b8-4fae-a082-d537e7d37a36
  modified: 2026-09-24T11:18:03.931Z
---

`chrome --headless=new --screenshot --virtual-time-budget=30000 /pacing?seed=1` gave an all-black frame on
2026-09-24. The loader awaits `analyzeSeed()`, which runs in a Web Worker, and virtual time does not wait
for it. A CDP driver works: start Chrome with `--remote-debugging-port=<free port>`, `PUT /json/new?<url>`,
poll `Runtime.evaluate` until `document.querySelector('[aria-label=Notes]')` has `rect` children (took
a few seconds), then `Page.captureScreenshot`. The CDP script from that session was about 20 lines of
node with the global `WebSocket`, and it needed no npm package.

**Why:** a blank frame looks like a render bug in your lane, when the page was not ready.
**How to apply:** for any /pacing visual check, poll for a feature of the panel you changed before you
capture. Related: [[headless-chrome-for-frame-taps]], [[check-the-cdp-port-is-yours]],
[[headless-game-tabs-starve-the-gpu]].
