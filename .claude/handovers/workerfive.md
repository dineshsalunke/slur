Agent: workerfive · Lane: boost blur + camera pull-back #269, close #283 · Updated: 2026-09-26 15:10

## Goal
Radial blur and a 3u camera pull-back while boosting (#269), driven by `boostSurplus`. Colocate
scene-effects, raise the #283 Grit rule to error, and close #283.

## Done
- 4a8e1a8: the frame tap answers once (#172). Closed.
- 9be7439: BOOST_GAIN 0.4 → 0.75 (#269).
- f95d8ad: handover + memory `time-a-post-effect-without-repo-edits.md`.
- f0056b3: `camera/boost-surplus.ts` (+ test), chase pull-back/FOV, `scene/boost-blur/`,
  `scene/scene-effects/` colocation, tunables `Chase.boostBack` 3, `Chase.boostFov` 0, `Boost.blur` 1
  (panel group 'Boost'), Grit rule at `severity="error"`. Pushed.
- #283 closed, citing 87c758f c92a27e e234fcd f0056b3.
- #269 has a comment with the measurements and the NN-13 weighing. It stays OPEN for the owner to feel it.

## State (measured this session)
- `pnpm lint` passes (7 warnings, all pre-existing noExcessiveLinesPerFile). `pnpm typecheck` passes.
- Client vitest 451/451. Shared node:test pass 406, fail 0. These ran in the shared tree, with another
  worker's uncommitted pacing removal present.
- Headless /test-level at full boost (vz 217): the stills show the edges streaking toward the vanishing
  point, a sharp centre and a smaller ship.
- Median frame time mid-boost, DPR 1, 1600×900: blur off 8.10–9.60 ms, blur on 8.30–8.90 ms. The
  difference is within the noise.
- Headless Chrome is closed (Playwright closed it). No stray process.

## Uncommitted
- none from this lane. The tree also holds another worker's staged pacing deletions, which are not mine.

## Held files
- none (the lane is finished). Release all of them.

## Next
- Idle. Wait for the owner's feel verdict on #269, then close it or retune the dials.

## Open questions
- Owner: does the boost feel right in a room? The dials are Boost.blur, Chase.boostBack and Chase.boostFov.

## Lessons → memory
- `.claude/memory/playwright-from-npx-cache-needs-system-chrome.md`
