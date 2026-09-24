Agent: workerone · Lane: pacing step 2a — branching, R1 + R2 (no issue; owner waived) · Updated: 2026-09-24

The step-1 pacing state is in the version of this file before 383b1d4. The #241 finish-fade state is at 383b1d4.

## Goal

Build R1 and R2 from the branching RFC (shared pacing only; no client):
- **R1:** viable set, route graph, fork list, and dead-end pockets per ship class.
- **R2:** per-arm demand and gaps; the easiest and hardest routes.

## Done

- `f3febc1`: RFC handover. The RFC is `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/a42d7260-7d77-4e58-93e1-2b90e521bca9/scratchpad/rfc-pacing-branching.md`. **Read it first**, especially §3, §5 and §8.
- Pocket investigation: the owner's pocket is found and measured (State below). Scratch scripts are in the same scratchpad:
  - `branches.mjs` / `branches2.mjs`: viable set, route graph, splits.
  - `pockets.mjs`: enclosure test. It misses the owner's pocket because the grid treats the ship as a point in z.
  - `pocket-sim.mjs` / `pocket-sweep.mjs`: `simulate()` escape sweep.
  - All of them import `packages/shared/dist`.

## Owner rulings (2026-09-24, relayed by slur-supervisor)

- **Q1:** a fork needs both arms ≥ 25u (the reaction distance) and at least one hull apart. Anything shorter is a dodge.
- **Q2:** difficulty binds the EASIEST route. Forks add optional difficulty above that floor.
- **Q3:** a fractured block counts as a WALL for viability (a route must exist without spending a bolt). It is ALSO shown as a conditional arm.
- **Q4:** one graph per ship class for dead ends. The contract hull stays the fairness floor for the route graph.
- **Q5:** dead ends are NOT allowed (there is no reverse). R1 does four things:
  - Grow each block by `halfW` in x and `halfL` in z, per class.
  - List every pocket: entrance z, size, trapped classes.
  - Confirm each pocket with a `simulate()` escape sweep.
  - Use seed 20260921 z 1200–1278 as the regression fixture.
- R1 + R2 are APPROVED. R3 (board) waits until workertwo releases `apps/client/app/routes/pacing/*`.

## State

- **Branching probe** (seeds 20260921, 1, 42, 7, 99991; contract hull; point ship in z):
  - 111–150 splits per seed; about 1e29–1e39 routes.
  - 30–36% of the track has ≥ 2 corridors, max 4–5.
  - About 10–17 splits have both arms ≥ 25u (lower bound).
  - The probe runs in 30–82 ms.
- **Board time is linear:** t = z / 55 (`board-scale.ts` `linePoints`). The plot draws y = −x, so +x is at the top of the strip.
- **Regression pocket, seed 20260921** (x range · z range):
  - A: 20.7–29.9 · 1200.0–1217.7
  - B: 21.7–28.1 · 1225.1–1238.3
  - C: 9.3–14.5 · 1220.3–1234.0
  - D: 16.0–27.7 · 1240.3–1254.7
  - E: 2.5–12.2 · 1241.5–1257.3
  - F: 1.6–6.1 · 1262.7–1278.3
  - The pocket is x ≈ 14.5–21.7, z ≈ 1225–1240.
  - Left exit: 3.8u wide between E and D. It must be reached in the 6.3u of z between C's end and D's start.
  - Right exit: a 2u z-slit between B and D. Every class is stuck there (21–24 bounces).
- **`simulate()` escape sweep** (stop at x 18, strafe to x 13.6–14.6, throttle; stop z swept over 1234–1240 in 0.1u steps). The stop-z window that gives a clean escape:

  | Class | Length | Window |
  |---|---|---|
  | comet | 1.18u | 1234.6–1239.6 |
  | interceptor | 1.84u | 1234.9–1239.3 |
  | fighter | 2.52u | 1235.3–1239.0 |
  | phantom | 5.02u | 1236.5–1237.7 (1.2u) |
  | freighter | 6.0u | 1237.0–1237.2 (0.2u) |

- R1 needs a threshold for "trapped" in the sweep: an escape window narrower than X u. The owner has not set X. Propose one, for example: shorter than the distance covered in the 0.45s reaction window at a crawl.
- The grid's air rule (air run per column ≤ double-jump distance) wrongly treats long lengthwise cracks as walls. Example: the fake pocket at z 800–831 on 20260921. R1 needs a crossing-time rule for sideways crack crossings. [inferred, not simulated]

## Uncommitted

None.

## Held files

None yet. Claim on resume (RFC §8), R1 + R2:
- new `packages/shared/src/pacing/route-graph.ts` + test
- new `packages/shared/src/pacing/arms.ts` + test
- `packages/shared/src/pacing/analyze.ts`
- `packages/shared/src/pacing/jump-window.ts`
- `packages/shared/src/pacing/grid.ts` (per-class dilation)
- one export line in `packages/shared/src/index.ts`

## Next

1. Send the claim list above to slur-supervisor and wait for "clear".
2. **R1.**
   - Per-class grid: grow blocks by halfW in x and halfL in z (fractured blocks = walls), plus the crossing-time rule for cracks.
   - Viable set (forward ∩ backward, strafe clamp) on the contract hull, then the route graph, then the fork list: arms ≥ 25u and ≥ 1 hull apart, else a dodge. Split each corridor by mode (ground / air), and mark fractured-block arms as conditional.
   - Per-class pocket list (enclosure test: brake to 0 allowed, no reverse), each confirmed by the `simulate()` escape sweep.
   - Fixture test: seed 20260921, z 1200–1278. It traps the freighter and phantom, and not the comet.
   - Also a small hand-built fork fixture.
   - Memoise the track in tests (see memory `procgen-segmentat-is-uncached`).
3. **R2.**
   - Run the existing Viterbi inside each arm's mask, then `measureDemand` on each arm.
   - Find the easiest and hardest routes with a DP over forks. Measure quiet time on those named routes.
   - Gaps: forced (every corridor is air) vs optional (per arm), with takeoff windows per arm.
4. Commit per step by explicit pathspec. Run shared tests, `pnpm typecheck` and biome on my paths. Report SHAs.

## Open questions

- The "trapped" threshold for the escape sweep (see State).
- Should dead-end pockets fail the generator, or be removed by regenerating the segment? R1 only reports them. The fix is the generator's lane.

## Lessons → memory

`.claude/memory/pacing-grid-ignores-ship-length.md`
