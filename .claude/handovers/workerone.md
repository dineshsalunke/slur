Agent: workerone · Lane: #308 editor undo/redo (done) · Updated: 2026-09-27 10:15

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#308: undo/redo in the track editor. **Done, pushed, #308 closed.** No lane assigned yet.

## Done

- 5e51feb #308.
  - `editor-history.utils.ts` (new): pure `{ past, future }` history, cap `HISTORY_CAP` = 200, `stepHistory`, `historyKeyOf`.
  - `track-editor.state.ts`: `state.history`, `travel('undo' | 'redo')`. Undo restores blocks + gaps only, so the saved id and name survive. `dirty` compares blocks/gaps by reference with the level opened or saved. `openEditor` runs `normalizeLevel` and clears history.
  - `editor-undo.tsx` (new): Undo / Redo buttons under the palette.
  - Keys go through the existing `editorKeys` listener. The commit body weighs the 5 options.

## State

- Client vitest 503/503. Client typecheck clean. Lint: my files clean. The one format error is in workerthree's uncommitted `scene-effects.tsx`.
- `track-editor.state.ts` is at 297 non-blank lines. Biome's cap is 300. The next change there must move code out first.
- Headless on :5173 (Playwright, Chrome closed): draw, Cmd+Z ×2, Shift+Cmd+Z, Ctrl+Y and the Undo button all step correctly. Discard/Close follows. Cmd+Z in the name input leaves history alone.
- A click that changes nothing (erasing empty space) still pushes an undo step, and undoing it shows no change. Not fixed.
- Owner verification on /test-level [unmeasured].

## Uncommitted

None. The untracked `tracks/*.json` files belong to the owner.

## Held files

None.

## Next

1. Wait for a lane from the supervisor.
2. Possible follow-up: skip the history push when `applyTool` returns the same blocks and gaps. This needs room in `track-editor.state.ts` first.

## Open questions

- Should a no-op edit push an undo step? Today it does.

## Lessons → memory

none
