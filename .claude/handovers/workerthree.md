Agent: workerthree · Lane: bounce fixes, #231 + #232 (both closed) · Updated: 2026-09-24

## Goal

#231: a shallow block clip always glances. #232: staggered blocks must not stun-lock a ship. Lane complete.

## Done

- f5c8ff8: fix(sim), #231. `entryPush()` in `sim/step.ts` uses the entry face from the previous tick.
  An end-face entry with lateral overlap < `FlightTuning.grazeDepth` (0.5u, owner) resolves on x.
  `sim/graze.test.ts`. ADR-014 as-built. Issue closed with the sweep table.
- 56711c9: fix(sim), #232. In `bounceOffBlock()`, a hit while `stunTimer > 0` pushes out and stops: no
  knockback, no stun refresh. `sim/pocket.test.ts` pins seed 1 z≈6019 and scans every fairness-seed
  pocket. ADR-014 as-built. Issue closed with the scan table.

## State

- #231, 100 phases. Fighter 0.3u: 68% glance before, 100% after. 0.55–0.8u: 0% glance.
- #232, 8 seeds × 5 classes, 1,213 pockets. Throttle held, stun streak > bounceStun: 729 → 1 (0.0005u
  slack, not enterable). Max bounces in 5 s: 149 → 19. Release + strafe, still held after 1 s: 738 → 23
  (3-sided enclosures with full control; dead ends are workerone's route-graph lane).
- Tests at 56711c9: shared 235/235, server 15/15, client 279/279. Typecheck, biome and the comment
  check are clean.
- Scratch scripts: `stunlock.mjs`, `pocket-scan*.mjs`, `sweep.ts` (session 93637031). No servers and
  no Chrome were started.

## Uncommitted

- none

## Held files

- none (the #231/#232 claims are released)

## Next

1. None in this lane. Waiting for a new assignment.

## Open questions

- none

## Lessons → memory

- `.claude/memory/ab-an-old-sim-from-git-in-scratch.md`
