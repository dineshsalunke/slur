Agent: workerone · Lane: R4 S0 — score transcriber + /pacing notes lane (#250) · Updated: 2026-09-24 16:55

The approved RFC: `.claude/phases/2026-09-24-r4-score-rfc.md` (798ac1d). Older versions of this file hold
history: e868c04 (rev 2 numbers), 192787f (R4 brief), d520f36 (R1 rulings).

## Goal

- S0 (RFC §12 step 1): read any `Track` as notes and show them on `/pacing` with register-gap breaches.
  No generator change. Report adherence, breaches, n-gram motifs, and proposals for the adherence floor and
  the calm-tube width.

## Done

- `2812078` R1 · `6e67f53` R2 · `1e7160c` trap rule + 6u hull · `85077ca` R3 board · `b0a3977` #248 pass (unwired).
- `798ac1d` R4 RFC rev 2, approved.
- `c24f2bb` S0 (#250): `pacing/score.ts` (transcribe, intentLine, scoreAdherence), `pacing/ngrams.ts`,
  `PacingReport.score / line / adherence`, `NotesLane` + `NoteRow`, two summary stats.

## State

- Tests: 273/273 shared at HEAD + S0 in a scratch copy (tree `sim/track.ts` is dirty with #244).
  Client typecheck passed. biome and the comment ratchet are clean on the 10 S0 files. `pnpm lint` still fails
  on files of other lanes (`track-rail.tsx`, `world-scene.tsx`, the max-lines rule).
- Seeds 1–30 at HEAD [the "30 fairness seeds" set is not named anywhere; 1..30 is my choice]:
  easiest route 1,380 notes, 739 breaches (54%). Band line 2,655 notes, 2,476 breaches (93%).
- Breach pairs (easiest): lateral→lateral 405 · lateral→air 159 · air→lateral 145 · air→air 30. Shortfall
  p50 68u, p90 111u, max 204u.
- Adherence (band line → easiest, ±62u): 993/2655 = 37.4%; ±31u 33.1%; ±124u 40.8%. Per seed 26–47%.
- Easiest-route drift inside calms ≥ 20u (n = 1,153): p50 0, p90 2.95u, p95 2.95u, max 7.68u.
  Easiest vs band centre during calm: p50 16.7u, p95 26.1u.
- Visual: `/pacing?seed=1` renders the Notes lane (CDP screenshot, headless Chrome killed after).
- Placeholders that S1 replaces: `NOTE_MOVE_S` hard-codes the RFC §3 measurements.
  `SCORE_REGISTER_CRUISE = FASTEST_CRUISE` is to become `TRACK_CONTRACT.registerCruise`.
- Left = −x is [inferred] from `step.ts` (strafe −1 → vx −). Only the l/r naming depends on it.

## Uncommitted

None.

## Held files

- `apps/client/app/routes/pacing/*` · `packages/shared/src/pacing/*` + tests · the pacing export lines in
  `packages/shared/src/index.ts` · `packages/shared/src/sim/fracture-shadow.ts` + test.

## Next

1. Wait for the owner's reply (through the supervisor) on the S0 proposals: an adherence floor of 90%
   (accents 100%), and a calm tube of ±5u.
2. S1: claim `constants.ts` (`TRACK_CONTRACT.registerCruise` + the roster guard), then the `noteMove` pilot
   that replaces `NOTE_MOVE_S`, then the motif library, the parser and load-time validation.

## Open questions

- **Owner:** approve the adherence floor and the calm-tube width. Edit the draft motif list.
- **Supervisor:** the R3 board does not show quiet-time bands or trapped pockets. Say if either is needed.

## Lessons → memory

- `.claude/memory/pacing-board-needs-cdp-not-screenshot-flag.md`
