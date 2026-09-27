Agent: workerone · Lane: #315 rear-view mirror in lobby (done) · Updated: 2026-09-27 10:56

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#315: the rear-view mirror drew in the lobby. Show it only on track. **Done, pushed, #315 closed.**

## Done

- c5436bb #315. `game/scene/rear-view.tsx` wraps `RearViewPass` in `<PhaseGate phases={ ON_TRACK_PHASES }>` (countdown + racing, same gate as `NetHud`).

## State

- Client typecheck clean. Biome clean on the file. Client vitest `app/game`: 384/384.
- Lobby cost: the pass unmounts, so its `useFrame` render stops. drei `useFBO` disposes the target on unmount (`Fbo.js:42`, read this session).
- Mirror hidden in the lobby and after the finish, shown in countdown and racing [unmeasured in browser]. Owner verifies on /test-level and a hosted room.

## Uncommitted

None. The untracked `tracks/*.json` files belong to the owner.

## Held files

None.

## Next

1. Wait for a lane from the supervisor.
2. Possible #308 follow-up: skip the history push when `applyTool` returns the same blocks and gaps. `track-editor.state.ts` needs room first (297/300 lines).

## Open questions

- Should the mirror also show in the finished phase (spectating)? Today it hides.
- Should a no-op editor edit push an undo step? Today it does.

## Lessons → memory

none
