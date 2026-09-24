---
name: pacing-grid-ignores-ship-length
description: "A z-slit shorter than a ship is no exit. Pacing grids grow blocks by the hull's halfL in z (contract 3u, per class its own); confirm pockets with simulate()"
metadata:
  node_type: memory
  type: project
  originSessionId: a42d7260-7d77-4e58-93e1-2b90e521bca9
  modified: 2026-09-24T08:17:49.928Z
---

The `/pacing` grid (`packages/shared/src/pacing/grid.ts` `blockedAt`) grows each block by the hull's
`halfW` in x and `halfL` in z. Until `1e7160c` the contract hull had `halfL: 0`, so the ship was a
point in z, and a gap between two blocks shorter than the ship (for example 2u) counted as a way out.
The owner ruled on 2026-09-24 that the contract hull is as long as the Freighter (6u, `PACING_HULL_L = 3`).
Class hulls (`classHull`) always used each ship's own `halfL`.

Incident (2026-09-24): the owner saw a trapped pocket on seed 20260921 at z 1200–1278 that the first
reachability probe missed. In `simulate()`, the freighter (6u long) gets out only if it stops inside a
1.3u window, and the phantom (5u) inside 2.3u. Short ships get out. Under the owner's rule (trapped =
window shorter than the ship's own length) both are trapped.

**Why:** there is no reverse gear. A pocket a ship cannot leave blocks it for good, and the owner
ruled dead ends not allowed.

**How to apply:** any new grid or threadability check must take a hull with a real `halfL`, never 0.
Confirm each candidate with a `simulate()` escape sweep: stop, strafe to the exit, throttle, and sweep
the stop z. The ship can brake to vz 0 (`step.ts` brake clamps at 0), so entering too fast is not a
trap. A longer hull can also expose rules that look only straight ahead: see the seed 42 z 1800 case in
`1e7160c`. Related: [[a-sweep-that-hits-its-bound-fakes-a-reading]].
