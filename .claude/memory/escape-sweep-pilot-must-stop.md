---
name: escape-sweep-pilot-must-stop
description: A simulate() escape sweep lies if its strafe pilot overshoots or it tries only one exit; use a stoppable speed profile and sweep every door
metadata:
  node_type: memory
  type: feedback
  originSessionId: 70948c15-3803-48b3-a732-0eba28c04fc3
  modified: 2026-09-24T07:39:05.523Z
---

A `simulate()` pocket-escape sweep reads "trapped" for the wrong reason in two ways:

1. **PD pilot overshoot.** `strafe = err*2 - vx*0.1` reaches 55u/s on a 12u strafe, flies past x 32 off the
   deck, dies and respawns. Every long strafe fails, so even the comet reads trapped. Use a stoppable profile:
   `want = sign(err)·min(strafeClamp, √(strafeAccel·|err|))`, `strafe = clamp((want − vx)/(strafeAccel·dt·3))`.
   With it, stop windows match the geometry `gap − 2·halfL` to 0.1u (seed 20260921, z 1216–1240, 2026-09-24).
2. **One exit only.** The first fixture sweep tried only the left exit and called the phantom trapped. A right
   exit gave it a 2.3u window. Find every door from the grid, then sweep each one.

Also: count only stops after the ship has committed. A slot margin starts the pocket early, and turn-outs
before the entrance are not escapes.

**Why:** both errors report a trap that does not exist, and a fixture then encodes the error.
**How to apply:** any sim sweep that decides whether a ship can escape. See `pockets.ts`
`squeezesThrough`. Related: [[pacing-grid-ignores-ship-length]], [[a-sweep-that-hits-its-bound-fakes-a-reading]].
