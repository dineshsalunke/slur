Agent: workerone · Lane: #269 Boost pickup · Updated: 2026-09-26 13:00

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Ship the Boost power: +40% of class top speed for 2 s with a 0.2 s ease-out. Owner decisions:
`gh issue view 269 --comments`.

## Done

- ce01c2d — plumbing: HeldPower.boost/shield, boostRatio+shieldRatio, generic bagCounts.
- 3b466ea — sim: SimShip.boostTimer, step.ts boost cap + push, startBoost().
- 28048e6 — boost-look.ts geometry.
- f448401 — visuals: streaks, pickups, gem, sfx edge, Snapshot.boost, boosts+shields pickup buckets.
- 3a6ae8e — BOOST_RATIO 0.15; default bag 5 bolts / 6 seekers / 6 mines / 3 boosts.
- #269 commented with SHAs (issuecomment-5844110048); left open for owner sign-off.

## State (measured)

- Gates at 3a6ae8e: typecheck ✓ · lint ✓ · shared 400/400 · server 35/35 · client 404/404.
- Hosted room on :5173/:2567, headless Chrome A plus node bot B (scratchpad bot-b.mjs + room-check.mjs):
  own boost 174 u/s, streaks drawn, BOOSTSFX logpoint fired once on A's boost. Remote: Interp boost max
  1.95, streak mesh count 2 while A was not boosting. B was out of frame, so there is no still of a remote streak.
- /test-level: boost pickup renders (graphite slab, two marigold chevrons, light pool).
- Chrome killed; bot exited.

## Uncommitted

None.

## Held files

None. constants.ts and power-bag.test.ts went back to workerthree after 3a6ae8e.

## Next

1. Tell the supervisor 3a6ae8e and the check results. The SendMessage for 3a6ae8e was blocked by the
   auto-mode classifier this seam; the owner was told.
2. Owner answers on #269 → apply (shares, brake cancel, streak length) → close #269.

## Open questions

- Owner: bag shares; brake cancels boost push (yes now); streak length 10u.
- workerthree: test-level local-combat.ts fire() has no playSfx('boost').

## Lessons → memory

.claude/memory/node-bot-as-second-racer.md
