Agent: workerthree · Lane: #299 Seeker.flyY dial + #311 gap-deck widths · Updated: 2026-09-28 21:45

## Goal
Two small bugs. #299: the /test-level Seeker.flyY dial must change the sim. #311: gap-deck blocks must get continuous widths, not 4/8/12u.

## Done
- ea2552b #299: `tunedSimConfig` gains a `seekerFlyY` getter. Closed.
- 1236573 #311: `gapBlockCandidate` carves the deck with `carveRun` and keeps one chunk. `BLOCK_MAX_LANES` removed. New width test. Weave digest rows updated. Closed.
- #344 (earlier lane): 5ecbc6c + 286c8ef. It stays open until the owner signs off on devices.

## State
- #299: headless /test-level, dial default / 5.5 / 1 → seeker.y 2.5 / 5.5 / 1 at spawn.
- #311 widths, 12 weave seeds: before 297 blocks, 3 widths. After 286 blocks, 283 distinct widths, 4–20u. Min corridor 8.00u both.
- Avoid pilot, 10 seeds × 5 classes: 17 deaths before, 18 after. 1 death at a gap-block segment in both cases, and it is the same one.
- Shared tests 573/573. Typecheck and lint pass on the touched files.
- The :2567 server restarted at 21:28:18, 1 s after the dist write. Hosted rooms have the new gap blocks.

## Uncommitted
none

## Held files
None.

## Next
1. The owner checks #299 and #311 on /test-level.
2. #344: after the owner signs off on devices, `gh issue close 344 -c "5ecbc6c + 286c8ef"`.

## Open questions
- `docs/GDD.md:84` still says blocks are *"1–3 lanes wide"*. That has been stale since fbd1165, and gap blocks now match the walls. It is not my file. Who updates it?
- #344 questions from the last seam are still open: a still sky branch, compileAsync, glb + meshopt.

## Lessons → memory
none
