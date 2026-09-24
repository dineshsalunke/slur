Agent: workerone · Lane: pacing step 2a — branching, R1 + R2 (no issue; owner waived) · Updated: 2026-09-24

The RFC is `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/a42d7260-7d77-4e58-93e1-2b90e521bca9/scratchpad/rfc-pacing-branching.md` (§3, §5, §8). The previous version of this file (d520f36) holds the owner rulings Q1–Q5 in full.

## Goal

- **R1 (done):** viable set, route graph, fork list, and per-class dead-end pockets.
- **R2 (next):** per-arm demand and gaps; the easiest and hardest routes.

## Done

- `2812078` feat(pacing): R1.
  - `grid.ts`: `PacingHull` (`halfW`/`halfL` grow blocks; `footW`/`footL` = the sim's landing footprint; `solid` kinds). `CONTRACT_HULL` gives the old grid exactly. `classHull(t, slot)`.
  - `viable.ts`: `legalMask` (column air run OR sideways crossing rows ≤ double jump), `viableCells`, `regionsOf`, `anyNear`.
  - `route-graph.ts`: `routeNodes` (runs split by ground/air), post-dominator merges, `routeForks` (fork iff length ≥ `FORK_MIN_ARM_U` 24.75u AND separation ≥ 4u, else dodge), conditional regions (fractured blocks removed), `analyzeRoutes`.
  - `pockets.ts`: `classPockets`, `rosterPockets`, `groupPockets`, `squeezesThrough`, `POCKET_SLOT_MIN_U = 2`.
  - `analyze.ts`: `analyzeDescriptor( d, { routes?, pockets? } )`. Both default off, so `/pacing` is unchanged.
  - Tests: `route-graph.test.ts` (dodge vs fork, conditional, crack, seed threads), `pockets.test.ts` (closed corridor traps all, a 20u side slot frees all, fixture).

## State

- Shared tests 245/245 pass. `pnpm typecheck` passes. Biome is clean on my paths. The comment ratchet is clean.
- **Pocket model:**
  - Slot grid = blocks grown by `halfL + 1u` in z; brake-to-0 lets a ship spread across its ground run. Dead = fwd ∧ ¬bwd.
  - Doors = physical-grid cells in the pocket's run that turn slot-backward-reachable within 2 rows.
  - Sweep = stop at z, strafe to the door, pass iff no stun. The sweep counts only stops after the entrance margin.
- **Pilot verified** (sim vs geometry `gap − 2·halfL`, match to 0.1u): fixture right exit comet 6.1 · interceptor 5.5 · fighter 4.7 · phantom 2.3 · freighter 1.3; left exit 5.0 / 4.4 / 3.7 / 1.2 / 0.2.
- **Fixture result at X = 2u:** only the freighter is trapped (window 1.3u). The phantom is NOT trapped: its right exit (A ends 1217.7, B starts 1225.1) gives 2.3u. The old handover's "phantom trapped" came from a left-exit-only sweep.
- **Seed 20260921, trapped pockets:** interceptor 20/22 · fighter 27/30 · comet 13/19 · phantom 32/39 · freighter 44/53. Each class takes 100–130 ms. The slot grid only finds pockets with a physical window of about 2u or less, so X decides the count. I inspected one comet case at z 2106: a real 3.2u z-slot. [others not inspected]
- **Route graph, seed 20260921:** 2627 nodes, 176 splits, 19 forks, 93 mode-splits (air sub-run flicker; noisy), 64 conditional regions. `analyzeRoutes` takes 168 ms, above the RFC probe's 30–82 ms, because it also builds the conditional grid.
- The contract hull still has `halfL = 0` and a point footprint. Per Q4 the route graph stays on it.

## Uncommitted

None (the handover and memory commit follows this file).

## Held files

`packages/shared/src/pacing/{grid,viable,route-graph,pockets,analyze}.ts` + tests, and the 3 export lines in `packages/shared/src/index.ts`. **R2 also needs `reference-path.ts`** (a mask parameter for Viterbi per arm). Claim it first.

## Next

1. Claim `reference-path.ts` and `arms.ts` (+ test) with slur-supervisor.
2. **R2.**
   - Add an optional cell mask to `referencePath`. Run it per fork arm: the mask is the arm's node intervals plus the trunk; run `measureDemand` on each.
   - Easiest and hardest routes: a DP over forks. Quiet time only on those named routes.
   - Gaps: forced (every corridor at that z is air) vs optional (per arm); takeoff windows per arm lip.
3. Optional: fold the mode-split flicker (short air sub-runs) before R3 uses the fork list.

## Open questions

- **Owner: threshold X for "trapped".** It is `POCKET_SLOT_MIN_U = 2u` today. At 2u the fixture traps the freighter only. At "window < ship length" it traps the phantom and the freighter and frees the rest; this matches the old fixture claim. X also sets the slot-grid margin.
- **Owner:** should dead-end pockets fail the generator, or be removed by regenerating the segment? R1 only reports them.
- **Owner:** should the contract hull get a z-length (max `halfL` = 3u) for the route graph? It is 0 now, the old behaviour.
- A doorless pocket (no physical exit) reports window 0 without a sim run; the grid is the evidence.

## Lessons → memory

`.claude/memory/escape-sweep-pilot-must-stop.md`
