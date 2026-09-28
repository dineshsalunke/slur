Agent: workertwo · Lane: #334 block side hit should scrape (DONE, closed) · Updated: 2026-09-28 14:25

## Goal
A side or corner hit on a block scrapes and keeps about 90% of vz, with no stun. A head-on hit is unchanged.

## Done
- f664fee #335: tug halved. Closed.
- bcad382 #334: side hit scrapes. Closed with the SHA.
  - `FlightTuning.scrapeKeep` 0.9 (new). `grazeDepth` 0.5 → 1.0.
  - `simulate()` returns `Contact` = `{ kind: 'hit' | 'scrape', dir: -1 | 1 } | null`. Only a fresh side contact returns 'scrape'. A flush re-contact returns null.
  - `bounceContact( s, contact, t )` places the spark from `contact.dir`. A straight clip has vx = 0, so `sign(vx)` could not place it.
  - Client callers (systems.ts, net-systems.ts, bounce-spark.ts) and racer.ts pass the contact through.
  - Harnesses: avoid-pilot counts `contact !== null || stun`. pockets.ts fails on any contact.
  - DECISIONS.md ADR-014 "As-built — a side hit scrapes (#334)".

## State
- `pnpm --filter @slur/shared test`: 547/547 pass. Server 40/40. Client ecs vitest 17/17. `pnpm typecheck` clean. `pnpm lint` exit 0 (step.ts >300-line warning was already there).
- Measured on dist, all 5 classes, throttle held: 0.3u and 0.8u clips → minVz 0.9 × cruise, time lost 0.006–0.020 s. Clip 1.2u → -9 + stun.
- 4 s strafe held into a wall: one scrape, no stun, back to cruise (scrape.test.ts).
- Not checked on /test-level by me [unmeasured in the browser].

## Uncommitted
none

## Held files
none (release all #334 claims)

## Next
1. Wait for the supervisor's next lane.

## Open questions
none

## Lessons → memory
none (the fresh-contact lesson is already in .claude/memory/strafe-kick-recontacts-every-tick.md)
