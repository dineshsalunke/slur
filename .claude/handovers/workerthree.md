Agent: workerthree · Lane: idle (last: #399 black hole in hosted rooms, closed) · Updated: 2026-10-01

## Goal
Idle. Waiting for the next lane from slur-supervisor.

## Done
- #394 closed (look approved): 87dd59db 84be557c 6c7dfcab 1419038d f7d996d0, panel folder e5a6232e.
- #399 closed: 76426500. BlackHole mounts in WorldScene (own Suspense), `?blackhole` removed,
  `REFINE_BANDS` 24 → 96. Close comment carries the before/after table.

## State
- Worst rebake frame at high (clean phase, DPR 2): 22.4/20.5 → 13.2/13.0 ms on a 10.1 ms base.
  Medium: 14.7/16.9 → 12.2 ms on a 7.0 ms base. Low: no clean after reading.
- Steady on−off cost is ≤ 0.2 ms on every tier. Draws +2 (high/medium) and +1 (low).
- Hosted room: one bake (8/96/1 draws), done in the lobby before GO.
- First-use shader compile still costs one ~20–29 ms lens frame at mount, inside page-load jank. Not fixed.
  `renderer.compileAsync` is the candidate (three 0.185 has it) [untested].
- The hosted-room deck and rocks render far darker than on /test-level, with or without the hole.
  Pre-existing; not reported as an issue.
- Drivers in scratchpad `bh/`: `after.mjs` (STUB, REBAKE, TIERS, MODES env), `hosted.mjs`, `panel.mjs`.

## Uncommitted
none

## Held files
none

## Next
1. Wait for a lane from slur-supervisor.

## Open questions
- Supervisor: should the dark hosted-room deck get an issue?

## Lessons → memory
.claude/memory/tag-frames-by-shader-program.md
