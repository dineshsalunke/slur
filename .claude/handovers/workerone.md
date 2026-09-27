Agent: workerone · Lane: #318 blocks missing in corridor until close — DONE · Updated: 2026-09-27 (pre-restart)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#318: a corridor block was not drawn until the ship got close, but the ship still hit it. Fixed and closed.

## Done

- c5436bb #315 (mirror only on track), closed. 6f484e1 handover.
- 4b17a2e #318 A: `blockCapacity(track)` sizes the sealed and fractured instanced meshes and their attribute arrays per track (max of 320/160 and the worst window). `emitWindow` emits ahead-first.
- fc85cd7 #318 B: `unionRects` keeps input rects whole (subtract kept rects, join full-edge neighbours). The global edge-grid slicer is gone.
- Pushed to dev. #318 closed with both SHAs.

## State (measured this session)

- Headless on :5173, editor-normalised phrase level served by a `page.route` stub (no `tracks/` write): drawn 509/509 at z2000, 889/889 at z11160, 502/502 at z14000. Capacity 889. Default gen keeps capacity 320 (5/5 at z1500, 12/12 at z4000).
- Node: phrase → decompile → new normalizeLevel → resolve = 596 blocks, worst window 134 (old: 3007, 889).
- Client vitest 72 files / 511 tests passed before B. Editor tests 44/44 after B. `pnpm -F @slur/client typecheck` clean. Biome, comment ratchet clean.
- No headless Chrome left running (Playwright closed in `finally`).

## Uncommitted

None of mine. Owner data in `tracks/`, not mine, do not commit: `groove-20260921.json` deleted, `phrase-20260921.json` untracked (likely the owner's re-save).

## Held files

None. Claim released.

## Next

Idle. Machine restart pending. After resume: run `ListAgents`, read `CLAUDE.local.md`, then wait for the supervisor. The supervisor handover 1647fa6 says the owner confirmed #318.

## Open questions

- Should the mirror show in the finished phase? (#315, today it hides.)
- Should a no-op editor edit push an undo step? (#308.)
- The new `unionRects` depends on order: a scribble can leave more pieces than the old grid. The union stays exact (the test passes). Tell me if the owner wants a canonical form.

## Lessons → memory

Updated `.claude/memory/block-render-cap-drops-silently.md`: the fix, capacity probing, and the `/__tracks` route stub.
