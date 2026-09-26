Agent: workertwo · Lane: #290 tug line · Updated: 2026-09-26

Older versions hold #283 and earlier (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

- #290 tug line. The line latches onto a rival, or onto the nearest block ahead (the grapple is folded
  in). Forward on a rival: catapult the firer and slow the target. Back on a rival: tow the chaser
  forward and degrade its strafe and jump. It replaces the GDD §5.7 Tractor beam.

## Done

- S1 sim core `403f8de` (pushed): combat/tug.ts, combat/tug-constants.ts, sim/tug-status.ts, their
  tests, 4 predicted SimShip fields (tugTimer, slowTimer, towTimer, tugAnchorZ) appended to PlayerState.

## State

- Owner answers: Q1 back = pull the chaser forward and degrade its controls (dials `towStrafeScale`
  0.3 and `towJump` false) · Q2 reuse existing sfx · Q3 values OK · Q4 back with no rival = no fire ·
  Q5 block reel along z only.
- After 403f8de: typecheck 0, lint 0, shared 459/459, server 38/38, client 437/437 [measured].
- simulate() now ticks stun/boost/tug through `tickStatus`, and death/respawn call `clearStatus`
  (sim/tug-status.ts). step.ts is at Biome's 300-line cap.

## Uncommitted

None.

## Held files

None. The S2 claim was sent to the supervisor; those files are shared with workerfour's portal lane.

## Next

1. Wait for the S2 clear and the owner's call on the bag share (proposal: tug 2/20, bolt 5→4, mine 4→3).
2. S2: HeldPower.tug, tugRatio in the bag, `fireTug` in run/combat.ts (lock before spend, shield
   absorbs slow/tow, broadcast TUG_MESSAGE), tests incl. server run-room.
3. S3: client TugLine VFX, tug pickup body, HUD label, reuse of existing sfx, the `slowed` interp flag.
4. S4: GDD §5.3 / §5.7 (Tractor and Grapple → tug line), verify on /test-level, then close #290 with
   the SHA.

## Open questions

- Bag share (above), for the owner.

## Lessons → memory

- none
