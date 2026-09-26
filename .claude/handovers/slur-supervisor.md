Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-26, early

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Grep the status line with `│ [█░]* [0-9]*%`; the first read
after /clear often shows the old percent, so read again. Clear a worker before assigning if it is past 10%.
After sending to an idle worker, check the pane (`herdr pane read <pane> | grep -E "Message from|⏺"`); a queued
message can sit unread. Use `bash -c '…'` for herdr loops (the Bash tool shell varies).

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- WIDTH 96u (24 lanes). MATERIAL: dark graphite pitted metal everywhere; the deck adds the 4×4u plate grid. Graphite #4a4d52.
- Blotch.dark 0.3 → 0.15 (owner: dark patches 50% subtler on every material).
- Hosted rooms default to GROOVE. The song work is a throwaway lens, freighter-only.
- #261 mine rules (stun 1.5 s, ×0.6, arm 0.5 s, trigger 3u, ttl 20 s, 3/owner). Every power fires forward (E) or back (F).
- Mine throw = a bolt-streak shot → land → open (#266, owner loves the bolt look). Other players' mines look the same.
- Workers commit by explicit pathspec and push dev without asking (except #258: HELD for owner sign-off).
- Audio direction: SCI-FI, not cartoon (#267 replaces #260). CC-BY and CC-BY-SA accepted (implied by the picks).
- #265: gap 120–180u jittered, MORE sideways spread, bag of 20 = 8 bolt / 6 seeker / 6 mine, run cap 2.

## Landed this session

336bc1e #266 mine bolt-streak throw · 1199218 #268 solid rear-view mirror (graphite bezel + marigold lip).
Closed: #260 #263 #257 #266 #268 #226 #219 (all with comments).

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | #258 graphite: wall-breakup (gate/monolith repeat fix) + Blotch.dark 0.15, ALL BUILT, HELD uncommitted. Handover ec389bb | idle, waiting on owner sign-off | dev/tuning-schema.ts, track-texture(.test).ts, deck-breakup(.test).ts, wall-breakup(.test).ts, track-materials.ts, monolith-group.tsx, track-blocks.tsx, track-floor.tsx, block-debris.tsx, pit-field(.test).ts, docs/ART_MATERIALS.md |
| workertwo | w2P:pF | #266 done | idle, 21%: clear before reuse | none |
| workerthree | w2P:pG | none (#260 superseded) | idle, ~120k: clear before reuse | none |
| workerfour | w2P:pH | #265 pickup spread: BUILDING (owner GO) | working | shared: sim/space.ts, sim/track.ts, sim/groove/groove-track.ts, combat/pickups.ts, combat/constants.ts, new combat/power-bag.ts, new sim/pickup-place.ts(+test), index.ts, docs/GDD.md, docs/DECISIONS.md (ADR-002 amendment for the id change `${ordinal}.${salt}`), tests: combat.test, mine.test, seeker-pickups.test, track.test, groove.test; if they break: server run-room.test, client local-combat.test, scene/seeker-pickups.test |
| workerfive | w2P:pK | #267 sci-fi audio: writing a BUILD PLAN for the 13 chosen cues. Build nothing yet | working | none |

## Next

1. workerfour reports #265 → relay the SHA + 30-seed table; tell the owner to restart pnpm dev (shared + id change).
   Then: workerfour removes the dead RearView.featherX/Y keys (tuning-schema.ts:139-140) AFTER workerone commits that file.
2. workerfive's #267 build plan → relay it to the owner. Picks comment: issues/267#issuecomment-5843537599.
   Still open: Q4 Freesound account vs previews, Q5 build/synth seeker miss + derez, Q6 Sonniss 7.5 GB, per-class engine later.
3. #258: ask the owner again for sign-off to commit + push (deck material, gate fix, softer patches). On yes → tell workerone.
4. Owner lighting: workerone wants `copy(localStorage.getItem('slur.tuning.v1'))` from the owner's tab to shoot at their lighting.

## Open owner questions

- #258 sign-off (above). Debris patches slide on flying fragments (kept as built); rails still use the baked tile (left as is).
- Close? #34 (weave too dense; the generator was replaced), #31 (Grid-Void env), #253 (song tracks, throwaway).
- Server 'fizzled' mine broadcast (visible fizzle feedback). Unanswered. In-block fizzle itself already landed (37b615e).
- Sign-offs: #163 #170 #173 #215 #222 #251. #20 is partly done (mine shipped; shield/boost not).
- Older: lint files over 300 lines; weave a/b/c; #254 class roles; #244 FRACTURE_RATE; net-debug-hud removal; review #236.

## Owner's dev stack

Server :2567 (PID 17267), client :5173 (PID 85264) [recalled from the previous handover, not re-checked].

## Uncommitted

None of mine. docs/art-direction/* changes belong to ChatGPT; never touch them.

## Lessons → memory

none this seam.
