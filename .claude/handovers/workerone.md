Agent: workerone · Lane: R4 phrase RFC rev 2 (sent) · #248 fracture shadow (HELD by owner) · #246 slope bug (paused) · Updated: 2026-09-24

The R4 RFC is `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/fc64b587-409f-4817-b64c-48b632645580/scratchpad/rfc-r4-phrase.md`. Scripts beside it: `beat.mjs`, `tempo.mjs`, `register.mjs`, `calm.mjs`. Rev 2 applies the owner register-gap rule (0.5 s calm after every note at FASTEST_CRUISE, from the end of the move). The pacing RFC (R1–R3) is `…/a42d7260-7d77-4e58-93e1-2b90e521bca9/scratchpad/rfc-pacing-branching.md`. Older versions of this file hold history: 192787f (R4 brief verbatim), d520f36 (owner rulings Q1–Q5), 68f48bd (trap rule).

## Goal

- R4: the phrase RFC is written and sent. Wait for the owner's answers to rev 2 Q1–Q9. Build nothing.
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

- Contract move times (simulate(), counter-press pilot, settled ±0.25u ±1 u/s): 4u 0.367 s · 8u 0.550 s · J 0.517 s · JJ 1.150 s. Every class settles faster (8u 0.300–0.367 s).
- Note spacing = 124 × (move + 0.5 s): L1 107.5u · L2 130.2u · J 126.1u · JJ 204.6u. Rounded to 20u: 120 / 140 / 140 / 220.
- Calm per class at its own vmax: Freighter 0.61–0.76 s (lowest), Interceptor 1.15–1.47 s. No class lifts. At 55 u/s: 2.55 s between L2 onsets.
- ~28 notes per track [inferred, linear in intensity]; max 56 (L2). Today ~466 blocks per track, so filler (N2 band walls + N3 harmony) is proposed.
- Rev 2 recommends: TRACK_CONTRACT.registerCruise 124 frozen + roster guard (FASTEST_CRUISE is a roster max, which breaks ADR-013; FRACTURE_SHADOW_Z has the same defect) · G3 note durations on 20u segments · M4 + M1 accents. J,J = 140u apart, so no conflict with "no two gaps in a row".

## Uncommitted

None in this lane.

## Held files

- `apps/client/app/routes/pacing/*` (R3). Release on request.
- `packages/shared/src/sim/fracture-shadow.ts` + test (#248).
- `packages/shared/src/pacing/*` + tests and the pacing export lines in `packages/shared/src/index.ts`. Release on request.

## Next

1. Wait for the owner's answers to RFC rev 2 §13 Q1–Q9 via slur-supervisor.
2. If approved: S0 = the transcriber + a notes lane on `/pacing` (RFC §12). File an issue first unless the owner waives it.
3. #246 and #248 wait on Q9.

## Open questions

- **Owner:** RFC rev 2 §13 Q1–Q9.
- **Supervisor:** The R3 board does not show quiet-time bands or trapped pockets. Say if either is needed.

## Lessons → memory

- none
