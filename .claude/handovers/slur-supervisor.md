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
| workertwo | w2P:pF | #283 file layout | B0 GO (docs/config/lint at warn); B1-B3 may follow; B4/B5 HELD for #285; B7 after #274 | CLAUDE.md, conventions/r3f.md, rules/react-house-style.md, rules/component-files.md, .ls-lint.yml, biome.json, biome-plugins/component-module-scope.grit |
| workerthree | w2P:pG | #280 mine fizzle (+ bind-room-audio:154 → musicForPhase, + mine-shock toneMapped from #275) | building | combat/mine.ts, mine-drop.test.ts, room-combat.ts, room-mine-fizzle.test.ts (new), mine-shock-events.ts, mine-shock.tsx, sfx-map.ts, bind-room-audio.ts, local-combat.ts(+test) |
| workerfour | w2P:pH | #276 item 3 (pow) | resumed (cleared); must report weave digest diff and wait for owner OK | block-depth.ts(+test), track-digest.test.ts |
| workerfive | w2P:pK | #274 run-view store | building | use-run-view.ts, run-view-store.test.ts, 10 overlay consumers, overlays.tsx, net-hud.tsx, test-room.ts, overlay tests |

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
