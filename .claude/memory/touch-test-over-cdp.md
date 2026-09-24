---
name: touch-test-over-cdp
description: "Drive the phone touch pad with CDP touch emulation and read the server ship; sample at least 300 ms after a tap, because a +100 ms read can miss it"
metadata:
  node_type: memory
  type: reference
  originSessionId: fe6e4cbb-3541-4448-8924-a01ddb774156
  modified: 2026-09-24T11:37:34.071Z
---

To test the touch pad (#251) in headless Chrome, send `Emulation.setDeviceMetricsOverride` (844×390,
mobile, `screenOrientation: landscapePrimary`) and `Emulation.setTouchEmulationEnabled { enabled: true,
maxTouchPoints: 5 }`. `matchMedia('(pointer: coarse)')` then matches and the `pointer-coarse:` pad shows.
`Input.dispatchTouchEvent` (touchStart/touchEnd with an `id` per finger) reaches React `onPointerDown` as
touch pointer events. Send all fingers still down in each touchStart.

Read the result from the server ship: `(await import('/app/net/session.ts')).session.room.state.players.get(sessionId)`
(`z`, `vz`, `x`, `y`, `jumpsUsed`).

**Why:** on 2026-09-24 a jump tap at rest read y 0 at +100 ms. The same tap read jumpsUsed 1 at +100 ms
on the next run and y 2.18 at +300 ms. The first reading was server-state lag, not a lost tap.

**How to apply:** sample at +300 ms or later before calling an input dropped. A ship steered hard left
from the start line stops at x ≈ 26.4 and z ≈ 120. Test brake while thrust is held (vz 25 → 16 in 0.3 s),
not after that stop. Driver script pattern: [[drive-a-hosted-room-over-cdp]],
[[narrow-headless-captures-need-cdp-viewport]], [[check-the-cdp-port-is-yours]].
