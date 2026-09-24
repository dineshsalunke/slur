Agent: workerone · Lane: R4 S0 — score transcriber + /pacing notes lane (APPROVED, not started) · Updated: 2026-09-24

The approved RFC is committed: `.claude/phases/2026-09-24-r4-score-rfc.md` (798ac1d). The owner rulings on its
§13 are at the top of that file. Older versions of this file hold history: e868c04 (rev 2 numbers), 192787f
(R4 brief), d520f36 (R1 rulings).

## Goal

- S0 (RFC §12 step 1): a transcriber that reads any `Track` as a score of notes, and a notes lane on the
  `/pacing` board with register-gap breaches marked. No generator change.
- S0 must also output: today's **adherence** (the share of notes the easiest route plays), a proposed
  adherence floor, a proposed **calm-tube width**, and the most common note **n-grams (3–8 notes)** on
  today's tracks as a draft motif list for the owner.

## Done

- `2812078` R1 · `6e67f53` R2 · `1e7160c` trap rule + 6u hull · `85077ca` R3 board · `b0a3977` #248 pass (unwired).
- `798ac1d` R4 RFC rev 2, approved: every recommendation.

## State

- Owner rulings: see the RFC header. The key numbers: REGISTER_GAP_S 0.5 · registerCruise 124 (frozen, S1) ·
  note durations L1 120u / L2 140u / J 140u / JJ 220u / rest 60u on 20u segments · forcing M4 + M1 accents ·
  filler N2 + N3 + N4 · old seeds stay behind `gen: 'weave'` · #246 and #248 fold into R4.
- Contract move times (simulate(), counter-press pilot, settled ±0.25u ±1 u/s): 4u 0.367 s · 8u 0.550 s ·
  J 0.517 s · JJ 1.150 s.
- The ADR text (ADR-020 stub) was sent to slur-supervisor. The supervisor sequences it into
  `docs/DECISIONS.md`, which is dirty with workerthree's #244. **Do not touch DECISIONS.md.**
- `sim/track.ts` is dirty in the shared tree (another lane). Test S0 against HEAD in a scratch copy (memory
  `test-your-lane-against-head.md`).

## Uncommitted

None.

## Held files

- `apps/client/app/routes/pacing/*` · `packages/shared/src/pacing/*` + tests · the pacing export lines in
  `packages/shared/src/index.ts` · `packages/shared/src/sim/fracture-shadow.ts` + test.
- **Not yet claimed:** `constants.ts` (`TRACK_CONTRACT.registerCruise`) belongs to S1. Claim it then.

## Next

1. File the S0 GitHub issue (`CONTRIBUTING.md`). Title idea: "R4 S0: score transcriber + /pacing notes lane".
2. Send the supervisor the S0 file list before the first write. Draft list:
   `packages/shared/src/pacing/score.ts` + `score.test.ts` (transcriber: the reference path → notes),
   `packages/shared/src/pacing/ngrams.ts` + test (n-gram counts), an export line in `index.ts`,
   `apps/client/app/routes/pacing/*` (notes lane component, one per file). Read `conventions/r3f.md` /
   `tailwind.md` rules for the board before writing.
3. Build the transcriber on `referencePath` (the easiest and hardest routes). A note = a lateral move of
   ≥ 1 cell settled, a jump, or a smash. Mark each gap between notes shorter than `noteSpacing`.
4. Measure over the 30 fairness seeds: adherence, breach count, the n-gram table, and the lateral spread
   around the line during the calm (for the calm-tube proposal). Report to the supervisor.

## Open questions

- **Supervisor:** The R3 board does not show quiet-time bands or trapped pockets. Say if either is needed.

## Lessons → memory

- none
