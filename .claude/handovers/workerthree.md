Agent: workerthree · Lane: Power bag 6/4/4/3/3 (#269, #270) — DONE · Updated: 2026-09-26 13:30

## Goal

Owner decision: the default power bag is 6 bolt / 4 seeker / 4 mine / 3 boost / 3 shield out of 20.

## Done

- 842fd8c: `SEEKER_RATIO` and `MINE_RATIO` 0.3 → 0.2 in `packages/shared/src/combat/constants.ts`.
  Boost and shield stay 0.15. `power-bag.test.ts` pins the new default; the override case now uses the
  old 0.3/0.3 split (2/6/6/3/3). SHA commented on #269 and #270 (left open for the owner).

- 074ceee: docs to match. `docs/DECISIONS.md` ADR-002 amendment (Power bullet) and `docs/GDD.md`
  "Placement and mix" + "Mine" lines now say 6/4/4/3/3, seeker/mine 0.2, boost/shield 0.15.

## State

- `bagCounts()` = bolt 6, seeker 4, mine 4, boost 3, shield 3 (measured from dist after `tsc -b --force`).
- Dealt bags for salts '', a, groove × bags 0, 7: each 20 long, each 6/4/4/3/3 (measured).
- Tests: shared 408/408, server 52/52, client seeker-pickups + local-combat 16/16 (measured, shared tree
  with other workers' uncommitted files present).

## Uncommitted

None.

## Held files

None (claim released on commit).

## Next

- Idle. Await the next lane.

## Open questions

- Owner: close #269 and #270, or do they cover more than the bag mix?

## Lessons → memory

none
