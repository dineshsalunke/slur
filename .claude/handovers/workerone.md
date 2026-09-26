Agent: workerone · Lane: #304 editor — eraser subtract fix · Updated: 2026-09-27 02:45

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Owner bug on #304 (reopened): the eraser removed every rect it touched. It must subtract only its snap cells. **Done; #304 closed again.**

## Done

- ff54424 `subtractRect` in `track-editor.utils.ts`. The eraser cuts its snapped rect out of every block and gap it overlaps. Each rect splits into at most 4 pieces (below, above, left, right). Zero-area pieces are dropped. Extra fields such as `destructible` are kept.
- Earlier lane work: 0130a63 (editor), 249d47f (zoom).

## State

- Tests: middle, edge, corner, full cover and a drag across several rects, each at snap 1 and snap 4. Client vitest 479/479. Typecheck clean. `pnpm lint` 0 errors, 7 existing warnings.
- Measured headless on :5173 at `/test-level/edit?gen=phrase`, snap 4. Gap `{x −48, z 704, w 96, l 40}`. Two clicks at x −39.5 and −35.5, z 724.5. Gap count went 17 → 20. Saved `tracks/erase-check-304.json` held `{−48,704,96,20}`, `{−48,724,8,4}`, `{−32,724,80,4}`, `{−48,728,96,16}`. The room's floor has deck at both erased cells and no deck at the neighbour cells.
- `tracks/erase-check-304.json` was deleted. `tracks/groove-20260921-decompiled.json` is untracked and not mine.
- Driver: scratchpad `erase.mjs`. It needs `performance.setResourceTimingBufferSize` in an init script, or the module URLs fall out of the 250-entry buffer.

## Uncommitted

None.

## Held files

None (released `track-editor.utils.ts`, `track-editor.utils.test.ts`).

## Next

1. Wait for the supervisor's next lane.

## Open questions

- None.

## Lessons → memory

none
