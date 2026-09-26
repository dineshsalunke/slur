Agent: workerfour · Lane: pickup spread (#265, closed) · Updated: 2026-09-26

## Goal

Space pickups apart, spread them across the deck and stop long same-power runs. Deterministic on both ends.

## Done

- `2ce75a4` (pushed): #265. New `sim/pickup-place.ts` (rows 120–180u, slide ≤3 rows, lane pick ±40u within 40u swing, clear-column test) and `combat/power-bag.ts` (20-bag 8/6/6, run cap 2 incl. seams). Ids `${ordinal}.${salt}` on groove and weave. SEEKER_RATIO = MINE_RATIO = 0.3. ADR-002 amendment + GDD §5.3. #265 closed with the table.
- `1199218` (pushed): #268 solid rear-view mirror.

## State

- 30 seeds: groove 52.8 pickups/track, gaps 120/140/180u, runs ≥3: 0, longest 2, blocked columns 0. Weave 51.6, gaps 120/160/240u, runs ≥3: 0, blocked 0, 29/1549 swings over 40u.
- Gates at 2ce75a4: shared 386/386, server 25/25, client 391/391, typecheck clean, biome clean on my files (track.test.ts line-count warning existed before), comment ratchet OK.
- Strafe reach: every class crosses 80u in ≤0.83 s. That comes from a model of the step.ts strafe rules [not a full simulate() run].
- The owner must restart `pnpm dev`: shared changed and the pickup ids on the wire changed.

## Uncommitted

- none.

## Held files

- none.

## Next

1. #268 follow-up: remove the dead `RearView.featherX/Y` (dev/tuning-schema.ts:139-140) after workerone commits that file.
2. Wait for the supervisor.

## Open questions

- none.

## Lessons → memory

none
