Agent: workerthree · Lane: bounce fixes, #231 (closed) then #232 · Updated: 2026-09-24

## Goal

#231: a shallow block clip always glances. #232: staggered blocks must not stun-lock a ship.

## Done

- f5c8ff8: fix(sim), #231. `entryPush()` in `sim/step.ts` uses the entry face from the previous tick.
  An end-face entry with lateral overlap < `FlightTuning.grazeDepth` (0.5u, owner) resolves on x.
  `sim/graze.test.ts`. ADR-014 has an as-built paragraph. Issue closed with the sweep table.

## State

- #231 sweep, 100 phases. Fighter 0.3u clip: 68% glance before, 100% after. 0.55–0.8u: 0% glance.
- Tests at f5c8ff8: shared 232/232, server 15/15, client 279/279. Typecheck and lint are clean.
- #232, measured on the 8 fairness seeds × 5 classes: 1,213 pockets. With throttle held, 729 stun-lock
  (the longest is 5.00 s). The seed 1 z≈6019 Fighter stays stunned 600/600 ticks, even when it steers.
- #232 prototype (a hit during stun = a plain stop, no kick, no stun refresh): stun-lock 729 → 1.
  The 1 left has 0.0005u slack. Scratchpad `step-proto.ts`, `stunlock.mjs`, `pocket-scan*.mjs`
  (session 93637031).
- #232 RFC sent to slur-supervisor. Recommended option 1. Owner Q: bolt-stun drift into a block.

## Uncommitted

- none

## Held files

- packages/shared/src/sim/step.ts (kept for #232)

## Next

1. On approval: build option 1 in `bounceOffBlock`, then add `sim/pocket.test.ts` and an ADR-014 line.
2. Close #232 with the numbers and report the SHA to slur-supervisor.

## Open questions

- #232 owner Q: a bolt-stunned ship that drifts into a block stops dead, with no knockback and no stun
  stacking. Is that OK?

## Lessons → memory

- none
