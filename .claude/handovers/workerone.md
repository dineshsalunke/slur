Agent: workerone · Lane: #306 /test-level reset key + editor "Start here" (done) → #307 next · Updated: 2026-09-27 09:55

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#306: one key restarts /test-level, and an editor right-click sets where Play and reset start. **Done, pushed, #306 closed.** Next lane: #307 (delete a saved track), plan sent to the supervisor.

## Done

- 6b982c6 #306.
  - Backspace resets through the LoopbackRoom sim: `resetToLobby()` + START, then the new `RunSim.spawnAt()`.
  - Shift+Backspace also drops `?start`.
  - Editor right-click menu: Start here / Clear start / Cancel. It writes `?start=x,z` through RR navigation.
  - Save + Play carries `?start`. The saved-track links drop it.
  - The snap is the shared `startPointFor()` (wraps `respawnPoint`). The editor snaps for `widestShip()` and shows a note when the point moved.
  - The edit route's `shouldRevalidate` ignores `?start`.

## State

- Shared tests 514/514, run in a HEAD copy in the scratchpad. workertwo's #305 WIP breaks the in-tree `director.test.ts` compile, so the in-tree run fails.
- Client vitest 485/485. Typecheck is clean. `pnpm lint` exits 0 with the 7 existing warnings.
- Live headless run on :5173:
  - `?start=-20,300` spawns at (−20, 300).
  - After flying to z 346, Backspace put the ship back at (−20, 300).
  - Shift+Backspace put it at (0, 0) and removed `?start`.
  - Start here on a painted block moved the point to x 1.3 and showed the note. The level stayed dirty.
  - Esc closes the menu.
  - After Close, Backspace spawned at the editor start.
- The first reading after a cold page load can come before the sim runs (elapsed ≈ 0). Wait 1 s after load.
- Owner verification on /test-level [unmeasured].

## Uncommitted

None.

## Held files

#307, approved and cleared: `apps/client/tracks-plugin.ts` + `tracks-plugin.test.ts`, `apps/client/app/routes/test-level/edit/route.tsx`, `track-editor/editor-saved.tsx`, new `track-editor/editor-saved-row.tsx`, `track-editor/track-editor.state.ts`, `packages/shared/src/sim/authored/authored-level.ts` (only the new `forgetAuthoredLevel(id)` export).

## Next

1. Build #307 (owner GO, not started). Read `gh issue view 307` first.
   - `tracks-plugin.ts`: add `deleteTrack(dir, slug)` behind the `trackPath()` guard. It returns 400 for a bad or traversal slug and 404 for an unknown id, then `unlinkSync`. The middleware accepts `DELETE /__tracks/<id>`. Tests: delete a known id, reject an unknown id, reject each HOSTILE slug.
   - `edit/route.tsx` clientAction: branch on form field `intent`. `intent=delete` sends the DELETE and calls `forgetAuthoredLevel(id)`. If `id` is the current `?level=`, redirect to `/test-level/edit`. Otherwise return `{ deleted }`.
   - `shouldRevalidate`: when `formMethod` is set, return `defaultShouldRevalidate`. Today a same-URL action does not revalidate.
   - UI: `editor-saved.tsx` maps rows to `EditorSavedRow`. The row shows edit · play · delete, then "delete? yes / no". `yes` is a `<Form method="post">` submit with intent=delete and id. The confirm id lives in the editor store as `confirmDelete`. No `window.confirm`.
   - Do not commit track deletions the owner makes.
2. workertwo is committing #305 in shared. Before a live check, grep `packages/shared/dist` for the new export (memory `shared-watcher-can-leave-dist-stale`).
3. Push, then `gh issue close 307 -c "<what shipped + SHA>"`.

## Open questions

None. Owner answer on #306: editor Close does not re-spawn at `?start`. Keep it as is.

## Lessons → memory

none
