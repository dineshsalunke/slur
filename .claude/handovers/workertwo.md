Agent: workertwo · Lane: #334 block side hit should scrape (APPROVED, build next) · Updated: 2026-09-28 00:05

## Goal
A side or corner hit on a block scrapes and keeps about 90% of vz, with no stun and no throttle drop. A head-on hit is unchanged. Owner: "sidehit should not really reduce the speed; if we want to it should be very less, ~10% is ok."

## Done
- f664fee #335: tug halved (pull 1 s, ease 0.5, tow 1 s, rope DETACH_S 0.25). Closed.
- #334 plan approved by the owner through slur-supervisor (2026-09-28). No #334 code written yet.

## State
- Reproduced with simulate() on scratch copies of dist, all 5 classes, throttle held:
  - Head-on: vz → -9 plus a 0.25 s stun. Correct.
  - Straight clip with 0.8u overlap: vz → -9. Cause: step.ts:264 `if ( fromEnd ) return Math.abs( x.delta ) < t.grazeDepth ? x : z;` with grazeDepth 0.5.
  - Holding strafe into a block side: vz → 0 in about 3 s. Every re-hit stuns for 0.25 s; `step.ts:379` swaps input for NEUTRAL_INPUT, so the throttle drops and the ship coasts about 10 u/s per hit. The #305 kick floor drives the ship back into the wall.
  - Diagonal corner stops came in through the front face in all but 0–1 per class (swept check). What is left after the new rule has ≥ 1u of nose overlap, which counts as head-on.
- Candidate A/B on a scratch step.js (rules below, keep 0.88; the owner then chose 0.90):
  - clip 0.8 → vz 74–109, time lost 0.01 s (was 3.7 s)
  - 4 s holding strafe into the wall keeps cruise (was 0)
  - head-on unchanged
- Scratch scripts are gone after the clear. Rebuild the A/B from the rules below if needed.

## Uncommitted
none

## Held files (claim CLEAR from the supervisor, 2026-09-28)
packages/shared/src/sim/step.ts, packages/shared/src/constants.ts, packages/shared/src/sim/bounce-contact.ts, packages/shared/src/run/racer.ts, packages/shared/src/pacing/pockets.ts, packages/shared/src/sim/{graze,step,bounce-contact,avoid-pilot}.test.ts, new packages/shared/src/sim/scrape.test.ts, apps/client/app/game/ecs/{bounce-spark,systems,net-systems}.ts, docs/DECISIONS.md (ADR-014 as-built note).

## Next — build spec (owner-approved)
1. **constants.ts**: add `scrapeKeep: number` to FlightTuning, with DEFAULT_TUNING `scrapeKeep: 0.9`. Change `grazeDepth: 0.5` to `1.0`. Classes spread DEFAULT_TUNING; verify with grep in ship-classes.ts. No leva dial (memory test-level-dials-miss-the-predictor).
2. **step.ts `entryPush`**:
   - Add `fresh: boolean` to BlockPush.
   - fromEnd && fromSide (both outside last tick) → pick by swept entry fraction; the axis crossed later wins. Fraction: `d = c - p; d > 0 ? (lo - (p + half)) / d : (hi - (p - half)) / d`.
   - End entry → x if `|x.delta| < grazeDepth` (corner slide, fresh = true), else z.
   - Side entry → x, with `fresh = gap > 2 * BOUNCE_CLEARANCE`. The gap is taken from prevX to the face being pushed out of: `delta < 0 ? b.x0 - (prevX + halfW) : (prevX - halfW) - b.x1`.
   - Neither outside → shallowest, unchanged.
3. **step.ts `bounceOffBlock`**:
   - x axis: push out, keep `if ( s.vx * dir < 0 ) s.vx = dir * kick`, and `if ( push.fresh && s.vz > 0 ) s.vz *= t.scrapeKeep`. **No stun.** Return 'scrape'.
   - z axis: unchanged, with the stun. Return 'hit'.
4. **Contact kind**: resolveCollisions returns `'hit' | 'scrape' | null` and simulate returns it; dead and no-track paths return null. `bounceContact( s, contact, vzBefore, t )` fires when contact is 'hit', or 'scrape' with fresh. Only fresh scrapes are reported, so there is no per-tick broadcast. Keep the existing stun-rise trigger if a bolt path relies on it; check bounce-contact.test first.
   - Update callers: run/racer.ts, client ecs/bounce-spark.ts (sparkIfBounced), ecs/net-systems.ts:48, ecs/systems.ts:16.
   - Scrape = spark only. No sound, no blink: both key off stunTimer, which a scrape never raises.
5. **Harnesses**:
   - avoid-pilot.test.ts:152/157 counts bumps on `stunTimer > 0` edges. Make it also count any non-null contact from simulate().
   - pockets.ts:197 `if ( s.dead || s.stunTimer > 0 ) return false;` must also fail on any contact.
6. **Tests**:
   - Rewrite graze.test.ts for depth 1.0: clips < 1.0 slide with vz = cruise × 0.9 and no stun; clips ≥ 1.0 stop. Its "detect" uses stunTimer, so switch it to the contact return.
   - Side-strafe test: no stun, and vz ≥ 0.9 × before.
   - New scrape.test.ts: holding strafe into a long wall for 4 s keeps vz = cap for every class; one fresh loss only; head-on still gives -bounceBack plus a stun.
7. **Gates**:
   - `pnpm --filter @slur/shared test` must be all green, including phrase/weave/groove (0 bumps, 0 deaths), pocket.test, strafe-kick.test, fracture.test and the track digest.
   - Also run server tests, `pnpm typecheck`, and `pnpm lint` on the touched files. No comments in the source.
8. DECISIONS.md: add an ADR-014 "As-built — a side hit scrapes (#334)" note with the measured numbers above.
9. Commit by pathspec and push.
10. `gh issue close 334 -c "<SHA + what shipped>"`.
11. Send the supervisor the SHA and a /test-level brief: "strafe into a block side and hold: no blink, speed holds; clip a corner with the wing: slide off at ~90%; nose-on: bounce + stun as before".

## Open questions
none (sound and dial: the defaults were accepted by silence)

## Lessons → memory
.claude/memory/strafe-kick-recontacts-every-tick.md
