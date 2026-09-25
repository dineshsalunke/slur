Agent: workerfour · Lane: pickup spread (#265) · Updated: 2026-09-25

## Goal

Space pickups further apart and stop long same-power runs (mostly bolts). Deterministic on both ends.

## Done

- Filed #265 with the measurements below.
- Plan sent to slur-supervisor. Nothing built.

## State

- Measured in node on dist, seeds 1–30, length 400. Script: scratchpad `measure-pickups.mjs` (session-local).
- groove: 132 pickups/track, every gap 60u, same-as-previous 0.403 (i.i.d. 0.403), bolt runs ≥3: 285, longest run 12.
- weave: 129.5 pickups/track, 98% of gaps 60u, bolt runs ≥3: 295, longest 7. Same power order on every seed.
- Cause 1: `PICKUP_SPACING = 3` segments (`sim/space.ts:12`) × `SEG_LEN` 20u.
- Cause 2: independent hash draws at 55% bolt. The hash is not correlated.
- Cause 3: weave ids are `String(seg)`, no salt (`sim/track.ts:162`).
- `SimConfig` ratios are never tuned live. Only tests override them.

## Uncommitted

- none.

## Held files

- none yet. Planned: `sim/space.ts`, `sim/track.ts`, `sim/groove/groove-track.ts`, `combat/pickups.ts`, new `combat/power-bag.ts` + test, pickup tests, `docs/GDD.md` pickup text.

## Next

1. Wait for owner approval via the supervisor.
2. Claim files, build, measure after-numbers with the same script.

## Open questions

- Owner: target gap (plan proposes 120–180u, about 52 pickups per track).

## Lessons → memory

none
