Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-26, late afternoon

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Grep the status line with `│ [█░]* [0-9]*%`; the first read
after /clear often shows the old percent, so read again. Clear a worker before assigning if it is past 10%.
After sending to an idle worker, check the pane (`herdr pane read <pane> | grep -E "Message from|⏺"`); a queued
message can sit unread, so nudge with `herdr agent prompt <pane> "..."`. Use `bash -c '…'` for herdr loops.

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- WIDTH 96u (24 lanes). MATERIAL: dark graphite pitted metal everywhere; the deck adds the 4×4u plate grid.
- Hosted rooms default to GROOVE. The song work is a throwaway lens, freighter-only.
- #261 mine rules (stun 1.5 s, ×0.6, arm 0.5 s, trigger 3u, ttl 20 s, 3/owner). Every power fires forward (E) or back (F).
- Audio: SCI-FI, not cartoon. CC-BY and CC-BY-SA accepted.
- Ship trails (#10) parked until after beta.
- #269 Boost: +40% of class top speed, 2 s, 0.2 s ease-out, a second use resets the timer, cannot break a stun.
- #270 Shield: 5 s window, absorbs ONE hit; blocks bolt, mine AND homing seeker; not block crashes; visible dome.
  Visual ref for both: `docs/art-direction/ingredients/ingredients.png` panels 2 and 3 (decisions posted on the issues).

## Landed / closed today

#267 ab12a98 · #252 84a2ff7 · #227 closed (a–c in c99c40d; bake ≈112 ms) · sign-offs closed: #163 #170 #215
#222 #251 #264 · #20 split into #269/#270 · #10 #109 #138 #127 closed not-planned.
Code review: 5 reports + merged `.claude/phases/2026-09-26-review/SUMMARY.md` (115abd8). 7 P0 · 15 P1 · ~48 P2.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | #269 Boost, CLEARED for 2 commits | building | constants.ts, sim-config.ts, power-bag.ts, schema.ts, sim/types.ts, step.ts, combat-step.ts, room-combat.ts, local-combat.ts, power-cell.tsx, power-gem.tsx, seeker-pickups.tsx (+ new boost-* files) until its commit 2 is pushed |
| workerthree | w2P:pG | #270 Shield, plan APPROVED | building new files | CLEARED: combat/shield.ts(+test), shield-dome.tsx, shield-look.ts, shield-pickups.tsx, room-shield.test.ts, run-room.ts, ecs/traits.ts, net/attach-room-to-world.ts. WAITS for workerone commit 2: constants.ts, sim-config.ts, schema.ts, room-combat.ts, local-combat.ts, power-gem/cell.tsx, seeker-pickups.tsx, pickup-field.tsx, ship-view.tsx, sfx-map.ts, bind-room-audio.ts, index.ts |
| workertwo | w2P:pF | review done | idle, >10%: clear before reuse | none |
| workerfour | w2P:pH | review done | idle, 24%: clear before reuse | none |
| workerfive | w2P:pK | review done | idle, 25%: clear before reuse | none |

Conditions given to workerone: boost and shield bag shares ship at 0; each lane turns its own kind on. Proposal
6/4/4/3/3 (bolt/seeker/mine/boost/shield of 20) goes to the owner in the #269 close comment. schema fields are
APPENDED and plain (never @deprecated): boostTimer, then shield's field.

## Next

1. workerone: commit-1 SHA → confirm workerthree got it; commit 2 pushed → clear the held files for workerthree.
2. workerthree: review its claims + plan and clear them against the hold above.
3. Owner to pick review fix lanes (SUMMARY.md: A room lifetime, B small P0s, C netcode, D run-view store,
   E render P1s, F track contract, G P2 sweep). Recommended A + B first. Clear two/four/five before assigning.
4. Owner to pick the final bag shares when #269/#270 ship.

## Open owner questions

- Review decisions (SUMMARY.md "Owner decisions needed"): @deprecated rule text; room-in-loader rule vs
  convention; /test-level + /pacing in production; mine spent on failed aim (refund or fizzle); dead post-respawn
  invuln; countdown joiner spectates vs "locks at GO".
- #267 follow-ups: owner ear check in a hosted room; file an issue for the 16 unchosen sound events + Q4–Q6?
- Older: lint files over 300 lines; weave a/b/c; #254 class roles; #244 FRACTURE_RATE; review #236.

## Uncommitted

None of mine.

## Lessons → memory

none
