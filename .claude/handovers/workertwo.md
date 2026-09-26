Agent: workertwo · Lane: #290 tug line (planning) · Updated: 2026-09-26

Older versions hold #283 and earlier (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

- #290 tug line: an elastic line that latches onto a rival (or a block ahead, which folds in the grapple).
  It catapults the firer and slows the target. It replaces the GDD §5.7 Tractor beam.

## Done

- Plan and addendum sent to slur-supervisor (2026-09-26). Nothing built yet.

## State

- Plan: new SimShip fields `tugTimer`, `slowTimer` and `tugAnchorZ` (predicted through `copySimShip`),
  a `tug` message with the outcomes latch/anchor/none, 4 slices (S1 sim · S2 shared dispatch/mix ·
  S3 client VFX · S4 docs + live check).
- The client prediction copies every key in `SIM_SHIP_KEYS` (apps/client/app/net/prediction.ts:20)
  [measured].

## Uncommitted

None.

## Held files

None. Files are claimed per slice after the owner approves.

## Next

1. Wait for the owner's approval and answers to Q1–Q5 through the supervisor.
2. Claim the S1 files, then build S1.

## Open questions

- Q1 back effect on a rival (a slow / b lateral yank / c pull forward) · Q2 audio assets ·
  Q3 start values · Q4 back fire with no rival = no fire? · Q5 block reel along z only?

## Lessons → memory

- none
