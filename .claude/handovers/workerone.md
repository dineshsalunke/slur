Agent: workerone · Lane: pacing step 2a — branching, R1 + R2 (no issue; owner waived) · Updated: 2026-09-24

The RFC is `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/a42d7260-7d77-4e58-93e1-2b90e521bca9/scratchpad/rfc-pacing-branching.md` (§3, §5, §8). The d520f36 version of this file holds the owner rulings Q1–Q5.

## Goal

- R1 (done) and R2 (done). The next step is R3 (the board), after workertwo releases `routes/pacing/*`, or R4 (the phrase-model RFC).

## Done

- `2812078` feat(pacing): R1. It adds the viable set, the route graph, forks and per-class pockets. See the 5ce11ff version of this file for details.
- `6e67f53` feat(pacing): R2.
  - `reference-path.ts`: `scopedPath( grid, cruise, air, { starts, mask?, k0?, k1? } )` returns `{ path, k0, cost, barred }`. It adds `PATH_BARRED_COST = 1000`, which is below `PATH_STUCK_COST`. `stuck` now flags physical cells only. `referencePath` has the same signature and gives the same output.
  - `jump-window.ts`: now exports `PacingHole` (was `Hole`), `holeAt`, `blockFree`, `measureHole` and `HoleMeasure`.
  - `arms.ts`: `analyzeArms( frozen, grid, routes, path, tuning, cruise )` → `{ forks: ForkArms[], easiest, hardest }`.
    - Per arm: a masked Viterbi over the window from the split's last row to the merge's first row, with a free start. It gives lateral, reversals, peakStrafe, jumps, air, cost, hardCost, dominated and gaps.
    - The per-arm gaps give `forced` (every viable cell in some row is air) and the takeoff windows on that arm's column. They are cached by hole.
    - The easiest route is the reference path.
    - The hardest route: forks are decided inner-first by length, by argmax hardCost. The non-chosen arms are barred. Then one full-track solve runs.
    - `choice[i]` is the arm the path actually took, or -1 when the path bypasses the fork.
  - `analyze.ts`: `{ arms: true }` also builds the routes. The default is off, so `/pacing` is unchanged.
  - `arms.test.ts`: mirror arms, weave → hard arm, one-arm hole → optional gap, seed threads.

## State

- Shared tests 249/249 pass. `pnpm typecheck` passes. Biome is clean on my paths. The comment ratchet is clean.
- Arms cost: +154 ms (seed 20260921), +227 ms (seed 1), +142 ms (seed 42) on top of routes at about 240–300 ms.
- **Seed 20260921:** 19 forks, 14 arms dominated.
  - Easiest route: lateral 292u, 26 reversals, 12 jumps, quiet ≥2s total 99.0s.
  - Hardest route: lateral 637u, 32 reversals, 11 jumps, quiet ≥2s total 86.8s. 0 stuck, 59 barred cells: 2 of 19 hard picks conflict.
- **Seed 1:** hardest lateral 685u vs easiest 259u. **Seed 42:** 528u vs 239u. **Seeds 1, 42, 7, 99991:** 0 barred.
- Arm gaps on the seeds: 4–5 per seed, 2–4 of them forced. There are few optional gaps, because the mode-splits are mostly dodge-length and are not 'fork' kind.
- `dominated` compares the five metrics only. Pickups and time are not in it; every arm spans the same z. So "harder on every axis" = dominated.
- Many forks have two cost-0 arms (straight lanes). On a tie, arm 0 is both easiest and hardest.

## Uncommitted

None. (The handover and memory commit follows this file.)

## Held files

`packages/shared/src/pacing/{grid,viable,route-graph,pockets,analyze,arms,reference-path,jump-window}.ts` + tests, and the pacing export lines in `packages/shared/src/index.ts`. Release on request.

## Next

1. Report R2 to slur-supervisor. Wait for the owner's steer: R3 (the board) or R4 (the phrase RFC).
2. Optional: fold the mode-split flicker (short air sub-runs). Then optional gaps become visible as mode-forks.
3. Optional: `airRunLengths` is rebuilt for each `scopedPath` call (about 40 per seed). Pass it in if the board needs the time.

## Open questions

- **Owner (still open):** the trap threshold X (`POCKET_SLOT_MIN_U = 2u`). Pocket fail vs regenerate. The contract hull z-length.
- **Owner:** should "hardest" pick by Viterbi cost (lateral + 2·reversal + 4·jump)? That is the choice today. A weighted demand score is the alternative.
- **Owner:** a dominated arm is a trap in this model. Should pickups later count as a reward axis, so that a harder arm with a pickup is not dominated?

## Lessons → memory

`.claude/memory/fork-choices-can-conflict.md`
