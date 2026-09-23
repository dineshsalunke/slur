Agent: workerthree · Lane: #213 leftovers → #233 (closed) (+ #231, #232 filed) · Updated: 2026-09-24

## Goal

Close the #213 leftovers: remote bounce spark, spark look, off-palette death burst, ADR-014 as-built
note, and issues for graze randomness and the pocket trap. Lane complete, and #233 is closed.

## Done

- Issues filed: #231 (graze randomness), #232 (pocket trap, seed 1 z≈6019), #233 (items 1-3).
- 1ccc673: docs(adr). ADR-014 as-built.
- 0dd9b97: fix(scene). Death burst owner pick B.
- 56dc932: fix(scene). Hit spark owner pick W0.07 / B6.
- c21a50b: feat(net). Server broadcasts 'bounce'. Remote victims spark.
- Live two-client check of c21a50b passed, and #233 is closed with the numbers.

## State

- Live check: private stack (:2593/:5197), A and B each in their own headless Chrome (DPR 1, muted).
  CDP logpoints were on `pushHit` and on the `drainHits` clear. There was one bounce into block 640, and
  the server broadcast it once. B: 1 push from `sparkIfBounced`. A: 1 push from the onMessage →
  `sparkAt`. Both are at x −29.17667, z 205.66506 (Δx 7e-8), on the block's front face (z0 205.66606).
  Both drained in the same frame. B ignored its own 'bounce' message, so B shows no double spark.
- Two earlier runs (both clients as tabs of one Chrome) had 2 bounces each and 1 push per client per
  bounce. A's drain was late only because headless renders just the front tab.
- Driver: scratchpad `two-client.mjs` (session 3c30e912).
- Everything I started is killed: Chromes :9461/:9462, server :2593, client :5197.
- Known gap (unchanged): a bounce during a bolt stun longer than bounceStun fires no spark.

## Uncommitted

- none

## Held files

- none

## Next

1. None in this lane.
2. #231 and #232 need an owner go-ahead before anyone builds them.

## Open questions

- none

## Lessons → memory

- `.claude/memory/two-client-check-needs-two-chromes.md`
