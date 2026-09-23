Agent: workerthree · Lane: monolith seam flicker (read-only, no issue yet) · Updated: 2026-09-24 ~01:45

## Goal

Find why the monolith seams flicker. Owner: *"suddenly the seams on the monoliths have started flickering
did we change something ?"* and *"the flickering is very strong if the monolith is farther way, as the
monolith come closer to camera flickering stop reducing and then stops completely"*. Read-only lane. Report
the cause with numbers and a proposed fix to slur-supervisor. Write nothing in the tree.

## Done

- Previous lane #229 is closed out: `db2660c` rail lip, handover `0f8a7d1`.
- This lane: measurements only, nothing committed except this handover.

## State

- Suspect commits since c82f4f4: 81c2b76, 9688d40, db2660c, f6e9874. The seam geometry and material are
  unchanged (supervisor verified the diff). What changed at 81c2b76: the body went from the sealed-block
  Metal046B maps (dark metal) to `monolithSurface()` deck material, plus `patchRailGlow`. The deck plate
  grid is now visible on the pillars.
- Fresh headless load at HEAD, still camera: 12 frames at 100 ms, seam identical in every frame (mean
  2.57 px per row, 0 of 201 rows missing, both pillars). No idle flicker on a fresh load.
- Moving (W held, 30 CDP screenshots, ~350 ms apart): a fixed-box metric is confounded because pillars pass
  through the box. Discard those per-frame numbers.
- By eye (`move-12`): a far pillar's seam reads as a solid 1 px line. My frame 13/14 crops missed the
  pillar, so there is no far-distance flicker evidence yet [unmeasured].
- Estimate [inferred]: `EDGE_SEAM.width` 0.5u at 200–400u is 1.5–0.7 px (588 px/rad at 900 px tall,
  fov 75). That is sub-pixel at pillar spacing, the same mechanism as #229. It fits the owner's "strong far,
  gone close".
- Not yet tested: the z-fight hypothesis. The seam box is `seam.proud` 0.5u deep, centred on the chamfer
  corner, so about 0.25u stands out. Also not tested: the plate-joint grid of the new body as the
  "seams" the owner means, and the pre-81c2b76 comparison.
- Tools in scratchpad: `png.mjs` (decode/encode/crop), `seq.mjs` (CDP screenshot sequence, optional held
  key), `cdp-set.mjs` (set tunables + reload + tap). The scratchpad is session-local and may be gone after
  /clear.
- Scratch :5183 and headless Chrome :9333 are killed.

## Uncommitted

- none

## Held files

- none (read-only lane)

## Next

1. The screenshots are ~350 ms apart, too slow to see flicker. Use a stepped clock instead
   (`step-the-r3f-clock-for-timed-taps.md`): place the ship over CDP (`place-the-ship-over-cdp.md`) so one
   pillar sits 300u ahead. Step the camera forward about 0.5u per frame for 20 frames and find the seam by
   its own emissive in each frame (`probe-by-feature-not-by-pixel.md`). Record core width and peak R.
   Popping between 0 and 1–2 px means aliasing.
2. Discriminate z-fight from aliasing: at the far pose, raise `Monolith.seamEmissive` only (aliasing stays
   and z-fight stays), then widen the seam in a scratch copy (fixes aliasing) or push `proud` out (fixes
   z-fight). Use `git show <sha>:<path>` into a scratch copy only. Never check out in this tree.
3. Check whether the owner means the emissive seam or the deck plate joints. Compare the far pose with
   `Monolith.plate` 0 (f6e9874 removes the joints).
4. Pre-81c2b76 A/B: serve `git show c82f4f4:` copies of monolith-group.tsx and monoliths.tsx in a scratch
   worktree-free copy? No. Ask the supervisor how to serve an old file without touching the tree.
5. Report to slur-supervisor. Candidate fixes: widen the seam with distance (screen-space minimum width),
   or `polygonOffset`/more proud depth if it is z-fight.

## Open questions

- Supervisor: how to serve a pre-81c2b76 monolith file for the A/B without writing in the tree (a second
  checkout needs owner approval per CLAUDE.md).

## Lessons → memory

- none new this seam
