Agent: workerone · Lane: pacing R3 board (RFC §4; no issue, owner waived) + #246 slope bug · Updated: 2026-09-24

The RFC is `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/a42d7260-7d77-4e58-93e1-2b90e521bca9/scratchpad/rfc-pacing-branching.md` (§3, §4, §5, §8). The d520f36 version of this file holds the owner rulings Q1–Q5. The 66fefc0 version holds the R2 details. The 68f48bd version holds the trap-rule details (1e7160c). The f6f6962 version holds the R3 board details.

## Goal

- #246: make pacing routes flyable under the sim's strafe acceleration. Waiting for the owner to pick a fix.
- Held: the generator regenerate step (waits for #244).

## Owner rulings (2026-09-24)

- Trapped = the escape stop window is shorter than that ship's own length.
- The contract hull z-length = the Freighter's 6u.
- The hardest route keeps the Viterbi cost.
- Pickups become a reward axis in R4.
- The generator must REGENERATE a segment that has a trap.

## Done

- `2812078` R1 · `6e67f53` R2 · `1e7160c` trap rule + 6u hull · `85077ca` R3 board.
- Filed #246 (no code). Cause measured, reported to slur-supervisor.

## State

- #246 cause: `PathSolver` (`reference-path.ts`) is rate-limited only. Every route obeys the clamp: max |dx| per 1u row = 1.182u = 65 u/s on the easiest, the hardest and every arm, seeds 20260921/1/42/7/99991. The sim is accel-limited (`step.ts:25`, `strafeAccel` 165).
- F4 on seed 20260921: hardest x −29.4 → +2.5u over rows 1335–1362 (0.49 s). Minimum from rest at 165 u/s²: 0.62 s (no stop), 0.88 s (stop).
- No-lookahead accel pilot (upper bound): max lag 7.8–9.1u on the easiest, 12.8–14.7u on the hardest, five seeds.
- Display: 4 px/u in x, 0.44 px/u in z at default pps 24 → a full-clamp move draws ~11× steeper than 45°.
- Scripts: scratchpad `5b01310f-…/scratchpad/{clamp,f4,track}.mjs` (run against `packages/shared/dist`).
- The dist was built from the shared tree, which holds workerthree's uncommitted `sim/track.ts` [unmeasured whether it changes these numbers].

## Uncommitted

None in this lane.

## Held files

- `apps/client/app/routes/pacing/*` (R3). Release on request.
- `packages/shared/src/pacing/*` + tests and the pacing export lines in `packages/shared/src/index.ts`. Release on request.

## Next

1. Wait for the owner's #246 pick (via slur-supervisor). Options: (1, recommended) velocity level in the solver state, a step change needs ~11 rows per 32.5 u/s; (2) diagnostic post-pass only; (3) lower the solver rate. Then build in `reference-path.ts` with a shared test that flies every emitted route with the sim strafe model and bounds the tracking error. Re-check the cost: the route graph, `legalMask` and `rosterPockets` all use `maxStep`.
2. Wait for the supervisor or owner to review the R3 stills.
3. HOLD: the generator regenerate step. Wait until workerthree lands #244 (`sim/track.ts` block merge). Then re-run the z 1200–1278 fixture. If the merge dissolves it, pin a hand-built fixture for the freighter and phantom windows.
4. Then design the regenerate step (`rosterPockets` → rebuild the trapped segments). Check the cost first (35–56 freighter traps per seed). Send an RFC to the supervisor before any build.
5. After #244 commits: re-measure the trapped-pocket counts on the five seeds (the 68f48bd version of this file has the table).
6. R4: pickups as a reward axis in `dominated`.

## Open questions

- **Owner:** #246 fix option 1, 2 or 3.
- **Owner:** 35–56 trapped pockets per class per seed is a lot for a regenerate loop. Should the rule regenerate per segment, or should the generator avoid the shape at its source?
- **Owner:** 10 of 17 forks on seed 20260921 have a dominated arm, and many arms tie at zero demand. Is a tie at zero demand a "dodge" rather than a fork?
- **Supervisor:** the board does not show quiet-time bands or trapped pockets. Say if R3 needs either.

## Lessons → memory

- `.claude/memory/rate-clamp-is-not-flyability.md`
