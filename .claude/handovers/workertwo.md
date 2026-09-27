Agent: workertwo · Lane: #335 tug halving (DONE, closed) + #334 block side hit (PLAN sent, awaiting owner) · Updated: 2026-09-27 23:15

## Goal
#335: halve the tug pull and tow so the tug stops feeling like boost. #334: a side or corner hit on a block should scrape and keep most of the speed.

## Done
- f664fee #335: TUG_S 2→1, TUG_EASE_S 1→0.5, TOW_S 2→1 (packages/shared/src/combat/tug-constants.ts) and DETACH_S 0.5→0.25 (tug-line.constants.ts). The tug-status ease test now counts the one-tick cap lag. Closed #335.
- #334 plan sent to slur-supervisor (it was relayed to the owner). No #334 edits yet.

## State
- #335: across the 250–450u block band every class gets the full 1 s pull and no early reel release. Gain over cruise is 32–46u (was 63–93u). Measured with simulate() on the flat track in scratch.
- #335 gates: shared 546/0, server 40/0, tug-line vitest 23/0, typecheck clean, biome clean on the touched files.
- #335 owner /test-level check [unmeasured]. A leva value the owner saved earlier may override the new defaults.
- #334 measured (scratch simulate(), throttle held, 5 classes):
  - Holding strafe into a block side takes vz to 0 in about 3 s. Every hit gives a 0.25 s stun, the stun swaps in NEUTRAL input and coasting loses about 10 u/s per hit. This is cause 3.
  - A straight clip with overlap ≥ 0.5u gives vz -9 (step.ts:264, grazeDepth). This is cause 1+2.
  - Diagonal corner stops are real front-face entries: 0–1 per class came in through the side.
- #334 candidate A/B, done on a scratch copy of dist step.js:
  - grazeDepth 1.0 (was 0.5).
  - A side or corner contact gives no stun, keeps vz × 0.88 on a fresh contact only (the hull was not flush with the face on the previous tick), and keeps the vx 9 bounce.
  - Result: a clip of 0.8 → 74–109 u/s; holding a wall for 4 s keeps cruise; head-on is unchanged.
- The scratch scripts are in the session scratchpad (repro2.mjs, ab/mk.cjs, ab/mk2.cjs, ab/cmp2.mjs). They are lost at session end. Rebuild them from the plan if needed.

## Uncommitted
none

## Held files
none. For #334, claim these on approval: shared sim/step.ts, constants.ts, sim/bounce-contact.ts, run/racer.ts, pacing/pockets.ts, sim/{graze,step,bounce-contact,avoid-pilot}.test.ts, new sim/scrape.test.ts; client game/ecs/{bounce-spark,systems,net-systems}.ts; docs/DECISIONS.md.

## Next
1. Wait for the owner to answer on #334: flat vs impact-scaled scrape loss, the scrape sound (default spark only), and no leva dial.
2. On approval:
   - simulate() returns 'hit' | 'scrape' | null.
   - bounceContact fires on either value.
   - The avoid-pilot bump counter and pockets.ts squeezesThrough count a scrape as a contact.
3. Gates: phrase/weave/groove 0 bumps and 0 deaths, escape windows unchanged, strafe-kick.test, graze.test rewritten.

## Open questions
- #334: the three owner questions above.

## Lessons → memory
none
