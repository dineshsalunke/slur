Agent: workerone · Lane: pacing step 2a — branching; owner rulings on X and hull (no issue; owner waived) · Updated: 2026-09-24

The RFC is `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/a42d7260-7d77-4e58-93e1-2b90e521bca9/scratchpad/rfc-pacing-branching.md` (§3, §5, §8). The d520f36 version of this file holds the owner rulings Q1–Q5. The 66fefc0 version holds the R2 details.

## Goal

- Apply the owner rulings of 2026-09-24 in `pacing/*`: the X rule and the contract hull z-length (done).
- Held: the generator regenerate step (waits for #244). The R3 board (waits for workertwo's `routes/pacing/*` release).

## Owner rulings (2026-09-24)

- Trapped = the escape stop window is shorter than that ship's own length.
- The contract hull z-length = the Freighter's 6u.
- The hardest route keeps the Viterbi cost.
- Pickups become a reward axis in R4.
- The generator must REGENERATE a segment that has a trap.

## Done

- `2812078` R1 · `6e67f53` R2 (see earlier versions of this file).
- `1e7160c` feat(pacing): trap = window shorter than the ship; 6u contract hull.
  - `pockets.ts`: `pocketSlot( t ) = 2 * t.halfL` replaces `POCKET_SLOT_MIN_U`. It sets the slot hull, the door look-ahead (`scene.ahead`), the committed stop and `trapped`.
  - `grid.ts`: `PACING_HULL_L = SHIP_CLASSES.freighter.tuning.halfL` (3). `CONTRACT_HULL.halfL = 3`. `footL` stays 0.
  - `reference-path.ts`: `PathSolver.legal()` now reads `legalMask` (straight air run OR a strafe across in time). Before, it read the straight air run only. `legalMask` and `crossingRows` moved here from `viable.ts` to avoid an import cycle. The exports through `index.ts` are unchanged, and the `analyzeDescriptor` signature is unchanged.
  - Tests: the fixture now traps the phantom as well. A new grid test pins the 3u reach past each block end.

## State

- All measured on the committed `sim/track.ts`, in a scratch copy (workerthree's #244 edits are uncommitted in the tree).
- Shared tests 251/251 pass there. `pnpm typecheck` passes. Biome is clean on `pacing/`. The comment ratchet is clean.
- In the live tree `sim/pocket.test.ts` fails ("scan found only 348 pockets"). That failure comes from workerthree's uncommitted merge, not from this lane.
- Seed 42 z 1800: the 6u hull made the corridor exit look stuck (3 samples). All five classes fly it in `simulate()` (842–957 of 1350 tries). The solver fix clears it.
- 0 stuck samples on seeds 20260921/1/42/7/99991.
- Trapped pockets before → after (seeds 20260921/1/42/7/99991):
  - freighter 44/29/46/33/34 → 56/45/35/44/47
  - phantom 32/24/43/29/25 → 49/44/39/42/44
  - fighter 27/21/21/15/21 → 30/26/28/20/29
  - comet 13/12/13/10/10 → 9/10/11/9/9 (its length is 1.18u, less than the old 2u)
  - interceptor about the same (1.84u)
- Hardest route lateral: 555/543/511/661/616u (was 637/685/528/553/613). Hardest-route barred cells: seed 1 now 69 (was 0). Seed 20260921 now 0 (was 59).
- Analyze with arms + pockets: about 1.25 s per seed (was about 1.0 s).

## Uncommitted

None.

## Held files

`packages/shared/src/pacing/{grid,viable,route-graph,pockets,analyze,arms,reference-path,jump-window}.ts` + tests, and the pacing export lines in `packages/shared/src/index.ts`. Release on request.

## Next

1. HOLD: the generator regenerate step. Wait until workerthree lands #244 (`sim/track.ts` block merge). Then re-run the z 1200–1278 fixture. If the merge dissolves it, pin a hand-built fixture for the freighter and phantom windows.
2. Then design the regenerate step: `rosterPockets` finds trapped segments, and the generator rebuilds each one. There are 35–56 freighter traps per seed, so check the cost first. Send an RFC to the supervisor before any build.
3. **R3 board: UNBLOCKED.** workertwo released `apps/client/app/routes/pacing/*` (#245, `20caf85`). Send claims to slur-supervisor before the first write. Rules from #245:
   - New panels read `usePacingReport()` (`PacingReportContext`). Never pass a `report` prop: React dev tracks walk the typed arrays, and that stalled the page for 5.8 s.
   - Draw long lines with `lineChunks`/`areaChunks` + `<PolylineChunks>`.
   - The analyzer runs in a module-singleton Worker. Turn on routes/pockets/arms through that worker, not in the route.
   - First step: read the #245 route files and the worker's options path.
4. After #244 commits (awaiting owner approval): re-measure the trapped-pocket counts on the five seeds and compare with the State table above.
4. R4: pickups as a reward axis in `dominated`.

## Open questions

- **Owner:** 35–56 trapped pockets per class per seed is a lot for a regenerate loop. Should the rule regenerate per segment, or should the generator avoid the shape at its source?

## Lessons → memory

`.claude/memory/test-your-lane-against-head.md` (new). `.claude/memory/pacing-grid-ignores-ship-length.md` (updated: the contract hull now has a z-length).
