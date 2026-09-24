Agent: workerone · Lane: R4 S1 — registerCruise, noteMove pilot, motif library (#250) · Updated: 2026-09-24 17:10

The approved RFC: `.claude/phases/2026-09-24-r4-score-rfc.md` (798ac1d). Older versions of this file hold
history: e868c04 (rev 2 numbers), 192787f (R4 brief), d520f36 (R1 rulings), f398d98 (S0 seam + owner answers).

## Goal

- S1 (RFC §12 step 2): freeze `TRACK_CONTRACT.registerCruise`, measure note moves with a `simulate()` pilot,
  and ship the motif library, parser and load-time validation. No generator change.

## Done

- `2812078` R1 · `6e67f53` R2 · `1e7160c` trap rule + 6u hull · `85077ca` R3 board · `b0a3977` #248 pass (unwired).
- `798ac1d` R4 RFC rev 2 · `c24f2bb` S0 (#250).
- S1 (this seam, SHA in the commit that carries this file):
  - `constants.ts`: `TRACK_CONTRACT.registerCruise = 124`; `rosterContractFailures` fails a class with
    `maxCruise > 124`; `SCORE_ADHERENCE_FLOOR 0.75`, `SCORE_ACCENT_ADHERENCE 1`, `CALM_TUBE_HALF 5`.
  - `sim/fracture-shadow.ts`: `FRACTURE_SHADOW_Z = S × registerCruise × max(smashKeep)` (still 55.8u).
  - `sim/score/note-move.ts`: `CONTRACT_TUNING`, `strafePlan` (hold + counter-press search), `measureNoteMoves`,
    `NOTE_MOVE_S` at load; throws if the contract ship cannot play a note.
  - `sim/score/notes.ts`: tokens `l r L R < > J JJ S .`, `!` accent, `parseNotes`, `formatNotes`, G3 `noteDuration`.
  - `sim/score/motifs.ts`: `MOTIF_LIBRARY` (owner's 15 S0 motifs), `motifFailures`, `motifFlightFailures`
    (flat-floor flight at 55 and 124 u/s), `motifDigest`, `MOTIFS`; throws at load on any failure.
  - `pacing/score.ts`: cruise from `registerCruise`, moves from the pilot; held uses the 3-cell move.
  - `pacing/jump-window.ts`: `JumpPilot`, `newJumpPilot`, `steerJump` exported (renamed from private names).

## State

- Pilot vs RFC §3: step1 0.3667 s (0.367) · step2 0.550 s (0.550) · J 0.5167 s (0.517) · JJ 1.150 s (1.150).
  New: held (3 cells) 0.633 s.
- G3 durations: l/r 120 · L/R 140 · </> 160 · J 140 · JJ 220 · S 80 · rest 60 (u).
- All 15 seeded motifs pass the load-time check at 55 and 124 u/s. Library digest 1779460072.
- Tests: 286/286 shared in a scratch copy at HEAD + S1 (273 before + 13 new). biome clean on S1 files. Comment
  ratchet clean. Client typecheck not run [no client file uses a changed name — rg, this session].
- Shared module load 122 ms total in node [measured once]. The pilot search alone is ~19 ms.
- S0 numbers after the held change (seeds 1–30): easiest 1,380 notes, 754 breaches (was 739). Band line 2,655
  notes, 2,505 breaches (was 2,476). Adherence 993/2,655 = 37.4% (unchanged).
- Left = −x is still [inferred] from `step.ts`.

## Uncommitted

None.

## Held files

- `apps/client/app/routes/pacing/*` · `packages/shared/src/pacing/*` + tests · `packages/shared/src/sim/score/*`
  · the pacing and score export lines in `packages/shared/src/index.ts` · `sim/fracture-shadow.ts` + test ·
  `constants.ts` (S1 lines) · `sim/track-contract.test.ts` (S1 tests).

## Next — S2 (not started; needs the supervisor's go)

1. Composer (RFC §12 step 3): envelope → motif chain → score, with G3 durations. Pure data, testable alone.
2. Variation as a pure function of `(motif, sub-seed)`: repeat, mirror (forced at the band edge), stretch.
3. Forks (`J|R`, two voices, RFC §7) are not in the parser yet. `parseNotes('J|R')` throws. Add in S2 or S3.

## Open questions

- none for the owner. The seeded motifs carry placeholder fields: intensity n3 [0, 0.6] · n4 [0.3, 0.9] ·
  n5 [0.5, 1], weight 1, mirror true, stretch [1, 2]. The owner edits them in `sim/score/motifs.ts`.
- **Supervisor:** the R3 board does not show quiet-time bands or trapped pockets. Say if either is needed.

## Lessons → memory

- `.claude/memory/test-your-lane-against-head.md` — updated: never run `pnpm test` in a scratch copy
  (it starts `pnpm install` through the symlinked `node_modules`); call tsc and `node --test` directly.
