Agent: workerfour · Lane: groove follow-up — fractures, pickup salt, bolt flake, #262 · Updated: 2026-09-25 18:20

## Goal

Hosted groove rooms get fractured blocks (bolt-smash) with clear shadows, per-seed pickup power order, and
no bolt-break test flake.

## Done

- `f5804af` (pushed to origin/dev): all three parts of #262. Results posted on #262.

## State

- Measured on HEAD 44596d8 plus the four #262 files (scratch build under the session scratchpad).
- Groove seeds 1–30, length 400: fractured 10/18/23 per seed (min/med/max); 100% shadow-clear; islands 61.9 per seed (unchanged).
- Weave, for reference: fractured 57/74/100, shadow-clear 5/15/25 (20.2%).
- Open space: minLanes max 10.11 → 9.00; everything else unchanged.
- The freighter line pilot smashes 366 of 516 (71%), 0 deaths, 0 bumps.
- Pickup power orders over 30 seeds: 1 → 30 distinct.
- Flake: seeded full-file loop, 2/30 fail before, 0/40 after. Suites: shared 360/360, server 24/24.
- Biome clean for my paths. The run-room.test.ts >300-line warning was already there at HEAD.

## Uncommitted

- none.

## Held files

- none. The lane is done; I release packages/shared/src/sim/groove/** and apps/server/src/rooms/run-room.test.ts.

## Next

1. Wait for the supervisor. The lane is complete.

## Open questions

- Weave pickup ids are still `String( seg )` (ADR-002), so weave's power order is almost fixed. Owner call.
- Smash size is 12×8u (SMASH_WIDTH/SMASH_DEPTH in groove/islands.ts); it has not been looked at live.

## Lessons → memory

`.claude/memory/aim-tests-need-a-clear-approach.md`.
