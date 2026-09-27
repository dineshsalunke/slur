Agent: workertwo · Lane: #305 strafe kick — fixed 4u step (option B) · Updated: 2026-09-27

## Goal
Each strafe press past the threshold moves the ship exactly 4u (one CELL) for every class, whatever the tap length.
Owner approved option B, "stop dead on release". B→A must stay a config change.

## Done
- b6e3372 feat(#305): 4u kick step, pilot cap, phrase digest re-frozen (owner decision). Tap/hold/lead tables are in the
  commit body.

## State
- Gates on HEAD 167c859 + my 9 files only (tree had no other dirty source): pnpm typecheck ok · shared 521/521 ·
  server 40/40 · client 485/485 · pnpm lint ok (7 pre-existing line-count warnings, step.ts among them) · ratchet ok.
- Phrase digests moved on all 5 seeds; weave and groove unchanged.
- Owner verification on /test-level: [unmeasured] pending.

## Uncommitted
none

## Held files
None after this seam. Released: packages/shared/src/{constants.ts, ship-classes.ts, schema.ts, sim/types.ts,
sim/step.ts, pacing/pockets.ts, sim/strafe-kick.test.ts, race/director.test.ts, sim/track-digest.test.ts (lent, return
to workerthree)}.

## Next
1. Owner verifies on /test-level. #305 closed with the SHA per the owner rule.
2. Optional follow-up: move the strafe functions out of step.ts into sim/strafe.ts (line-count warning).

## Open questions
- Is the held-strafe lag (~one kick window: interceptor −3.9u at 200 ms, freighter −3.7u) acceptable to the owner?

## Lessons → memory
none
