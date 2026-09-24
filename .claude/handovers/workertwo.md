Agent: workertwo · Lane: /pacing lag (owner; no issue yet) · Updated: 2026-09-24

## Goal

Find out why `/pacing?seed=N` lags, then fix it. Measure first. The owner says something is too big for it.

## Done

- Measured the route and sent the result to slur-supervisor. No code changed.

## State

- analyzeDescriptor in Node: 97–147 ms on each of 20 seeds. Grid is 8000 x 102 = 816k cells.
  `PathSolver.relaxFrom` is the hot spot (40 ms self time).
- Page load: 574 ms. The one long task is the 120 ms clientLoader analyze.
- DOM: 1702 nodes. Track strip SVG: 1200 nodes. The clearance and strafe polylines have 8002 points each.
- Headless scroll and scrub at pps 24 and 240, at DPR 1 and emulated DPR 2: 0 dropped frames. Main
  thread < 1 ms per frame. Zoom click: 32–34 ms.
- The lag is NOT reproduced headless. The owner's repro is unknown [unmeasured].
- Scratch scripts are in the session scratchpad (`cdp.mjs`, `trace.mjs`, `long.mjs`, `top.mjs`,
  `seeds.mjs`). The Chrome on port 9441 is killed.

## Uncommitted

None.

## Held files

None. The proposed claims are pending: option 2 → `routes/pacing/route.tsx` + a new
`analyze.worker.ts`. Option 6 → `board-scale.ts`, `clearance-plot.tsx`, `strafe-plot.tsx`,
`pacing-strip.tsx`.

## Next

1. Wait for the owner's repro steps through the supervisor (which action lags, browser, window, other tabs).
2. Reproduce it with that action, then build the approved option.

## Open questions

1. Which action lags for the owner?
2. Option 4 (PathSolver speed-up) touches `packages/shared/src/pacing`. It needs workerone's RFC agreement.

## Lessons → memory

none
