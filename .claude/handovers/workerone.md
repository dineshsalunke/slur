Agent: workerone · Lane: #307 delete a saved track (done) → #308 undo/redo next · Updated: 2026-09-27 10:40

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#307: delete a saved track from the editor. **Done, pushed, #307 closed.** Next lane: #308 editor undo/redo. The plan below goes to the supervisor. Do not build until the supervisor says GO.

## Done

- ca9e35a #307.
  - `tracks-plugin.ts`: `deleteTrack()` + `DELETE /__tracks/<id>` behind `trackPath()`. The middleware body moved to `handleTrack()` because of the Biome complexity limit of 15.
  - `editor-saved-row.tsx` (new): edit · play · delete, then "delete? yes / no". A `useFetcher` form submits `intent=delete`.
  - `edit/route.tsx` clientAction: on delete of the `?level=` track, redirect to `/test-level/edit`. Otherwise `reloadSaved()`.
  - The saved list moved from loader data into the editor store (`state.saved`, `state.confirmDelete`). A loader revalidation re-runs `openEditor` and would drop unsaved edits.
  - `editor-tracks.ts` (new): `editorSource`, `savedTracks` and `SavedTrack` moved out of `track-editor.state.ts`, which had reached 300 lines.
  - shared `forgetAuthoredLevel(id)`.

## State

- Lint 0 with 7 warnings. The 8th warning is in workertwo's `track-editor.utils.ts` (organizeImports), not mine. Typecheck clean. Client 496/496. Shared 521/521, run in the tree.
- Live headless on :5173 (Playwright, Chrome closed after each run):
  - DELETE `..%2Fpackage` → 400. DELETE `nope` → 404.
  - "no" keeps the file. "yes" removes it, the list updates with no reload, and the URL stays.
  - With the level dirty ("Discard"), deleting another track keeps it dirty.
  - Deleting the open track goes to `/test-level/edit` and opens `groove-20260921`.
- To draw headless, first scroll the map forward with the wheel. The first screen is the locked start band.
- Owner verification on /test-level [unmeasured].

## Uncommitted

None. The untracked `tracks/*.json` files belong to the owner. Leave them alone.

## Held files

None. #308 claims are listed in Next and are not cleared yet.

## Next

1. #308 undo/redo. Send the supervisor this plan and these claims, then wait for GO:
   - Depends on #309 `normalizeLevel` (workertwo, 95834b1 per the supervisor handover [unmeasured]). `openEditor` sets `state.level = normalizeLevel( level )`, and the history starts there.
   - New `track-editor/editor-history.utils.ts` + `.test.ts`: a pure `{ past, future }` with push / undo / redo / cap 200 / clear.
   - `track-editor.state.ts`: `commitLevel(next)` is used by `releaseMap` (and by any other level change). `undo()` / `redo()`. `openEditor` clears the history.
   - Keys: add them to the existing `editorKeys` window listener that `attachMap` attaches. Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z, Ctrl+Y. Skip them in a text field with `typingTarget`. The guard today returns early on meta/ctrl, so it must be reordered. Weigh ≥5 options in the commit body: the existing listener, a new `use-*` hook with useEffect, `onKeyDown` on a focusable wrapper, a hotkeys library (not installed), `useSyncExternalStore` plus a module keymap.
   - New `track-editor/editor-undo.tsx`: undo/redo buttons that subscribe to `canUndo`/`canRedo`. Mounted in `track-editor.tsx`.
   - `track-editor.constants.ts`: `HISTORY_CAP`. workertwo may still hold it; check.
   - Test: undo after an erase that split a block brings the whole block back.
2. Push, then `gh issue close 308 -c "<what + SHA>"`.

## Open questions

- `.claude/memory/MEMORY.md` is 20.2 KB. The hook says to compact it under 17.1 KB. It is shared, so the supervisor decides who compacts it.

## Lessons → memory

`.claude/memory/unmounted-fetcher-drops-its-redirect.md`
