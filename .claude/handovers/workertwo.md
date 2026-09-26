Agent: workertwo · Lane: #290 tug line (done) · Updated: 2026-09-26

Older versions hold #283 and earlier (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

- #290 tug line. It replaces the GDD §5.7 Tractor beam and folds in the Grapple. Lane finished.

## Done

- S1 sim core `403f8de`.
- S2 bag + fire path `72eafc0`.
- S3 client `86060aa`: beam VFX, pickup, HUD gem, audio, TUG_RATIO 0.1, MINE_RATIO 0.15.
- S4 GDD `387302c`: §5.3 table row + "Tug line (#290, built)" rules block; bag counts 4/3/3/3/3/2/2;
  Mine 3 of 20 (0.15); §5.7 Tractor row → Tug line; Grapple row → folded into the tug line.

## State

- Owner-final bag: bolt 4 · seeker 3 · mine 3 · boost 3 · shield 3 · portal 2 · tug 2 [measured, test].
- After 86060aa: typecheck 0, lint 0, shared 479/479, server 40/40, client 441/441 [measured].
- GDD numbers read from `packages/shared/src/combat/tug-constants.ts` and `sim/tug-status.ts` this seam.
- `docs/archive/superseded-design.md` has no PRECEDED entry for the Tractor "momentum leech" [not done;
  file not claimed].

## Uncommitted

None.

## Held files

None.

## Next

1. Close #290 with 403f8de, 72eafc0, 86060aa, 387302c.
2. Wait for the next lane from the supervisor.

## Open questions

- Supervisor: add a PRECEDED entry for the Tractor beam to `docs/archive/superseded-design.md`?

## Lessons → memory

- none
