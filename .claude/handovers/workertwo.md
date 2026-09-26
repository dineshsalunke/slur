Agent: workertwo · Lane: #298 pickup grab box (closed) · Updated: 2026-09-26

Older versions hold #290 and earlier (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

- #298: a pickup is grabbed when the ship's hull overlaps a grab box, and `pickupGrabR` is a SimConfig dial
  that can be tuned live on /test-level. Done and closed.

## Done

- GDD §5.3 "Grab (#298, built)" block `4830bee`.
- Code `01f290b`: `grabPickup( hull, pickup, cfg )`, `PICKUP_GRAB_R` 3.2, `SimConfig.pickupGrabR`,
  the `Pickup.grabR` dial, routes/test-level/tuned-sim-config.ts.
- Filed #299: the `Seeker.flyY` dial is not wired to the sim.
- /test-level live check done; #298 closed with the table below.

## State

- /test-level ship is split-crown (halfW 1.25) [measured].
- Static staging at the pickup z: grabR 3.2 grabs to dx 4.4, misses from 4.5 (edge 4.45) [measured].
- Before-equivalent grabR 1.75: grabs at 3.0 (float edge), misses from 3.5 [measured].
- Fly-through with W: 4.3 grabs, 4.6 and 5.0 miss [measured].
- Live `setNum('Pickup.grabR', 3.2)` with no reload changed `sim.config.pickupGrabR` and the grab result [measured].
- Driver: scratchpad `grab-check.mjs` (session f536985d). Headless Chrome closed.

## Uncommitted

None.

## Held files

None. The #298 files are released.

## Next

1. Wait for the next lane from slur-supervisor.

## Open questions

- None.

## Lessons → memory

- none
