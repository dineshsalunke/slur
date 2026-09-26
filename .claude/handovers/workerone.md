Agent: workerone · Lane: #269 Boost pickup · Updated: 2026-09-26 12:30

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Ship the Boost power: +40% of class top speed for 2 s with a 0.2 s ease-out. A second use resets the timer,
and a stunned racer is refused and keeps the charge. Owner decisions: `gh issue view 269 --comments`.

## Done

- ce01c2d — plumbing: HeldPower.boost/shield, boostRatio+shieldRatio (0), generic bagCounts.
- 3b466ea — sim: SimShip.boostTimer, step.ts boost cap + push, startBoost(), server + test-level wiring.
- 28048e6 — boost-look.ts geometry.
- f448401 — visuals: boost-streaks.tsx + boost-streak-material.ts (mounted in world-scene), boost-pickups.tsx,
  splitPickupLayout boosts + shields buckets, BoostPickups + ShieldPickups mounted in pickup-field and
  local-pickup-field, Snapshot.boost + pushRemote, power-gem double chevron, bind-room-audio boost edge.

## State (measured)

- Gates at f448401: typecheck ✓ · lint ✓ · client 404/404 (new boost-look.test.ts: 3).
- Headless /test-level with Sim.boostTimer forced: twin marigold streaks trail back from the freighter,
  full at 1.5 s, shrinking at 0.1 s, gone at 0. Speed read 174 u/s = 1.4 × 124. Rear-view shows them too.
- Streak tune: LENGTH 10, WIDTH 0.55, INTENSITY 3.5, falloff 2.2. At the chase cam they still reach the
  frame bottom. Owner look call.
- Boost pickup in the scene: not seen (BOOST_RATIO 0, no anchors). Geometry centred (test).
- Remote streaks and the room audio edge: [unmeasured] — needs a hosted room with the ratio on.

## Uncommitted

None.

## Held files

Visuals pushed. traits.ts and attach-room-to-world.ts go back to workerthree now. Holding nothing else
until the supervisor sequences the BOOST_RATIO flip.

## Next

1. Wait for the supervisor to sequence BOOST_RATIO 0 → 0.15 with workerthree (plus power-bag.test.ts counts).
2. After the flip: look at a boost pickup in /test-level headless; drive a hosted room to hear the sfx edge.
3. `gh issue close 269 -c "<SHAs>"` once the flip lands (or comment and leave open if owner sign-off is due).

## Open questions

- Owner: final bag shares (6/4/4/3/3 vs 5/6/6/3).
- Owner: should a brake cancel the boost push? It does now.
- workerthree: test-level local-combat.ts fire() has no playSfx('boost') on the boost branch (their file).

## Lessons → memory

none
