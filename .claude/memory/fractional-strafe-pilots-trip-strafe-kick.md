---
name: fractional-strafe-pilots-trip-strafe-kick
description: A sim pilot with a proportional (fractional) strafe command overshoots under the strafe kick; reuse the kick-aware strafeToward exported from pacing/pockets.ts
metadata:
  node_type: memory
  type: project
  originSessionId: 8440309d-cf86-4842-a08b-26f7235f48f1
  modified: 2026-09-25T03:25:01.724Z
---

The strafe kick (#256, `0c904de`) is in `applyStrafe` in `step.ts`. When `strafeKick > 0`, any nonzero strafe
sets `vx` to at least `strafeKick × strafe` in the press direction (26–40 u/s per class). A pilot that sends
small fractional strafes every tick (`strafe = clamp((want − vx)/(strafeAccel·dt·3))`) then overshoots and
oscillates. Before the fix, pocket escape sweeps read window 0, and groove seed 13 wedged the freighter at
z 280 with 314 bumps.

The fix is `strafeToward` in `packages/shared/src/pacing/pockets.ts` (exported). It scales `s` to `goal/kick`
when the kick would pass the pilot's own ramp goal, and it releases (`s = 0`) when the goal is still on the
old side of zero. `groove.test.ts` imports it.

**Why:** a new pilot copied from the old profile reads "trapped" or "wedged" for a pilot reason, not a
track reason.

**How to apply:** a new sim pilot imports `strafeToward` from `pacing/pockets.ts`. Do not write a new
proportional profile. Keep `strafeKick` gated on `> 0`: the ungated form snapped `vx` to −0 on a reverse
press, and that moved the contract ship's `NOTE_MOVE_S`. Related: [[test-your-lane-against-head]],
[[escape-sweep-pilot-must-stop]].
