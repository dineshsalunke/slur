---
name: freeze-the-sim-to-ab-a-light
description: "A lighting A/B is only valid with the camera still — reload, fly a fixed duration, KeyP to freeze, tap"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 7aa100d3-c5f2-4a6c-9ef2-f3ff1d699435
  modified: 2026-09-23T03:50:04.838Z
---

`KeyP` toggles `simFreeze` (`apps/client/app/dev/sim-freeze.ts`); `LocalLoop` skips the sim but
still runs `updateChaseCamera`, so the frame holds. That is what makes an A/B of two lighting
values comparable.

**Why:** the previous session's fog probe concluded fog was innocent because the ship had drifted
between the two frames. Two frames from different camera positions cannot be differenced.

**How to apply:** drive a headless Chrome over CDP (`/json/list` → `Runtime.evaluate` over the
native `WebSocket` in node 24). Set the override with
`localStorage.setItem('slur.tuning.v1', ...)` — entries are `{value, from}` and `restore()` drops
one whose `from` no longer matches the schema default — then `location.reload()`, hold `KeyW` for a
fixed duration, `KeyP`, tap. Input is read from `e.code`, so a synthetic
`new KeyboardEvent('keydown', {code:'KeyW'})` works. The same duration lands the same frame to
within a level. Verify the framing, not just the numbers: a crash mid-flight moves everything.
Related: [[headless-chrome-for-frame-taps]], [[eyeballing-a-tap-lies-about-brightness]].
