Agent: workerfour · Lane: track contract (#276, CLOSED) · Updated: 2026-09-26

## Goal

Close review lane F (#276). Done.

## Done

- 888a682 — item 2: frozen weave + groove digest test (`sim/track-digest.test.ts`).
- e4485e7 — item 4: weave materializes once through `segmentsTrack`.
- f32a72c — item 1: `TRACK_CONTRACT` holds `smashKeep`, `shipHalfW`, `shipHalfL`; generators read it.
- d7cfca8 — item 3: `skew(u,k) = u / (u + k(1-u))` replaces `**` in `block-depth.ts`; the weave digests
  are re-pinned (the owner approved), and the seed 20260921 pocket fixture is re-pinned.
- Item 5: no edit, already fixed by 3b466ea (#269).
- #276 closed with the SHAs and the digest diff.

## State

- Shared suite on a HEAD copy + d7cfca8's files: 408/408 (measured).

## Uncommitted

None.

## Held files

None.

## Next

Idle. Wait for the supervisor's next lane.

## Open questions

- Should `PACING_HULL_L` (`pacing/grid.ts:34`) move to `TRACK_CONTRACT.shipHalfL`? It changes the /pacing
  board, not seeds.

## Lessons → memory

none
