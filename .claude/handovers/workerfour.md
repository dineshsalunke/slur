Agent: workerfour · Lane: track contract (#276, open) · Updated: 2026-09-26

## Goal

Close review lane F (#276): track materialization never reads the roster, frozen groove + weave digests,
no `**` in the shared path, cached weave `segmentAt`, and resolve the SimConfig item.

## Done

- 888a682 — `packages/shared/src/sim/track-digest.test.ts`: sha256 digest per seed (1, 7, 42, 1337,
  24301) for weave and groove over `segmentAt(-LEAD-2 … TRACK_SEGMENTS+1)`, `finishZ` and anchors.
  Values generated from a HEAD copy in scratch.
- e4485e7 — item 4: weave materializes once through `segmentsTrack` (`sim/track.ts`). Digests unchanged.
- f32a72c — item 1: `TRACK_CONTRACT` gains `smashKeep 0.45`, `shipHalfW 1.3`, `shipHalfL 3`;
  `rosterContractFailures` checks them; `fracture-shadow.ts`, `merge-blocks.ts`, `pickup-place.ts` read
  the contract, not `SHIP_CLASSES`. New test in `track-contract.test.ts`. Digests unchanged.

## State

- Shared suite on a HEAD scratch copy + my files: 404/404 pass (measured).
- Digest sensitivity: `FRACTURE_SHADOW_S` 1 → 1.2 fails the groove digest (measured).
- Weave `segmentAt`: 19.3 µs → 0.024 µs per call; build ~20 ms both before and after (measured).
- Item 5 needs no edit: `simulate()` reads `cfg` since 3b466ea (#269); the server passes
  `DEFAULT_SIM_CONFIG` through `world.config`, and the client passes `DEFAULT_SIM_CONFIG` (read in source).
- `pacing/grid.ts:34` `PACING_HULL_L = SHIP_CLASSES.freighter.tuning.halfL` still reads the roster. Only
  the /pacing analysis (`CONTRACT_HULL` → `buildGrid`, `route-graph.ts`) uses it, not a generator
  (grep, not a run).
- Supervisor flagged a format error on track-digest.test.ts: `git status` is clean for it and biome
  passes on it at f32a72c (measured). Probably a stale reading.

## Uncommitted

None.

## Held files

`packages/shared/src/sim/block-depth.ts`, `sim/block-depth.test.ts`, `sim/track-digest.test.ts`
(item 3). Released everything else once f32a72c is pushed.

## Next

1. Item 3: replace `u ** bias` (`block-depth.ts:19`) and `r() ** bias` (`:45`) with a curve that uses no
   transcendentals. Bias ranges: depth 2.2 → 0.6, width 1.1 → 0.6, interpolated by intensity. A candidate
   is a rational curve, `u / (u + k(1-u))` with `k` from the bias, or a small fixed polynomial. Measure
   the depth/width distribution against `**`.
2. This changes the weave digests. Report the old/new digest diff and the distribution delta to
   slur-supervisor, then WAIT for the owner's OK before committing.
3. After the OK: re-pin the weave values in `FROZEN`, commit, then close #276 with the SHAs and a note
   that item 5 was already fixed by 3b466ea.

## Open questions

- Should `PACING_HULL_L` move to `TRACK_CONTRACT.shipHalfL`? That changes the /pacing board (3 vs the
  freighter's halfL), not seeds. Out of scope unless the supervisor wants it.

## Lessons → memory

none (existing memories `test-your-lane-against-head.md` and the zsh word-split note in
`sub-pixel-geometry-drops-out-without-aa.md` both covered this seam).
