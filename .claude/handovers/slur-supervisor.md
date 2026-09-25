Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-25, ~14:00 IST

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Grep the status line with `│ [█░]* [0-9]*%`; the first read
after /clear often shows the old percent, so read again. Clear a worker before assigning if it is past 10%.

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch/second stacks (CLAUDE.local.md §7, memory one-stack-dev-only.md 7926fec). All 4 workers told.
- WIDTH: the owner changed 84u → 24 LANES = 96u (HALF_WIDTH 48), "lets not have odd numbers".

- MATERIAL (owner, verbatim): "dark graphite pitted metal as base which will be used for everything in the scene, deck, monolith, blocks, ships, pickups etc. deck is going to be a bit special case where it will be a mix of the dark graphite pitted metal + 4x4u plate grid like what is it now."
- Meteors: owner wants one every 9–18 s → Meteor.chance 0.15 (folded into workerone lane).
- Engine light: ACCEPTED as is (2026-09-25).
- Strafe tap kick: option 2 (stateless kick floor). Owner: "feels better now". Kicks 50/42/34/38/33 (e82cadf).
  Comet is capped at 34: kick ≥36 fails note-move.test.ts step1 (damp 14.4 overshoot). More Comet kick needs more grip.
- Workers commit to LOCAL dev by explicit pathspec without asking, and push dev to origin.
- The song work is a lens, not a rhythm game. Never propose audio re-sync or timing scores.
- Freighter-only while experimenting.

## Done today (2026-09-25)

- #195 ported (0c8594b banking, 9d45eb3 engine glow, c71634e GDD). PR closed.
- #255 groove generator (20c9e02). /test-level defaults to groove; ?gen=weave compares.
- #256 strafe tap kick (0c904de), then the raise (e82cadf). Both are pushed.
- Materials traced (workertwo 8d87851, workerone 279152c).

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | #258 graphite follow-up: 4 owner arch defects (handover 203d4b8 lists the inferred causes) | cleared ~13:40 at the seam and RESUMED; fixing in the tree. Arch captures only after I tell it workertwo pushed 96u | client scene claims from #258 | workertwo | w2P:pF | none (#257 96u LANDED 07b4d2d + fe40718; feat/width-80 deleted) | idle | none |
| workerthree | w2P:pG | none | idle, 15% (clear before the next lane) | none |
| workerfour | w2P:pH | none (kick raise e82cadf done) | idle | none |

## Width trial

The 80u stack is killed (PIDs 94568…94658) and the worktree is removed. Branch feat/width-80 (fef094f unify, 7266c68 @40) is kept until 84 lands. Numbers at 80 (workertwo 3553a3b): groove 150/150, bumps 41→29, weave +29% blocks per km.

## Next

1. When workerone reports the follow-up: relay the arch before/after + the colour pick (#3b3e42 vs #4a4d52; captures in d6ebc3ab…/scratchpad/after/).
2. (meteors answered: 0.15, in workerone lane)
3. 96u pushed; workerone told to capture. Owner: restart pnpm dev; answer weave a/b/c.

## Open owner questions

- WEAVE at 96u (workertwo prep, scratch): groove 150/150, 13 bumps, edge 0%. Weave +60% blocks per km, trapped pockets ~2×, pilot 0/150 (relative only). Hosted rooms default to weave. Options: (a) hosted default → groove, (b) weave density back to a fixed count per metre, (c) accept. Supervisor recommends (a), then (b) only if weave stays. Camera [inferred]: rails enter 24.6u ahead at 96 (11.7 at 64).

- The graphite colour pick after the captures. Width feel at 96 after it lands.
- Push archive/song-lab? (It was pushed at ~08:45 — b64766f is on origin. Closed.)
- #254 class roles (later). #244 FRACTURE_RATE raise? #251 device check. Score rooms have no pickups.
- Older: `git rm apps/client/app/game/net-debug-hud.tsx` + drop `--color-debug`; review #236.

## Owner's dev stack

The main stack: server :2567 (PID 74300, started 08:52), client :5173 (PID 85264). The owner restarts it to pick up shared changes.

## Uncommitted

none of mine. docs/art-direction/* changes are ChatGPT's; never touch them.

## Lessons → memory

none this seam.
