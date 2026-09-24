Agent: workerone · Lane: R4 S2 — composer (#250) · Updated: 2026-09-24

The approved RFC: `.claude/phases/2026-09-24-r4-score-rfc.md` (798ac1d). Older versions of this file hold
history: 4eacff7 (S1 seam), e868c04 (rev 2 numbers), 192787f (R4 brief), d520f36 (R1 rulings), f398d98 (S0).

## Goal

- S2 (RFC §12 step 3): envelope → motif chain → score, with G3 durations. Pure data, testable alone. No
  generator change.

## Done

- `2812078` R1 · `6e67f53` R2 · `1e7160c` trap rule + 6u hull · `85077ca` R3 board · `b0a3977` #248 pass (unwired).
- `798ac1d` R4 RFC rev 2 · `c24f2bb` S0 · `4eacff7` S1.
- S2 (this seam, SHA in the commit that carries this file):
  - `sim/score/compose.ts`: `composeScore( seed, length )` → `{ phrases, notes }`. Each note carries `z` (onset),
    `x` (line after the note) and `phrase`. `choosePhrase` picks a weighted motif whose intensity band holds
    `intensityAt()`. `rollVariation` / `varyMotif` do repeat (1–`SCORE_REPEAT_MAX` 2), mirror and stretch
    (stretch k inserts k−1 rests between notes). The sub-seed is `hash2( seed ^ SALT_SCORE, phrase × 5 + attempt )`.
    If the line leaves `±SCORE_LINE_LIMIT` (30u), the other mirror is forced, but only if `motif.mirror` allows it.
    Else a re-roll, up to `SCORE_ATTEMPTS` 4, then one rest. Breath after a phrase:
    `round( 4 × ( 1 − intensity ) )` rests. Below `REST_INTENSITY` there are rests only.
  - `sim/score/motifs.ts` (S1 fix): the flight check now aims each move from the ship's actual x at the onset,
    not from the absolute line. The old dead reckoning summed each plan's landing error (step 1 lands 0.034u
    short, held 0.167u short). So `l l l < R` failed at 0.269u > the 0.25u settle tolerance. Chained scores
    showed it: before the fix, 20 of 60 whole-score flights failed. Motif data and digest are unchanged.

## State

- Tests: 296/296 shared in a scratch copy at HEAD + S2 (286 + 10 new). biome clean, comment ratchet clean,
  `tsc -b` clean. Client typecheck on S1 (4eacff7): clean.
- Played notes per track, seeds 1–30: min 35 · median 42 · max 47 · mean 41.3 (the RFC target is 28–56).
- Phrases over 30 seeds: 486, of which 258 are single-rest phrases. 198 phrase boundaries between played notes.
- Every seed 1–30 flies clean end to end with the contract ship at 55 and 124 u/s. Cross-phrase gap ≥ move ×
  124 + 62u on all 198 boundaries.
- Composing 30 seeds takes ~14 ms [measured once].
- Motif use is uneven: n4-5 28, n3-5 27, n3-4 20 … n4-1 7, n4-4 7 (the bands overlap unevenly).

## Uncommitted

None.

## Held files

- `apps/client/app/routes/pacing/*` · `packages/shared/src/pacing/*` + tests · `packages/shared/src/sim/score/*`
  · the pacing and score export lines in `packages/shared/src/index.ts` · `sim/fracture-shadow.ts` + test ·
  `constants.ts` (S1 lines) · `sim/track-contract.test.ts` (S1 tests).

## Next — S3 (not started; needs the supervisor's go)

1. Emitter (RFC §12 step 4): score → geometry (M4 band on the score line + M1 accent gates + N2/N3 filler)
   behind `gen: 'score'` on `ProcgenDescriptor` (new field last, plain).
2. Transcribe round-trip: emit → S0 transcriber → the same notes.
3. Forks (`J|R`, two voices) are still not in the parser. Planned for S4.

## Open questions

- Owner: breath rests (`4 × (1 − intensity)`), repeat max 2 and the 30u line limit are my placeholders. The
  owner can tune them.
- Owner: a no-mirror motif at the band edge re-rolls instead of mirroring. I read `mirror: false` as "never".

## Lessons → memory

- none (the dead-reckoning fix is recorded in this commit and in the Done list above).
