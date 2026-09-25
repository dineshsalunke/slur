---
name: fractional-strafe-pilots-trip-strafe-kick
description: A sim pilot with a proportional (fractional) strafe command breaks under the strafe-kick change; every nonzero strafe snaps vx to the kick
metadata:
  node_type: memory
  type: project
  originSessionId: 9da5a971-b8fe-478a-ba18-6b4197d16326
  modified: 2026-09-25T03:20:45.963Z
---

The strafe-kick change (another lane, uncommitted in the tree on 2026-09-25) edits `applyStrafe` in
`step.ts`. Any `input.strafe !== 0` sets `vx` to at least `strafeKick × strafe` (26–40 u/s per class).
Test pilots such as the stoppable profile (`strafe = clamp((want − vx)/(strafeAccel·dt·3))`) send small
fractional strafes every tick. Under the kick they overshoot and oscillate. On groove seed 13, the
freighter wedged at z 280 with 314 bumps. At HEAD without the kick it finished with 1 bump.

**Why:** `groove.test.ts` flyability and the `pockets.ts` escape sweeps use this profile. They will read
"trapped" or "wedged" for a pilot reason, not a track reason, once the kick lands.

**How to apply:** when the kick lands, give such pilots a deadband and whole-key strafes (−1/0/+1), the
way a keyboard does, or model the kick in the stop profile. Measure your own lane at HEAD first
([[test-your-lane-against-head]]). Related: [[escape-sweep-pilot-must-stop]].
