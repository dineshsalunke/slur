---
name: pacing-grid-ignores-ship-length
description: "The pacing grid treats the ship as a point in z and a 4u hull in x, so a z-slit shorter than a ship reads as an exit; confirm pockets with simulate()"
metadata:
  node_type: memory
  type: project
  originSessionId: a42d7260-7d77-4e58-93e1-2b90e521bca9
  modified: 2026-09-24T07:19:32.902Z
---

The `/pacing` grid (`packages/shared/src/pacing/grid.ts` `blockedAt`) widens blocks by `PACING_HULL` in x only. In z the ship is a point. So a gap between two blocks that is shorter than the ship (for example 2u) counts as a way out on the grid, but no real ship can use it.

Incident (2026-09-24): the owner saw a trapped pocket on seed 20260921 at z 1200–1278 that the first reachability probe missed. In `simulate()`, the freighter (6u long) gets out only if it stops inside a 0.2u window, and the phantom (5u) inside 1.2u. Short ships get out.

**Why:** there is no reverse gear. A pocket a ship cannot leave blocks it for good, and the owner ruled dead ends not allowed.

**How to apply:** for dead-end and threadability checks, grow each block by `halfW` in x AND `halfL` in z for each ship class (`SHIP_CLASSES` in `ship-classes.ts`). Confirm each candidate with a `simulate()` escape sweep: stop, strafe to the exit, throttle, and sweep the stop z. The ship can brake to vz 0 (`step.ts` brake clamps at 0), so entering too fast is not a trap. Related: [[a-sweep-that-hits-its-bound-fakes-a-reading]].
