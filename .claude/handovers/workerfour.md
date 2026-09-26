Agent: workerfour · Lane: track contract (#276, open) · Updated: 2026-09-26 13:10

## Goal

Close review lane F (#276): track materialization never reads the roster, frozen groove + weave digests,
no `**` in the shared path, cached weave `segmentAt`, and resolve the SimConfig item.

## Done

- 888a682 — `sim/track-digest.test.ts`: frozen weave + groove digests, seeds 1, 7, 42, 1337, 24301.
- e4485e7 — item 4: weave materializes once through `segmentsTrack`. Digests unchanged.
- f32a72c — item 1: `TRACK_CONTRACT` holds `smashKeep`, `shipHalfW`, `shipHalfL`; generators read it.

## State

- Item 3 built, NOT committed: `skew(u,k) = u / (u + k(1-u))` replaces both `**` in `block-depth.ts`.
  Constants `BLOCK_{DEPTH,WIDTH}_CURVE_K_{REST,PEAK}` = 3.5948 / 0.5157 and 1.1435 / 0.5157
  (k = 2^bias − 1, exact median match at both intensity ends) (measured).
- Distribution delta sent to the supervisor. The worst is a depth mean ~0.6u shallower at intensity 0.5 (measured).
- New weave digests: 1 c78e794b40a4db08 · 7 4bf512943bec56be · 42 e50cf66a6f0bda87 ·
  1337 c980d5acb52c8ac9 · 24301 9fd8eac3611abecf. Groove unchanged (measured).
- HEAD copy + my 2 files: 402/404. Failures: the weave digest, and `pacing/pockets.test.ts` "phantom …
  3.2u stop window". The window is now 2459.7–2463.2 (3.5u) (measured).
- Item 5 needs no edit: already fixed by 3b466ea (#269) (read in source).

## Uncommitted

`sim/block-depth.ts`, `constants.ts` (218–223), `sim/track-digest.test.ts` (new weave FROZEN), `pacing/pockets.test.ts`
(phantom squeeze re-pinned 2459.7/2463.2; names now 2.6u / 3.6u / 3.5u). HEAD copy + these 4: 404/404 (measured).

## Held files

`sim/block-depth.ts`, `sim/block-depth.test.ts`, `sim/track-digest.test.ts`, `constants.ts` 218–223.
`pacing/pockets.test.ts` (cleared by the supervisor).

## Next

1. WAIT for the owner's OK (via the supervisor). The edits are already in the tree.
2. Re-run the suite on a HEAD copy if HEAD moved.
3. Commit by pathspec, push, then `gh issue close 276` with SHAs 888a682, e4485e7, f32a72c and the item-3
   SHA, plus a note that item 5 was fixed by 3b466ea.
4. If the owner refuses: revert the 4 files with `git restore -- <paths>` (they're my own edits).

## Open questions

- Should `PACING_HULL_L` (`pacing/grid.ts:34`) move to `TRACK_CONTRACT.shipHalfL`? Out of scope unless asked.

## Lessons → memory

none
