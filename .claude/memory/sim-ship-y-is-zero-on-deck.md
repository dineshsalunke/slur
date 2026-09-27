---
name: sim-ship-y-is-zero-on-deck
description: "A grounded ship has sim y 0; the 0.35–1.25u ride height is a client-only hover, so any height test in shared code needs its own offset"
metadata:
  node_type: memory
  type: project
  originSessionId: 438be093-7301-418a-bce0-2c050a45cb67
  modified: 2026-09-27T16:03:55.761Z
---

A grounded ship has `s.y = 0` in the sim (`packages/shared/src/sim/step.ts`, `DECK_Y = 0`). The height
you see (0.35u at rest to 1.25u at top cruise) is added only on the client by `ecs/hover.ts`
(`Hover.base` 0.35 + `Hover.speedLift` 0.9 in `dev/tuning-schema.ts`). The server never knows it.

**Why:** in #325 (2026-09-27) the portal catch became a circle centred 3u up with radius 3. Tested at
sim y, a grounded ship sits exactly on the circle's bottom and never hops. The fix was `portalRideY`
(0.8u, the middle of the hover) added to `s.y` before the test.

**How to apply:** any shared test against drawn geometry that has a height (rings, arches, overhead
bars) must add a ride offset to `s.y`. Docs that say "ships ride 0.35–1.25u" describe the render, not
the sim.
