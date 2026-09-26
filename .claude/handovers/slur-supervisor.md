Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-26, evening

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Grep the status line with `│ [█░]* [0-9]*%`; the first read
after /clear often shows the old percent, so read again. Clear a worker before assigning if it is past 10%.
After sending to an idle worker, check the pane (`herdr pane read <pane> | grep -E "Message from|⏺"`); a queued
message can sit unread, so nudge with `herdr agent prompt <pane> "..."`. Use `bash -c '…'` for herdr loops.
Before a /clear, read the pane's prompt box: unsent text there may be the owner's.

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
- Review decisions (2026-09-26): keep dead schema fields plain, never @deprecated (#278) · keep room on
  singleton + loader, fix the rule (#278) · /test-level + /pacing dev-only (#279) · failed mine aim spends
  and shows a fizzle (#280) · dead post-respawn invuln: supervisor removes it (#281).

## Landed / closed today

#267 ab12a98 · #252 84a2ff7 · #227 closed · sign-offs closed: #163 #170 #215 #222 #251 #264 · #20 split into
#269/#270. Code review: `.claude/phases/2026-09-26-review/SUMMARY.md` (115abd8).
#269 Boost: ce01c2d (kinds) · 3b466ea (sim) · 28048e6 · f448401 (visuals) · 3a6ae8e (BOOST_RATIO 0.15). Open
until workerone's remaining checks (a boost pickup in the scene, remote streaks, room sfx).
#270 Shield: c9e78a3 (core, dome, pickup look), not wired in yet.

## Review issues filed (2026-09-26)

#271 A room lifetime (P0) · #272 B small P0s · #273 C netcode · #274 D run-view store · #275 E render P1s ·
#276 F track contract (reshapes weave seeds) · #277 G P2 sweep · #278 rule text · #279 dev-route gate ·
#280 mine fizzle · #281 remove invuln. None assigned yet.
Collisions: #271/#275 touch `net/attach-room-to-world.ts`; #280 touches room-combat.ts/local-combat.ts. Both
are #270 files, so wait until the shield lands.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | #269 Boost | checks after the flip | none after 3a6ae8e |
| workerthree | w2P:pG | #270 Shield | resumed (cleared) | constants.ts, power-bag.test.ts, sim-config.ts, schema.ts, room-combat.ts, local-combat.ts, run-room.ts, sfx-map.ts, index.ts, power-cell.tsx, ecs/traits.ts, net/attach-room-to-world.ts + its shield files |
| workertwo | w2P:pF | #272 small P0s + #282 countdown joiners | resumed, claims pending | pending |
| workerfour | w2P:pH | #278 rule text + #279 dev-route gate | resumed, claims pending | pending |
| workerfive | w2P:pK | #271 room lifetime | resumed, claims pending | pending |

Owner answers for #270: shield share 0.15; pop reuses the ship-hit sound, played faster.
The unsent text in idle prompt boxes is Claude Code's suggested reply, not the owner's.

## Next

1. Review claims from workertwo, workerfour, workerfive against workerthree's hold.
2. Unassigned: #273 C, #274 D, #275 E (after #270), #276 F, #277 G, #280 (after #270), #281.

## Open owner questions

- #269: final bag shares (6/4/4/3/3 or 5/6/6/3), should a brake cancel the boost push, and the streak length
  (streaks reach the bottom of the frame at the chase camera).
- #267 follow-ups: owner ear check in a hosted room; an issue for the 16 unchosen sound events + Q4–Q6?
- Older: lint files over 300 lines; weave a/b/c; #254 class roles; #244 FRACTURE_RATE; review #236.

## Uncommitted

None of mine.

## Lessons → memory

none
