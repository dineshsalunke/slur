Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-26, evening (seam at ~157k)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Grep the status line with `│ [█░]* [0-9]*%`; the first read
after /clear often shows the old percent, so read again. Clear a worker before assigning if it is past 10%.
After sending to an idle worker, check the pane (`herdr pane read <pane> | grep -E "Message from|⏺"`); a queued
message can sit unread, so nudge with `herdr agent prompt <pane> "..."`. Use `bash -c '…'` for herdr loops.
The unsent text in an idle prompt box is Claude Code's suggested reply, not the owner's.

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- WIDTH 96u (24 lanes). MATERIAL: dark graphite pitted metal everywhere; the deck adds the 4×4u plate grid.
- Hosted rooms default to GROOVE. The song work is a throwaway lens, freighter-only.
- #261 mine rules (stun 1.5 s, ×0.6, arm 0.5 s, trigger 3u, ttl 20 s, 3/owner). Every power fires forward (E) or back (F).
- Audio: SCI-FI, not cartoon. CC-BY and CC-BY-SA accepted.
- Ship trails (#10) parked until after beta.
- #269 Boost: +40% of class top speed, 2 s, 0.2 s ease-out. #270 Shield: 5 s, absorbs one hit, share 0.15,
  the pop reuses the ship-hit sound played faster.
- Review decisions: dead schema fields plain · room on singleton + loader · dev routes dev-only · failed mine
  aim spends + fizzles (#280) · remove dead invuln (#281) · countdown joiners race (#282, done).
- Owner requests: component files hold only the component; constants/utils colocated, folders when needed
  (#283). `style={{}}` may set only CSS custom properties (#284).

## Landed / closed today

#269 Boost: ce01c2d · 3b466ea · 28048e6 · f448401 · 3a6ae8e. OPEN only for owner questions (below).
#270 Shield: c9e78a3 · 26badb9 (wired; server 41/0, client 415/415, shared 403/0). Check it is closed.
#271 573fa90 · #272 a91968a · #278 5abad09 · #279 888049a · #282 4dc2aad. All closed.
#276 in progress: 888a682 (digest test) · e4485e7 (weave segmentAt cache, 19.3 → 0.024 µs).

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | #273 netcode, all 4 items | building | sim/types.ts, sim/fround.test.ts, combat/constants.ts, run-room.ts, room-input.ts(+test), run-room.test.ts, net/prediction.ts(+test), attach-room-to-world.ts, ecs/net-systems.ts, input/current-input.ts, net-canvas.tsx |
| workertwo | w2P:pF | #283 file layout | B0 landed 2034287 (92 files warn). B2+B3 cleared. B1 folded into B7 (after #274). B4/B5 HELD for #285 | routes/pacing/**, routes/home/** + home.tsx, routes/beat-deck/**, 1 import line in routes/game/route.tsx |
| workerthree | w2P:pG | #280 mine fizzle (+ bind-room-audio:154 → musicForPhase, + mine-shock toneMapped from #275) | building | combat/mine.ts, mine-drop.test.ts, room-combat.ts, room-mine-fizzle.test.ts (new), mine-shock-events.ts, mine-shock.tsx, sfx-map.ts, bind-room-audio.ts, local-combat.ts(+test) |
| workerfour | w2P:pH | #276 item 3 (pow) | READY, uncommitted, WAITING owner OK: weave digest changes on all 5 seeds (groove unchanged); depth ≤0.6u shallower at mid intensity; pockets fixture window 3.2u → 3.5u | block-depth.ts(+test), track-digest.test.ts, constants.ts:218-223, pacing/pockets.test.ts |
| workerfive | w2P:pK | #284 style → Tailwind (after #274 done afcd0e7: CountdownOverlay renders 60→3, SpectatorBar 158→0) | resumed, claims pending; net-canvas.tsx last (workerone holds it) | pending |

#283 B1/B7 and landing-scene wait for #284 (told workertwo).
#283 B2+B3 committed fa42f18 (58 files; push pending by workertwo). workertwo AT SEAM ~185k: when idle and
pushed, clear it and resume from its handover; next batch B6 (test-level, hud, net-*, audio, dev,
room-context), then B4/B5 after #285, B1/B7 after #284. It will also fix rules/r3f-rendering.md "Hoist
scratch objects to module scope" → `<name>.constants.ts` in the scene batch.
Told workerone: 3 lint errors in its uncommitted #273 files. Told workerfive: landing-scene's new path.
UPDATE: workertwo cleared + resumed. B6 CLEARED except test-level-canvas.tsx (#284) and net-canvas.tsx
(#273, even import-only; moves whose importers include it wait). power-gem added.
#273 server+shared half pushed 36b67f2 (server 52/52, shared 408/408); workerone cleared + resumed on the client
half (prediction, attach-room-to-world, net-systems, current-input, net-canvas + #284 wrapper), then re-measure.
B6 landed f1ddda5. workertwo #285 phase 1 CLEARED: React context + useTrack() (R3F 9.7 bridges contexts via
its-fine, verified; no loader holds a track, 4 routes share the scene, so useRouteLoaderData rejected). Owner told
it departs from their idea; phase 2 (roots + HUD) after #273 and #284. Then #283 B4/B5.
#280 DONE + closed (ccc5e48): fizzle ring + 'mineFizzle' zap; musicForPhase switched; mine-shock toneMapped
removed (mine-bodies.tsx:37 still has it → #275). workerthree IDLE, holds nothing. Owner Q: derezz zap OK as fizzle?
Shared suite 406/408 in the tree: phantom pocket + weave digest = workerfour's uncommitted #276 item 3 (awaiting
owner OK), inferred.
#273 DONE + closed (c3ab18d): a 400 ms stall now drains in ~1 s (was stuck at 22-25). workerone IDLE, holds
nothing: next lane candidates #275 render P1s (minus mine-shock), #281 invuln, #277 P2 sweep. Clear it first.
INCIDENT: workertwo's mid-edit #285 crashed every Canvas route (Monoliths reads undefined track). Told it to
restore rendering first and ping workerfive (whose #284 "before" screenshots are blocked). RESOLVED: renders
again (measured on 4 routes); workerfive pinged. #285 phase 1 LANDED 1015ffe; workertwo cleared + resumed, will
send the #283 claim for net-loop / remote-engine-audio / game-audio / room-context → CLEARED (+7 import edits).
Deferred #283: net-loop, remote-engine-audio, game-audio, room-context (after #273); test-level-canvas + local-*
fields, B1/B7 (after #284); B4/B5 (after #285). Owner Q: also delete dead game/net-debug-hud.tsx?
workerfive #284: 16 paths CLEARED (app.css player tokens, colors.ts(+test), delete ui/color-dot.tsx, 5 overlays,
3 Canvas files, biome.json + style grit plugin, tailwind docs). workerone applies the net-canvas.tsx Canvas line
inside #273; workerfive's grit plugin commits after that.

## Next

1. #285 (owner: stop prop-drilling Track, ~31 .tsx; verify router context crosses the R3F Canvas) — assign
   and sequence against #283 B4/B5 (same scene files). Suggest: #285 first, then B4/B5.
   #276 item 1 landed f32a72c (digests unchanged). workerthree #270 handover a7450cd.
2. #284 (style) → next free worker, after #274 releases roster/winner-card/colour-swatches.
3. Follow-up: switch `bind-room-audio.ts:154` to `musicForPhase` (`audio/music-for-phase.ts`, from #272).
4. workerfour: report the weave digest diff before item 3 (`**` removal) lands; owner must OK it.
   Told it to fix the biome format error in track-digest.test.ts.
5. #283: review workertwo's naming + batch plan; keep #274 files out of its batches.
6. Unassigned: #275 render P1s, #277 P2 sweep, #280, #281, #284.

## Open owner questions

- Bag shares: at 0.15 each, the bag is 2 bolts / 6 seekers / 6 mines / 3 boosts / 3 shields (measured). Bolts
  are rare. Options: 6/4/4/3/3 or other.
- #269: should braking cancel the boost? Streaks are 10u and reach the bottom of the frame: shorter?
- #270: the dome reads as fairly opaque orange and hides most of the ship. More transparent?
- #267 follow-ups: owner ear check in a hosted room; an issue for the 16 unchosen sound events + Q4–Q6?
- Older: lint files over 300 lines; weave a/b/c; #254 class roles; #244 FRACTURE_RATE; review #236.

## Uncommitted

None of mine.

## Lessons → memory

none
