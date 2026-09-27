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

None for #306. #307 claims are pending the supervisor's answer.

## Next

1. Wait for the supervisor's go on the #307 plan. Then build: `tracks-plugin.ts` DELETE plus its test, the edit-route action intent, and an inline confirm row in `editor-saved`.
2. Close #307 with the SHA.

## Open questions

- #306: the room does not re-spawn at a new `?start` on editor **Close**, only on Play or a reset. Is that what the owner expects?

## Lessons → memory

none
