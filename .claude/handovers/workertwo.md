Agent: workertwo · Lane: #298 pickup grab box · Updated: 2026-09-26

Older versions hold #290 and earlier (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

- #298: a pickup is grabbed when the ship's hull overlaps a grab box, and `pickupGrabR` is a SimConfig dial
  that can be tuned live on /test-level.

## Done

- GDD §5.3 "Grab (#298, built)" block `4830bee`.
- Code `01f290b`: `grabPickup( hull, pickup, cfg )` checks `|dx| < grabR + halfW` and `|dz| < grabR + halfL`.
  `PICKUP_GRAB_R` = 3.2 (combat/constants.ts), `SimConfig.pickupGrabR`, `Grabber` = Gunner + shipId
  (only stepPickups uses it), `RunSimOptions.config`, the `Pickup.grabR` dial, and
  routes/test-level/tuned-sim-config.ts (a getter config passed by test-level-room.ts).
- Filed #299: the `Seeker.flyY` dial is not wired to the sim (supervisor asked for the issue).

## State

- Shared 481/481, server 40/40, client 441/441, typecheck 0, lint 0 errors [measured, at 01f290b].
- Pickup body spin radii (tsx over the client builders): 1.15–1.50u, seeker 2.21u; pool 3.2u [measured].
- Grab starts 4.2–4.5u off centre by class, was 3.0u [derived from code, NOT measured live].
- Client prediction does not evaluate pickups (stepPickups runs only in RunSim) [verified by grep].
- /test-level live check NOT done yet.

## Uncommitted

None.

## Held files

- The #298 files (01f290b) until #298 closes. docs/GDD.md is released to workerfour.

## Next

1. /test-level live check (owner rule). Use headless Chrome with DPR 1 and `--mute-audio`, and kill it after.
   Fly past a pickup at x offsets 3.0 / 3.5 / 4.0 / 4.3 / 4.6 / 5.0 from its centre. Use the
   `place-the-ship-over-cdp` memory, or stage on `room.sim.state`. Record the offset where the grab starts.
   For "before", set the dial `Pickup.grabR` to `3 - halfW`, or reason from the code: the old test used
   the centre and 3u.
2. Check that moving the dial changes the grab live (the getter reads `num()` every tick).
3. `gh issue close 298 -c "<summary + 4830bee, 01f290b + measured offsets>"`, then report to slur-supervisor.

## Open questions

- None.

## Lessons → memory

- none (a new file needs `git add <path>` before a pathspec commit; that is already standard git)
