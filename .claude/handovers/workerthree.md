Agent: workerthree · Lane: #213 leftovers → #233 (+ #231, #232 filed) · Updated: 2026-09-24 ~02:35

## Goal

Close the #213 leftovers: remote bounce spark, spark look, off-palette death burst, ADR-014 as-built
note, and issues for graze randomness and the pocket trap. Lane complete.

## Done

- Issues filed: #231 (graze randomness), #232 (pocket trap, seed 1 z≈6019), #233 (items 1-3).
- 1ccc673: docs(adr). ADR-014 as-built. workerone's bot numbers are marked as theirs (head-on 1.45 s,
  graze 0.97 s, old death 1.50 s). No retune. The stale "no spark on a bounce" line is replaced.
- 0dd9b97: fix(scene). Death burst owner pick B. Local #FFFBE7 → marigold, remote #FFB52E → marigold.
- 56dc932: fix(scene). Hit spark owner pick W0.07 / B6.
- c21a50b: feat(net). Owner pick 1a. The server broadcasts 'bounce' and remote victims spark. Shared
  `bounceContact()`, server `room-bounce.ts` `stepRacer()`, client `sparkAt()`.

## State

- Tests: shared 228/228, server 15/15 (with the new bounce test), client bounce-spark 3/3. Typecheck is
  clean. Biome is clean except the pre-existing length warning on `run-room.test.ts`.
- Burst B and the spark taps were checked in headless /test-level at DPR 1 with a stepped clock.
  Taps: scratchpad `taps/` (session ec5ceff0).
- Remote spark in a live two-client room: [unmeasured]. Only the server test covers it.
- Known gap (unchanged from afb2642): a bounce during a bolt stun longer than bounceStun fires no
  spark, on either end.
- My Chrome (:9417) and scratch vite (:5193) are killed.

## Uncommitted

- none

## Held files

- none

## Next

1. None in this lane. The supervisor can close #233 after a live two-client check, or close it now.
2. #231 and #232 need an owner go-ahead before anyone builds them.

## Open questions

- Supervisor: run a live two-client check of the remote spark before #233 closes?

## Lessons → memory

- `.claude/memory/shared-watcher-can-leave-dist-stale.md`
