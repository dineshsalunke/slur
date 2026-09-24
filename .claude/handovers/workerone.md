Agent: workerone · Lane: R4 phrase RFC (next) · #248 fracture shadow (HELD by owner) · #246 slope bug (paused) · Updated: 2026-09-24

The pacing RFC is `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/a42d7260-7d77-4e58-93e1-2b90e521bca9/scratchpad/rfc-pacing-branching.md` (§3, §4, §5, §8). Older versions of this file hold history: d520f36 (owner rulings Q1–Q5), 66fefc0 (R2), 68f48bd (trap rule, 1e7160c), f6f6962 (R3 board).

## Goal

- R4: write the PHRASE RFC (the track as a score). A doc plus options. Build nothing.
- #248: the pass is committed and unwired. The owner says HOLD the hook-up.
- #246: paused on the owner. The R4 generator fixes it by construction.

## Owner rulings (2026-09-24)

- Trapped = the escape stop window is shorter than that ship's own length.
- The contract hull z-length = the Freighter's 6u.
- The hardest route keeps the Viterbi cost.
- Pickups become a reward axis in R4.
- The generator must REGENERATE a segment that has a trap.
- #248: HOLD the hook-up. Keep b0a3977 committed and unwired.

## Done

- `2812078` R1 · `6e67f53` R2 · `1e7160c` trap rule + 6u hull · `85077ca` R3 board.
- #246 filed (no code). The cause is measured and reported.
- `b0a3977` #248: `sim/fracture-shadow.ts` + test + the `index.ts` export. A pure function. It is not hooked up.

## State

- #246: `PathSolver` (`reference-path.ts`) limits only the strafe rate. The sim limits acceleration (`step.ts:25`, `strafeAccel` 165). Every route obeys the 65 u/s clamp (max |dx| 1.182u per 1u row, 5 seeds). F4 on seed 20260921 moves 31.9u in 0.49 s. The minimum from rest is 0.62 s. A no-lookahead pilot lags 8–9u on the easiest route and 13–15u on the hardest.
- #248 constants: `FRACTURE_SHADOW_Z` = max(smashKeep × maxCruise) × 1 s = 55.8u. Pad = `MAX_SHIP_WIDTH`/2 = 2u. Lookahead = 3 segments.
- #248 sweep, 30 seeds, #244 geometry, pad 2u: fractured 1656 → 392 (−76.3%). There are 1209 block hazards (all start at or after z1) and 55 gap hazards. Pad 1.3u: −75.2%. A 0.25/0.5/0.75/1 s zone costs −46.5/−66.0/−71.6/−76.3%. HEAD without #244: 1998 → 423.
- #248 build time: a full walk goes from 3.4 to 4.9 ms per seed (1.44×). No cache.
- Hook-up diff: scratchpad `5b01310f-…/scratchpad/hookup-248.diff` (track.ts + track.test.ts). 269/269 pass in a scratch copy of #244 + the hook-up. The supervisor holds it.
- Scratch copies: `…/scratchpad/pk` (HEAD), `pk244` (#244), `pk244h` (#244 + hook-up). Scripts: `clamp.mjs`, `f4.mjs`, `track.mjs`, `sweep.mjs`, `why.mjs`, `time.mjs`.

## Uncommitted

None in this lane.

## Held files

- `apps/client/app/routes/pacing/*` (R3). Release on request.
- `packages/shared/src/sim/fracture-shadow.ts` + test (#248).
- `packages/shared/src/pacing/*` + tests and the pacing export lines in `packages/shared/src/index.ts`. Release on request.

## Next

1. **R4 PHRASE RFC**, the owner's model (verbatim from slur-supervisor):
   - The track is a SCORE. Inputs are notes: L, R, J (jump), a held strafe (R→ / L→), SMASH (a fractured block), and rest (·). The owner's example: "L, L, R→, J, J, R→, ·, ·, ·, ·, R, R…, J, L, L". A phrase is a pattern the player learns to play, like playing a tune on an instrument.
   - Owner rulings: TEMPO = a distance grid. Notes sit at fixed track z, so a faster ship plays the same song at a faster tempo. PATTERNS = a motif library plus variation: short hand-written motifs (3–8 notes), repeated, mirrored L↔R, stretched and chained; intensity picks the denser motifs.
   - The generator is inverted: the score comes first, then the geometry that forces each note. A note is placed only where the contract ship (TRACK_CONTRACT, strafe acceleration included) can play it, so #246 is fixed by construction.
   - SMASH carries its own rest afterwards: the fracture-shadow clear zone (FRACTURE_SHADOW_Z). #248's sealShadowed becomes a test that the phrases obey the rule, not a demotion pass.
   - The RFC must answer: the grid pitch (u per beat, from reaction time at FASTEST_CRUISE and the contract ship); the note → geometry mapping (which block or gap forces L, R, J, R→); how the score co-exists with or replaces the noise wall generator, weave and ADR-006/007; the per-class check (the #246 solver runs over the score); forks and arms (R1); the motif file format (ship stats are data, so motifs are data); and how the existing tests migrate.
   - The RFC is a doc plus options. Build nothing. Send it to slur-supervisor for the owner.
   - Inputs to read first: `docs/GDD.md` §0 (the space contract), ADR-006/007 in `docs/DECISIONS.md`, `sim/track.ts`, `sim/weave.ts`, `constants.ts` (`TRACK_CONTRACT`, `DEFAULT_JUMP`, `DEFAULT_TUNING`), `ship-classes.ts`, `pacing/jump-window.ts` (`airDistance`), `sim/fracture-shadow.ts`. Use the #248 numbers: at today's density, 46% of fractured blocks have a block within 14u behind them.
2. #246: wait for the owner. It may fold into R4.
3. #248: HOLD. The hook-up diff stays with the supervisor.
4. HOLD: the regenerate step for trapped pockets. It waits for #244, and R4 may replace it.
5. After #244 commits: re-measure the trapped-pocket counts on the five seeds (the 68f48bd version of this file has the table).

## Open questions

- **Owner:** #246 fix option 1, 2 or 3, or fold it into R4.
- **Owner:** #248 costs ~76% of fractured blocks. Does R4 supersede the demotion?
- **Owner:** Is a tie at zero demand between arms a "dodge" rather than a fork?
- **Supervisor:** The R3 board does not show quiet-time bands or trapped pockets. Say if either is needed.

## Lessons → memory

- `.claude/memory/fractured-blocks-rarely-have-a-clear-lane.md`
