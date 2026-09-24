Agent: workerone · Lane: R4 phrase RFC (sent) · #248 fracture shadow (HELD by owner) · #246 slope bug (paused) · Updated: 2026-09-24

The R4 RFC is `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/fc64b587-409f-4817-b64c-48b632645580/scratchpad/rfc-r4-phrase.md`. Scripts beside it: `beat.mjs`, `tempo.mjs`. The pacing RFC (R1–R3) is `…/a42d7260-7d77-4e58-93e1-2b90e521bca9/scratchpad/rfc-pacing-branching.md`. Older versions of this file hold history: 192787f (R4 brief verbatim), d520f36 (owner rulings Q1–Q5), 68f48bd (trap rule).

## Goal

- R4: the phrase RFC is written and sent. Wait for the owner's answers to Q1–Q7. Build nothing.
- #248: HOLD the hook-up. #246: paused; RFC §8 proposes folding it into R4.

## Owner rulings (2026-09-24)

- Trapped = the escape stop window is shorter than that ship's own length. Contract hull z-length = 6u.
- The hardest route keeps the Viterbi cost. Pickups become a reward axis in R4.
- The generator must REGENERATE a segment that has a trap.
- #248: HOLD the hook-up. Keep b0a3977 committed and unwired.

## Done

- `2812078` R1 · `6e67f53` R2 · `1e7160c` trap rule + 6u hull · `85077ca` R3 board · `b0a3977` #248 pass (unwired).
- R4 RFC written (scratchpad, not in the repo). No code.

## State

- Contract ship 8u rest-to-rest step: 0.521 s = 28.6u at 55 u/s (analytic). Single jump air at 55 u/s: 28.4u (simulate()); double 63.2u. Phantom 31.2 / 67.8.
- Derived beat pitch: P_min = d 4 + hull 6 + 55·t_clear(4u) = 30.3u → recommended BEAT 32u. At 32u the contract plays a dense reversal stream at 59.7 u/s; the Freighter lifts from 124 to ~94; all others hold full speed (analytic).
- FASTEST_CRUISE 124 (Freighter); FRACTURE_SHADOW_Z 55.8u = 2 rest beats at 32u.
- RFC recommendations: pitch C/F (32u, derived) · forcing M4 (score-steered band) + M1 accents · C4 transcriber first then C2 behind `gen: 'weave' | 'score'` · motifs F4 (TS objects holding note strings) · per-class check = simulate() pilot, not PathSolver.
- #246 / #248 measured state: see 192787f.

## Uncommitted

None in this lane.

## Held files

- `apps/client/app/routes/pacing/*` (R3). Release on request.
- `packages/shared/src/sim/fracture-shadow.ts` + test (#248).
- `packages/shared/src/pacing/*` + tests and the pacing export lines in `packages/shared/src/index.ts`. Release on request.

## Next

1. Wait for the owner's answers to RFC §13 Q1–Q7 via slur-supervisor.
2. If approved: S0 = the transcriber + a notes lane on `/pacing` (RFC §12). File an issue first unless the owner waives it.
3. #246 and #248 wait on Q7.

## Open questions

- **Owner:** RFC §13 Q1–Q7 (ADR-006 departure, pitch, `J, J` meaning, forcing + adherence floor, old seeds, who writes motifs, fold #246/#248).
- **Supervisor:** The R3 board does not show quiet-time bands or trapped pockets. Say if either is needed.

## Lessons → memory

- none
