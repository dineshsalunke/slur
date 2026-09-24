Agent: workerone · Lane: R4 S3 — emitter (#250) · Updated: 2026-09-24 18:15

The approved RFC: `.claude/phases/2026-09-24-r4-score-rfc.md` (798ac1d). Older versions of this file hold
history: 4e66705 (S2 seam), 4eacff7 (S1 seam), e868c04 (rev 2 numbers), 192787f (R4 brief).

## Goal

- S3 (RFC §12 step 4): score → geometry (M4 band on the score line, M1 accents, N2/N3 filler outside the
  ±5u calm tube). New files only, because `sim/track.ts` is dirty with workerthree's #244. The `gen:'score'`
  switch goes to the supervisor as a diff, like #248.

## Done

- `798ac1d` RFC · `c24f2bb` S0 · `4eacff7` S1 · `4e66705` S2.
- S3 emitter (this seam, SHA in the commit that carries this file):
  - `sim/score/emit.ts`: `scoreSpans` gives one open interval `[a, b]` per z-span, with walls from each
    edge to the deck edge. Roles: calm (the walled side is at line ± `CALM_TUBE_HALF` 5, on the next move's
    side; the other side is open to `freeReach` = corridorWidthLanes × 4 − 5), preview (a 4u pin just before
    each lateral onset, at line ± `SCORE_PIN_HALF` 2.5), move (the union of old and new), gate (20u, the
    behind side pinned at 2.5; the far side is `SCORE_GATE_FAR` 5.5 when the next move is the same way or
    the note is an accent), smash (a fractured ±3u block in a ±5u slot). `J` = 1 hole segment, `JJ` = 2.
    N3 = seeded 4×4u bumps on the free-side wall in calms ≥ 40u. `emitSegments`, `emitScore`,
    `segmentsTrack( segments, length )`, `scoreTrack( seed )`.
  - `compose.ts`: phrase 0 is always one rest (the first pin cannot sit in start-safe).
    `SCORE_LINE_LIMIT` = HALF_WIDTH − MIN_LANE + hull = 26 (an edge gate keeps 8u).
- Why pins, not the tube alone: the easiest-route solver minimises lateral travel, and it moves as early as
  the walls allow. With the ±5u tube it moved 1u for a 4u step and drifted 3u early. Both runs are under
  the transcriber's 3.4u minimum step, so notes vanished (adherence 0.67–0.74). The pins fix it. The calm
  tube stays ±5u clear in every calm span.

## State

- Seeds 1–30 with the standard library: adherence **1.000 on every seed**. The transcript round-trips
  token for token on all 30. Path stuck rows 0. Slices under MIN_LANE 0. sealShadowed changes 0 blocks.
- Blocks per track: mean **914** (865–941). Today's weave has ~466. Worst 58-segment window is well under
  the 320 budget [asserted in the test for 6 seeds].
- Accents (a test library `!l J !r` etc.): 100% played on 3 seeds. Smash (a test library `S l S`):
  sealShadowed leaves every block alone. Width ≥ MIN_LANE with the fractured blocks taken out.
- The reference path treats fractured blocks as solid (`CONTRACT_HULL.solid` = SOLID_ALL). So an `S` note
  makes the easiest route stuck. The standard library has no `S`, so no seed shows it.
- Tests: 306/306 shared in the scratch copy at HEAD + S3 (296 + 10). The suite took 596s this time.
  respawn.test and grid.test were slow; load average 18.8 [inferred: machine load; the emit and compose
  files take ~1s each]. biome and the comment ratchet are clean.
- Real ship clearance at a pin: 0.5u (hull 2u, settle tolerance 0.25u) [unmeasured in flight].

## Uncommitted

None.

## Held files

- `packages/shared/src/sim/score/*` · `packages/shared/src/pacing/*` + tests · the pacing and score export
  lines in `packages/shared/src/index.ts` · `apps/client/app/routes/pacing/*` · `sim/fracture-shadow.ts` + test.

## Next

1. The `gen:'score'` switch as a diff file in the scratchpad (not the tree). `space.ts`: `gen?: 'weave' |
   'score'` last on `ProcgenDescriptor`. `track.ts`: `makeProcgenTrack` returns `segmentsTrack( emitScore(
   composeScore( seed, length ) ).segments, length )` when `d.gen === 'score'`. `schema.ts:72` gains a plain
   string field LAST (`@type( 'string' ) gen = 'weave'`), plus lines 83/97. Test it through the
   client-decoded state (memory `deprecated-breaks-reflection-decoding.md`). Hand it to the supervisor.
2. Conflict to flag: `JJ` = 2 adjacent hole segments. `track.test.ts:236` "no two gaps in a row" fails on a
   `'score'` track with any `JJ`. The RFC §4.5 missed it. Either the test counts a `JJ` as one gap, or `JJ`
   uses split floors.
3. S4: forks, pickups (`anchors: []` today), and a smash solver (SOLID_SEALED hull for `S`).
4. S5: fly the emitted geometry with the contract ship at 55 and 124 u/s through `simulate()` with
   collisions (the 0.5u pin clearance).

## Open questions

- Owner/supervisor: blocks go from ~466 to ~914 per track. It is under the render budget, but the corridor
  reads walled. Want a lighter free side (walls only where a pin is needed)?
- Owner: `SCORE_PIN_HALF` 2.5 puts a wall 0.5u from a settled hull at each note. Accept for playtest?

## Lessons → memory

- `.claude/memory/easiest-route-moves-early.md` (written this seam).
