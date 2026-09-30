Agent: workerone · Lane: RFC-349 F4a bolt (#395) — DONE, pushed 85365ecc, issue closed · Updated: 2026-09-30

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#395: move bolt into two feature folders per owner D4–D7, measure per RFC §3.8.

## Done

- #390 closed (f4e78880, §3.8 numbers in the close comment).
- **F4a: 85365ecc**, pushed to dev. #395 closed with the numbers.
- Docs in the same commit: RFC §3.8 "F4a result" + §7 F2/F3/F4a rows; `conventions/features.md` §3 F4a slot rules
  (run.strike, bagRest, RunContext.resolveMine/nextId, bolt-schema leaf, no-fields typing) + table rows.

## State (measured this session)

- RunSim A/B, HEAD dist vs F4a dist, 4 racers × 3600 ticks × 6 seeds: per-tick state + broadcast hashes all equal.
- 800 power bags over 5 configs equal HEAD. `powerBag( '42', 3 )` pinned in `power-bag.test.ts`.
- 2 SDK clients on :2567: 3 bolts decoded, 2 hits on B + 1 wall hit on both, 0 decode logs.
- /test-level draws 74 (DPR 1, quality high). Frame ms not A/B'd (one stack, no HEAD client).
- Every shared dist module imports alone: no TDZ.
- Bolt outside the folders: 34 → 29 non-test (5 shared, 24 client, 22 of them D7).
- shared 585/585, server 99/99, client 721/721; typecheck + lint clean.
- Scratch (lost if /private/tmp clears): `…/c6578256-4dd3-4107-8f04-ad524f3c9aff/scratchpad/`
  `run-bench.mjs` (run-level hash A/B), `bag-ab.mjs`, `inproc-bolt.mjs`, `d1-bolt.mjs` (2-client wire check),
  `f4-frame.mjs` (draws), `old/` = pre-F4a shared dist.

## Uncommitted

- none of mine. The tree also holds workertwo's meteor-* files and `dev/tuning-schema.ts` (not mine).

## Held files

- none. The supervisor can release the F4a claim.
- Claim addendum, now committed: `player-fields.ts` (1-line typed `Object.entries`), `engine/active-features.test.ts`,
  `features/tug/tug-run.test.ts` (RunContext fields).

## Next

1. Wait for the next lane from slur-supervisor (F4b seeker would follow the same pattern; seeker shares
   `HitShip`/`hitShipsOf` in `combat/projectiles.ts` and the `nextId` counter).

## Open questions

- Owner: 22 client files still name bolt under D7 (streaks, embers, BOLT_* palette used by mines/seekers/finish
  gate/pickups, block shake, SFX, schema listeners). A later stage could rename the shared ones to neutral names
  (e.g. `shot-streaks`, `HOT` palette) to reach the ≤ 2 target.

## Lessons → memory

- `.claude/memory/node-bots.md` updated: batch SDK inputs every 2nd tick; the room caps 60 msg/s and kicks (4002)
  or freezes a bot over it.
