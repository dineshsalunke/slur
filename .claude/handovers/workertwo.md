Agent: workertwo · Lane: #283 B4/B5 game/scene · Updated: 2026-09-26 14:12

Older versions hold #277 look check, #285, #272, #282, #266 and earlier
(`git log -p -- .claude/handovers/workertwo.md`).

## Goal

- #283: every client `.tsx` holds only its component; module-level items live in colocated files.

## Done

- `87c758f` batch 1 (20 scene components), `c92a27e` batch 2 (10), `e234fcd` batch 3 (9). Each component
  moved to `<name>/<name>.tsx` with `.constants.ts` / `.utils.ts` / `.state.ts`. Importers and tests repointed.
- Earlier #283: `492e8d2` B1/B7, `6ad8055`, `2034287` B0, `fa42f18` B2+B3, `f1ddda5` B6.

## State

- After e234fcd: client typecheck clean; vitest 64 files / 446 tests pass; `pnpm lint` passes [measured].
- Only plugin hits left in the client: `game/scene/scene-effects.tsx` (3). The supervisor holds it for the
  boost plan [measured].
- Grit rule `biome-plugins/component-module-scope.grit` is still `severity="warn"`.
- Tools (session scratchpad, will not survive): `split.mjs` (ts-morph split), `move.mjs` (move script with
  fs rename, no `git mv`), `run.sh` (move → split → biome).

## Uncommitted

None of mine.

## Held files

- `biome-plugins/component-module-scope.grit`, `biome.json` (pending the supervisor's answer).

## Next

1. Supervisor picked (c): scene-effects.tsx is released to me for one commit. The auto-mode classifier
   denied the edit, because the owner's resume prompt said to keep out of it. Waiting for the owner.
   Recipe once allowed: `echo scene-effects > $S/b4.txt && bash $S/run.sh b4.txt`, then check, commit.
2. Raise the grit severity to error, run `pnpm lint`, commit, push, and close #283 with the SHAs above.

## Open questions

- scene-effects.tsx vs the error switch (sent to the supervisor).

## Lessons → memory

- `.claude/memory/bulk-move-without-git-mv.md` (new this seam).
