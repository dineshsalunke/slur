---
name: freeze-the-sim-to-ab-a-light
description: "A lighting A/B is only valid with the camera still — freeze at the spawn pose, because a timed flight does NOT land the same frame twice"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 7aa100d3-c5f2-4a6c-9ef2-f3ff1d699435
  modified: 2026-09-23T05:37:09.369Z
---

`KeyP` toggles `simFreeze` (`apps/client/app/dev/sim-freeze.ts`); `LocalLoop` skips the sim but
still runs `updateChaseCamera`, so the frame holds. That is what makes an A/B of two lighting
values comparable.

**Correction (2026-09-23):** this note used to claim a fixed flight duration lands the same frame.
**It does not.** Two identical default runs holding `KeyW` for 4s came back at **SSIM 0.906** —
enough drift to move a monolith across the frame and to swamp any effect under ~2 levels. The
number of sim steps inside a wall-clock window is not deterministic.

**How to apply:** freeze at the **spawn pose** — reload, send no `KeyW` at all, `KeyP`, tap. That is
SSIM **0.995** run to run. When a flown pose is unavoidable, do not trust fixed pixel coordinates:
probe by feature per frame ([[probe-by-feature-not-by-pixel]]). Drive a headless Chrome over CDP
(`/json/list` → `Runtime.evaluate` over the native `WebSocket` in node 24); set the override with
`localStorage.setItem('slur.tuning.v1', ...)` — entries are `{value, from}` and `restore()` drops
one whose `from` no longer matches the schema default — then `location.reload()`. Reconnect the CDP
socket after the reload; the pre-reload session stops answering. If `Runtime.evaluate` hangs or the
tap reports "nobody answered", the browser is wedged: `pkill -f "remote-debugging-port=<port>"` and
relaunch. Input is read from `e.code`, so a synthetic `new KeyboardEvent('keydown', {code:'KeyW'})`
works — but a strafe of even 1.1s off the spawn pose throws the ship off the deck edge.
Related: [[headless-chrome-for-frame-taps]], [[eyeballing-a-tap-lies-about-brightness]].
