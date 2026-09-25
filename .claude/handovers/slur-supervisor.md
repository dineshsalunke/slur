Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-25, ~12:20 IST

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Grep the status line with `│ [█░]* [0-9]*%`; the first read
after /clear often shows the old percent, so read again. Clear a worker before assigning if it is past 10%.

## Standing owner decisions

- MATERIAL (owner, verbatim): "dark graphite pitted metal as base which will be used for everything in the scene, deck, monolith, blocks, ships, pickups etc. deck is going to be a bit special case where it will be a mix of the dark graphite pitted metal + 4x4u plate grid like what is it now."
- Meteors: owner wants one every 9–18 s → Meteor.chance 0.15 (folded into workerone lane).
- Engine light: ACCEPTED as is (2026-09-25).
- Strafe tap kick: option 2 (stateless kick floor). Owner: "feels better now". Kicks 50/42/34/38/33 (e82cadf).
  Comet is capped at 34: kick ≥36 fails note-move.test.ts step1 (damp 14.4 overshoot). More Comet kick needs more grip.
- The width trial worktree ../slur-worktrees/width-80 is OWNER-APPROVED.
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
| workerone | w2P:pD | GRAPHITE UNIFICATION (owner said "go" ~12:20: rails jointless, rocks stay rock, pits = dents only, #3b3e42 default with #4a4d52 shown, lights KEEP) + Meteor.chance 0.15. Files an issue, builds, pushes | BUILDING | scene/{metal,track-texture,track-materials,deck-finish,track-geometry}.ts, scene/{monolith-group,track-blocks,block-debris,track-floor,ship-model,bolt-pickups,seeker-pickups}.tsx, scene/combat-look.ts, new *.test.ts, dev/{tuning-schema.ts,tuning-panel.tsx}, docs/ART_MATERIALS.md |
| workertwo | w2P:pF | #257 width 80 trial | CLEARED at seam (3553a3b). Its 80u stack is STILL RUNNING for the owner | worktree ../slur-worktrees/width-80, branch feat/width-80 (fef094f, 7266c68), not pushed |
| workerthree | w2P:pG | none | idle, 15% (clear before the next lane) | none |
| workerfour | w2P:pH | none (kick raise e82cadf done) | idle | none |

## Width-80 trial (#257), from workertwo 3553a3b

- Stack: client http://localhost:5174 (PID 94656), server :2568 (PID 94657), pnpm parent 94568. Kill with
  `kill 94568 94656 94657` when the owner is done. :5173 is the 64u baseline; the main tree is clean now.
- fef094f unifies the width: FlightTuning.halfWidth is removed. 7266c68 sets HALF_WIDTH 40. All gates green.
- Groove 64 → 80, 30 seeds × 5 classes: 150/150 both; bumps 41 → 29; open floor 98.0 → 98.4%; widest run 61 → 76u;
  obstacles per area −20%. Weave block count scales with LANES: +29% blocks per km, harder. Deck-edge exposure falls at 80.
- Camera [inferred]: the rails enter the frame ~11u ahead at 64u and ~18u ahead at 80u.
- Owner decisions: 80 or 72; weave density per metre or per area. Then rebase, update GDD §0 (line 81), merge.

## Next

1. When workerone reports: relay the captures to the owner (colour pick #3b3e42 vs #4a4d52), the luminance and the draw calls.
2. (meteors answered: 0.15, in workerone lane)
3. OWNER, width: fly :5174 against :5173, then choose 80/72 + weave density. Assign the merge to a fresh worker (workerthree
   after /clear, or workerfour). Kill the 80u stack afterwards.

## Open owner questions

- The width choice (above). The graphite colour pick after the captures.
- Push archive/song-lab? (It was pushed at ~08:45 — b64766f is on origin. Closed.)
- #254 class roles (later). #244 FRACTURE_RATE raise? #251 device check. Score rooms have no pickups.
- Older: `git rm apps/client/app/game/net-debug-hud.tsx` + drop `--color-debug`; review #236.

## Owner's dev stack

The main stack: server :2567 (PID 74300, started 08:52), client :5173 (PID 85264). The owner restarts it to pick up shared changes.

## Uncommitted

none of mine. docs/art-direction/* changes are ChatGPT's; never touch them.

## Lessons → memory

none this seam.
