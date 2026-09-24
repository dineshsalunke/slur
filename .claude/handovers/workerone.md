Agent: workerone · Lane: R4 S3 — JJ motifs + `gen:'score'` switch (#250) · Updated: 2026-09-24 20:10

The approved RFC: `.claude/phases/2026-09-24-r4-score-rfc.md` (798ac1d). Older versions of this file hold
history: 884fa0e (switch diff seam), 58bb78f (S3 emitter seam), 4e66705 (S2), 4eacff7 (S1).

## Goal

- Standard motif library emits `JJ` on most seeds (owner-approved 2026-09-24). Then hand the
  `gen:'score'` switch to slur-supervisor as a diff (waits on #244, track.ts).

## Done

- `798ac1d` RFC · `c24f2bb` S0 · `4eacff7` S1 · `4e66705` S2 · `58bb78f` S3 emitter · `884fa0e` switch diff.
- `72948ae` JJ motifs: `n3-6 'l JJ r'` [0, 0.9] · `n4-6 'J l JJ r'` [0.3, 1] · `n5-6 'L JJ r J l'` N5 [0.5, 1].
  Library digest 1779460072 → 2694968437 (`track-contract.test.ts`).
- Switch diff refreshed: `track-gen.test.ts` drops its private JJ test library and asserts the exemption on
  the standard score tracks. Same 8 files. Path unchanged:
  `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/91190798-1cd4-4a01-ab73-1f3a33e86834/scratchpad/gen-score-switch.diff`
  (copy + the old version in `…/5fa4d776-636d-40e4-84d1-41aa764fa45d/scratchpad/`).

## State

- Seeds 1–200, standard library: 455 `JJ` notes, on 173 of 200 seeds (was 0). Per-motif phrase uses:
  n3-6 149 · n4-6 115 · n5-6 57. Plain N3/N4 bands gave only 146/200 seeds, so n3-6 and n4-6 are widened.
- All three pass `motifFailures` (the load-time pilot at 55 and 124 u/s).
- Scratch copy at HEAD + 72948ae: shared 306/306 pass. With the refreshed diff applied: shared 309/309,
  server 17/17. biome clean on the touched files; comment ratchet passes.
- Refreshed diff: 8 standard score test seeds give 18 `JJ` double gaps, all pass the gap-run check.
- `git apply --check` fails on the live dirty `track.ts` (#244), as before; `git apply -C1 --check` passes on
  a copy of it.
- A score room still has no pickups (`anchors: []`, S4).

## Uncommitted

None (the diff lives in the scratchpad by design).

## Held files

- `packages/shared/src/sim/score/*` · `packages/shared/src/pacing/*` + tests · the pacing and score export
  lines in `packages/shared/src/index.ts` · `apps/client/app/routes/pacing/*` · `sim/fracture-shadow.ts` + test ·
  the motif digest line in `sim/track-contract.test.ts`.
- Pending the supervisor applying the diff: `sim/space.ts`, `schema.ts`, `sim/track-provider.ts`,
  new `sim/track-gen.test.ts`, `apps/server/src/rooms/run-room.ts` + test (track.ts/track.test.ts go with #244).

## Next

1. Wait for #244 to land, then for the supervisor to apply the diff. Playtest support if asked
   (`SLUR_TRACK_GEN=score pnpm dev`).
2. S4: forks, pickups, a smash solver (SOLID_SEALED hull for `S`).
3. S5: fly the emitted geometry with the contract ship at 55 and 124 u/s through `simulate()` with
   collisions (0.5u pin clearance, `JJ` = 40u hole reach per class).

## Open questions

- Supervisor: ADR-020's first Consequences bullet ("no two gaps … by construction") is replaced by the
  amendment in `.claude/phases/2026-09-24-adr-020-pending.md`. Delete the old bullet when you sequence it.

## Lessons → memory

- `.claude/memory/ast-grep-trailing-comma-matches-nothing.md`.
