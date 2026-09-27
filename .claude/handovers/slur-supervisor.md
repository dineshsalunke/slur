Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-27 afternoon (owner machine restart; all workers told to hand over)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "│ [█░]* [0-9]*%"` (a bare
`[0-9]+%` catches the weekly-usage figure). The first reads after /clear often show the old percent; loop
reads until 0%. Clear a worker before assigning if it is past 10%. Use `bash -c '…'` for herdr loops.
Never brief a worker to build or serve an old commit: that is a scratch stack (owner rule).
A `/clear` sent while a worker is mid-turn queues behind that turn; wait for 0% before the resume prompt.
Reply to a worker's cross-session message with SendMessage to its `from=` socket address.

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE (memory owner-tests-on-test-level): the owner tests everything on /test-level. Every brief says so.
- Single-player mode will come later, without a server room. #288's LoopbackRoom is its base (not dev-gated).
- WIDTH 96u. MATERIAL: dark graphite pitted metal. Hosted rooms default to GROOVE (→ 'phrase' when #300 lands).
- Every power fires forward (E) or back (F). Audio sci-fi; reuse existing sfx for new pickups for now.
- Bag (owner-final): bolt 4 · seeker 3 · mine 3 · boost 3 · shield 3 · portal 2 · tug 2.
- Portal loop stays as built (GDD §10 Q8, 7980f45; comment on #289).
- Strafe kick (2026-09-27, #305 b6e3372): OWNER APPROVED the 4u fixed-distance step (B). A (retune, kickDistance 0) not needed.
- Race end (2026-09-26, #301 DONE f811400): grace 45 s, NO time cap.
- Draw-call budget (2026-09-27): soft 200, hard 300; baseline 127 (perf-analysis SKILL §7, 3de8baa).
- Sky: keep procedural nebula (image would save ≤1.3 ms; half-res sky is the cheaper lever if ever needed).
- Marigold (2026-09-27): owner picked B `#F5B024` (was `#F59A24`); emissive intensity unchanged.
- #300 RFC approved: gen 'phrase', 600 segments (12,000u, may grow; no hard-coded length), 3-note motifs in
  every act (option A) → 5 sections (low, low, mid, mid, high), weave band 20/16/14u by act, weave ≤ 25%,
  parallel weaves (owner addition; RFC §2.3), forced pickup per set piece outside the bag, open-space targets
  changed for phrase only, retire weave/score at S7, fork 50/50 wall/gap acts 2–3. #292 folded in.

- OWNER RULE (memory summarise-issues-when-asking-the-owner): never ask about an issue by number alone.
- Procgen vs authored (2026-09-27): BOTH. Procgen ships now; editor tunes procgen; authored later (GDD 928e0ca).

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | #318 DONE 4b17a2e (block capacity per track, emit ahead-first) + fc85cd7 (editor union keeps walls whole; phrase round trip 3007→596 blocks), closed; OWNER CONFIRMED on /test-level 2026-09-27. #308 DONE 5e51feb (closed; handover f4f21df). Owner check on /test-level/edit pending. #315 DONE c5436bb (closed): mirror gated to countdown+racing; hidden in results too (owner asked: keep hidden?). Browser check unmeasured | idle | none |
| workertwo | w2P:pF | #319 DONE 59feea6 (closed): boost holds deck height over gaps, jump unchanged, gravity after boost + 0.3 s grace. Schema gained glideTimer (end of PlayerState): owner may need a server restart. Follow-up idea: no visual cue for the hold. Owner check pending. Reconcile DONE a6a8eb0 + 928e0ca (closed #292 #6 #11 #114 #268 #269; filed #311–#314). #316 DONE b3965f7 (closed): engine loops only in countdown+racing; results silent (owner asked; to keep hum add PHASE.finished to the gate in bind-room-audio.ts + remote-engine-audio.tsx). Live check unmeasured | idle | none |
| workerthree | w2P:pG | #310 landed 31e3131 but broke the frame: bloom on → black, owner 1 fps / MAX 1632 ms (bloom 0 renders fine, measured). Cause: deck-breakup patch stacked per re-render (rail-glow used to reset the chain). FIX e5f8e20 OWNER CONFIRMED in Zen; #310 CLOSED. #317 DONE 6af07fe (closed; handover 68f3ec6): editor view mirrors x to match the chase camera (+x = player's left); verified headless on /test-level. Phrase S4 HOLD, phrase files kept | idle | those + phrase/*, avoid-pilot.test.ts, phrase row of track-digest.test.ts |
| workerfour | w2P:pH | PERF (no issue yet): owner saw 5–12 fps. Diagnosed, no edits: Chrome headless shows no regression (DPR2 ~50 fps, DPR1 vsync-capped, JS ≤2.2 ms; today's commits invisible; fullscreen passes dominate GPU). Owner plays in Zen (Firefox) — cannot measure it here. Waiting on owner: Chrome vs Zen on same URL, exact URL, slow from start or later, a 30 s about:profiling capture. Memory dfdbecf. Also #295 blink: plan relayed, awaiting owner | idle | none |
| workerfive | w2P:pK | #14 reconnection: plan relayed, awaiting owner | idle, 8% | none |

#300 landed so far: S1 8a4f1dd · S2 0ae9967 + b90f436 · ADR-023 (Proposed) bbb44b4, 7b696f3. Owner can fly
`/test-level?gen=phrase`.

## Open owner questions

- **#308 no-op undo step:** a click that changes nothing (erase on empty space) still adds an undo step.
  Skip it? Needs code moved out of track-editor.state.ts first (297/300 Biome lines).

- **Lead non-monotonic after #305 (NOT yet told to owner):** ADR-023 8d3abdb: an 8u offset needs more lead than 12u, so a 16u lane has a longer pitch than a 20u lane. Flight still 0 bumps/deaths. May be a pilot artifact (strafeToward caps below the kick threshold for |err|<4u) [inferred]. Ask the owner whether to investigate.

- **WEAVE SHAPE — ANSWERED 2026-09-27: B, straight sealed walls + slalom inside.** Owner wants the curved
  corridor gone first. LANDED 4ca02e7. Owner: Comet 72 in 14u "ok i think".
- **SPACING (owner "go", 2026-09-27):** slalom unreadable (posts stack, next gap hidden; Freighter bumps
  "very irritating"). Pitch = distance at design speed for reaction 0.3 s + kick/accel lateral cross + damp
  settle + hull, via simulate(); design speed act1 100% / act2 90% / act3 75% maxCruise, max over classes;
  applies to motif pins too. Briefed workerthree; numbers come back before commit.
- **Derived pitch DONE afcc66c** (owner go on all 4 recs): 0 bumps/0 deaths all classes; phrase length per
  seed 744–768 segments; posts per lane 2/3/3. Art-direction folder committed as-is 65d441a (owner OK).
- **#304 split (owner: 2 workers, talk only when needed, clean pushed tree before handover — done).**
- **#304 editor (owner, 2026-09-27):** throwaway top-down editor on /test-level; blocks (destructible/solid)
  + gaps; snap 1/2/4u; Edit → Save → Play loop; saved tracks = repo files for designing the generator.
- **#304 editor** shipped 5165d46, d382904, 6982014, 0130a63, 12a91b7 (sim freeze), 249d47f (zoom 25–800%).
  Reopened for the eraser fix; workerone closes it again with the SHA.
- MEMORY.md compacted to 16 KB (39102e7).
- **Readability, still to ask the owner:** marigold glow on post faces; posts below camera eye line; floor
  chevrons at gaps. Owner stopped the multi-select to clarify spacing first.

- **Amber** `#FFB52E` (hue 41°) now ≈ new marigold hue; core→amber→marigold ramp differs only in value. Keep,
  or pick a hotter amber? (Open in ADD §3 / ART_MATERIALS §7 item 20.) ChatGPT paste note already given.
- **Portal models** (owner hero shots: linked-ring pickup, A/B gate): told owner procedural is feasible
  (instanced bevelled wedges + dashed emissive band + graphite material, ~2–3 draws/ring). Offered to file
  an issue — #303 DONE 5e9abd0 (draws: pair +6 incl. rear view, pickup 3). Open: gate rim reads dark, inner
  glow wall dominates at an angle; levers GATE_SLEEVE reach, PORTAL_ARMED_INTENSITY, lighter rim finish.

- **Stalled race exit** (no cap now): recommended a host "End race" button; alternatives: no-progress N s,
  grace after first drop-out, leave it. workertwo's finding: no host control mid-race (run-sim.ts:134/138),
  a connected wedged/AFK racer holds the room forever.
- **Freighter pin bumps** on phrase motifs: 19–23 bumps/run, ~25% slower. Owner playtest asked; untuned.
- **Owner finish times** per class on `/test-level?gen=phrase` (workerthree wants them for length tuning).
- **#14 reconnection** Qs: Q1 ex-host gets host back? Q2 drop a disconnected racer from race end at once or
  after N s? (Plan: sessionStorage token per roomId, stop inputs while dropped, clear server input queue.)
- **#295 blink** Qs: distance 24u fixed or speed-scaled; lateral held-strafe ±12u or nearest lane; back hop
  keeps vz?; server-only snap OK; bolt 4 → 2 to make room in the bag?
- Serialize #295 against #14 on run-sim.ts / attach-room-to-world.ts when they start.

## Next

00. POST-REBOOT STATE (2026-09-27 19:35): pane IDs changed — workerone w2Z:p2, workertwo w2Z:p3 (cleared +
   resumed at 0%). workerthree/four/five NOT running (owner has not restarted them). Dev stack started by the
   supervisor as a background shell: client PID 1557 :5173, server PID 1555 :2567 (it dies with the supervisor
   session — after /clear, check `lsof -iTCP:5173 -iTCP:2567 -sTCP:LISTEN` and tell the owner if it is gone).
   #320 FILED (portal gate looks ~4u, sim catch is 6u = portalR 3; plus a hop cue). Assigned to workerone
   (plan-first, no edits until owner approves). OWNER APPROVED A + 1 + 2 (arch aperture = catch box 6u×5u;
   gate bursts via MineShock; local FOV punch on predicted hop; keep hop sound). D + 3 skipped. Workerone
   BUILDING; holds portal-ring.ts(+test), portal-field/*, mine-shock*, attach-room-to-world.ts (hop handler),
   camera/chase.ts + hop-kick.ts, ecs/net-systems.ts (hop branch), ART_SCALE_REFERENCE, GDD §5.
   On its DONE: relay to owner with a /test-level brief (fly through a portal; gate reads 6u; burst + FOV kick). Owner not yet answered: perf after reboot, #319 check, glide cue issue.
0. After the restart: ListAgents (names/panes may change; re-map the table), `herdr pane list`, confirm each worker's
   "READY FOR RESTART — handover <sha>" landed (git log -- .claude/handovers/), then resume each worker with
   `herdr agent prompt <pane> "You are <name>. Resume from .claude/handovers/<name>.md. Read CLAUDE.local.md first."`.
   Owner's dev stack must be restarted (`pnpm dev`) — also needed for #319's new schema field on the server.
0a. PERF: get the owner's answers (Chrome vs Zen, URL, when slow, about:profiling capture) → workerfour.
0b. Owner checks pending: #319 boost over a gap on /test-level; #319 follow-up (visual cue for the hold) — file an issue?
0c. `tracks/phrase-20260921.json` (untracked) vanished at 13:17 and is back at 13:56 (9364 B — new editor save,
   small = post-fc85cd7 union) [inferred]. Owner's file; leave it. `tracks/groove-20260921.json` (tracked) still shows D.
0d. Open follow-up (low): #318 B union is order-dependent; a scribble can leave more pieces than the old grid.
1. Relay #315 (workerone, mirror) and workertwo's engine-hum issue + fixes to the owner, with issue titles. Owner checks in a hosted room: race → finish → lobby: no mirror, no hum.
1b. Owner still to: check #308 undo/redo on /test-level/edit + answer the no-op undo step question; decide on restarting the client dev server (PID 85264, ~157% CPU, 2.1 GB after 2.5 days).
1c. `tracks/groove-20260921.json` shows as DELETED in the tree (tracked file, not ours; maybe the #307 editor delete). Owner not yet asked.
2. workerthree #310 → relay tap diff / draw calls / GPU ms to owner.
3. workertwo idle: offer a lane (e.g. the pilot check for the non-monotonic lead, if the owner says yes).
4. Ask the owner: lead non-monotonic after #305 — investigate the pilot?
5. Later candidates: #291 boomerang, #297 membrane, #293 hazards, #294 parry, #299 Seeker.flyY.

## Uncommitted

None of mine.

## Lessons → memory

summarise-issues-when-asking-the-owner.md (0e8bfa7)
