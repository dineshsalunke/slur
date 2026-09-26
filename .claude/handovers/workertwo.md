Agent: workertwo · Lane: #290 tug line · Updated: 2026-09-26

Older versions hold #283 and earlier (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

- #290 tug line. The line latches onto a rival, or onto the nearest block ahead (the grapple is folded
  in). Forward on a rival: catapult the firer and slow the target. Back on a rival: tow the chaser
  forward and degrade its strafe and jump. It replaces the GDD §5.7 Tractor beam.

## Done

- S1 sim core `403f8de` (pushed): combat/tug.ts, combat/tug-constants.ts, sim/tug-status.ts, their
  tests, 4 predicted SimShip fields (tugTimer, slowTimer, towTimer, tugAnchorZ) appended to PlayerState.
- S2 bag + fire path `72eafc0` (pushed): HeldPower.tug = 8; `tugRatio` dial (TUG_RATIO) after portal in
  bagCounts and in the powerBag cache key; run/tug-run.ts `fireTug` dispatched from firePower before the
  spend; tests run/tug-run.test.ts, server rooms/room-tug.test.ts.

## State

- Owner answers: Q1 back = pull the chaser forward and degrade its controls (dials `towStrafeScale`
  0.3 and `towJump` false) · Q2 reuse existing sfx · Q3 values OK · Q4 back with no rival = no fire ·
  Q5 block reel along z only.
- TUG_RATIO ships at 0, not 0.1. At 0.1 the client test `seeker-pickups.test.ts` failed: tug pickups fall
  into the bolt bucket (`bucketOf` default) and the HUD LABEL has no tug entry. Same precedent as portal.
  S3 flips it to 0.1. Bag test proves portal 0.1 + tug 0.1 → bolt 3 · seeker 3 · mine 4 · boost 3 ·
  shield 3 · portal 2 · tug 2.
- At that mix bolt (3) is no longer the dominant power; mine (4) is, so seamSafe keys on mine. The
  proposal cut mine 4→3 to keep bolt 4 on top. Owner has not confirmed the mix.
- Shield absorbs the victim's slow/tow; the firer still catapults on a forward latch.
- After 72eafc0: typecheck 0, lint 0, shared 479/479, server 40/40, client 437/437 [measured].

## Uncommitted

None.

## Held files

None. S2 files released.

## Next

1. Wait for the supervisor's S3 clear.
2. S3: client TugLine VFX on TUG_MESSAGE, tug pickup body + `bucketOf` case, HUD LABEL + power-gem,
   reuse of existing sfx, the `slowed` interp flag; flip TUG_RATIO to 0.1.
3. S4: GDD §5.3 / §5.7 (Tractor and Grapple → tug line), verify on /test-level, then close #290 with
   the SHA.

## Open questions

- Final bag mix (mine 4→3 or not), for the owner.

## Lessons → memory

- none
