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

## Owner answers on S0 (via supervisor, 2026-09-24)

- Adherence floor **75%** (not the proposed 90%), accents **100%**, calm tube **±5u**.
- Seed the motif library with the top n3/n4/n5 motifs from the S0 report (see the supervisor message and
  the table below), spaced to the G3 durations. The owner edits the file later.
  n3: J l J · l J r · J l r · l J J · l r J — n4: J l J J · J l r J · l J r J · l J l r · J l J r —
  n5: L J r J J · J l r J l · l J l r J · J < R r l · J L r J J
- ADR-020 is parked at `.claude/phases/2026-09-24-adr-020-pending.md`. Line 22 already holds 75% / ±5u.
  No delta is needed from me.

## Next — S1 (approved; NOT started, no claim sent yet)

1. Send slur-supervisor the claim list before the first write: `packages/shared/src/constants.ts`
   (`TRACK_CONTRACT.registerCruise = 124` + a roster guard in `rosterContractFailures`, plus
   `SCORE_ADHERENCE_FLOOR 0.75`, `SCORE_ACCENT_ADHERENCE 1.0`, `CALM_TUBE_HALF 5` as named constants),
   `sim/fracture-shadow.ts` + test (FRACTURE_SHADOW_Z onto registerCruise; already held),
   `pacing/score.ts` (SCORE_REGISTER_CRUISE → registerCruise; NOTE_MOVE_S → the pilot), and new files for
   the pilot, the motif library + parser + load-time validation (probably `sim/score/*`, to be named in the
   claim). **Do not touch `sim/track.ts`** (dirty with #244).
2. The `noteMove` pilot: a `simulate()` counter-press strafe (settled ±0.25u, ±1 u/s) and a jump air time,
   at module load. It must reproduce RFC §3 (4u 0.367 s · 8u 0.550 s · J 0.517 s · JJ 1.150 s).
3. The motif library file, the parser, and load-time validation: every motif spaced to G3, each note
   playable by the contract ship.

## Open questions

- none for the owner.
- **Supervisor:** the R3 board does not show quiet-time bands or trapped pockets. Say if either is needed.

## Lessons → memory

- `.claude/memory/pacing-board-needs-cdp-not-screenshot-flag.md`
