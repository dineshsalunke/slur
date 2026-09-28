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
| **LIVE (2026-09-27 evening)** workerone | w2Z:p2 | #327 DONE 7d52b75 (closed; handover 59e81c7): flat weave face, run-up 156–220u < 280u set, lengths unchanged, 0 bumps/deaths seeds 1–30. Owner /test-level check pending | idle | none |
| **LIVE** workerone (cont.) | w2Z:p2 | #329 portal: PLAN RELAYED (portalR 4, portalY 2; catch top 5.2 unchanged). #329 DONE 350febc (closed): R5 Y3, clear 11.5 × 12, nulls 1.64%/1.52% (HEAD 0.69/0.76), catch top 7.2. NOW #333 marigold membrane (build direct, leva dial); then #331 plan (all pickups ≈5u bbox, incl. portal pickup) PLAN FIRST | BUILDING #333 | portal-field/* |
| **LIVE** workertwo (cont.) | w2Z:p3 | #330 tug timeline (throw 0.5–0.8 s, 1 s strong + 1 s ease, detach 1.5 s, reel in). #330 DONE bf9199f (closed; handover 3cc0a68). Cleared + resumed at 0%. Owner /test-level check pending; no block in band = tug does not fire, keeps charge. #332 DONE d883422 (closed; handover da93c3f): tug glyph traced from the board. Owner Q: drop the <2 px fleck at small size? NOW #334 block side hit stops the ship (owner yes). Cleared + resumed at 0%. PLAN FIRST | PLANNING | none yet |
| **LIVE** workertwo | w2Z:p3 | #328 DONE 8506bc1 (closed; handover 9598fdd): TUG_S 1.2, TOW_S 1.6, reel-in 0.4 s. Block tug still ≤0.75 s (release 0.35 s before a 150u anchor): OWNER Q raise TUG_RANGE / lower TUG_RELEASE_S? :2567 restart for hosted rooms | idle | none |
| (stale rows below: pre-reboot panes w2P:*; workerthree/four/five NOT running) | | | | |
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

000000000. RESUME HERE (2026-09-28 late night, seam 4 at ~155k). OWNER DEPLOYS ONCE after all hardening lands
   (`! docker desktop start && ./scripts/deploy.sh`); then #337 (workerone) + #338 (workertwo 282428f) + #340 verify
   prod and close. Nobody deploys but the owner.
   - #343 infra DONE (do-setup, closed; memory 44d62f0): root prohibit-password same key, host key unchanged, port 22;
     Traefik per-IP 200/s burst 1000 + in-flight 400; /metrics basic auth, cred in owner Keychain service `slur-metrics`;
     /healthz public. RULE: deploy.sh must NEVER write /opt/slur/docker-compose.yml (holds limits + auth; backup
     docker-compose.yml.bak-pre343).
   - workertwo (w2Z:p3, cleared+resumed this seam): #340 OWNER APPROVED (5 chars, alphabet 23456789BCDFGHJKMNPQRSTVWXYZ,
     code = roomId, private by default, ≤1 public room = quick play, failed-join 10/IP/min, global ceiling OFF, keep
     LobbyRoom live count). BUILDING new files + client + docs. OWNS client-ip.ts + matchmake-guard.ts (single
     invokeMethod wrapper) — commit early, relay SHA to workerone. run-room.ts/index.ts: WAIT for #339 commit.
   - workerone (w2Z:p2): #339 PLAN pending (room caps from measured CPU/room, maxMessagesPerSecond, input validation,
     payload 2–3× measured, deploy.sh from git archive HEAD + SSH preflight BatchMode + env overrides + /metrics via
     Keychain only if readable, never write compose). Must import workertwo's guard/IP helper, lands run-room/index first.
     On plan → relay to owner.
   - Queued: #341 stalled race exit (owner "seriously missing"), #342 kick + name/chat filter.
   - UPDATE (seam 4b): #339 PLAN RELAYED TO OWNER, awaiting approval: MAX_ROOMS 12, ≤3 live rooms/IP + ≤10 creates/10 min,
     maxMessagesPerSecond 60, maxPayload 2 KiB (re-measure in a browser first), gap B name typeof check (run-sim.ts),
     gap C onUncaughtException (crash kills every room today), deploy.sh (preflight, refuse unpushed, git archive, Keychain
     /metrics). On approval → tell workerone BUILD; after its run-room/index commit → release both to workertwo.
     workertwo pushed fcd917b (client-ip.ts, matchmake-guard.ts, failed-join-limit.ts, room-code.ts, room-codes.ts);
     building client + docs; also owns gap A (chatHistory 1 reply/2 s in chat-log.ts). workerone adds the single
     installMatchmakeGuard([new FailedJoinLimit(), …]) line in index.ts; never edits matchmake-guard.ts.
     SEAM 4e: #341 PLAN RELAYED (workertwo handover 9219acb): A stall 30 s no new best z → counts done (warn 20 s),
     B cap 3 × finishZ / 84 (286 s on 8,000u; ≤546 s phrase) — NOTE reverses #301 "no time cap"; C host End race
     (optional). Owner Qs: A+B or A+B+C; 30 s/factor 3. run-sim.ts/run-room.ts after #339 commits.
     SEAM 4d: #340 BUILT cf922f8 (handover 63801bc); run-room.ts + index.ts RELEASED to workerone (index has
     installMatchmakeGuard([new FailedJoinLimit()]) — workerone APPENDS its gate). #338/#340 stay open until the final deploy.
     Owner brief given (Create room → code chip; Join by code; Quick play; bad code error). workertwo cleared + resumed on
     #341 stalled race PLAN FIRST. Still waiting: OWNER approval of #339 → resume workerone.
     SEQUENCE FLIPPED (seam 4c): run-room.ts + index.ts RELEASED TO workertwo first (#339 unapproved, workerone idle).
     workertwo lands RunRoom codes + installMatchmakeGuard([new FailedJoinLimit()]) line, pushes, reports SHA → then
     release both to workerone; tell workerone to APPEND its gate to that array (not add the line) and use ADR-026.
     workertwo pushed client + docs (ad95630 throttle, 6b89660 home menu, a7c63a5 docs/ADR-025).
     workerone seamed (faca865) and is CLEARED at 0%, NOT resumed. On owner #339 approval: `herdr agent prompt w2Z:p2
     "You are workerone. Resume from .claude/handovers/workerone.md. Read CLAUDE.local.md first. OWNER APPROVED #339 — BUILD." --wait --until working`.
00000000. (superseded) RESUME HERE (2026-09-28 night). HARDENING QUEUE (owner approved all; stay anonymous):
   #337 metrics pushed 59a4599 — awaits OWNER deploy; do NOT deploy while #338 edits are in the tree (deploy.sh builds
   the working tree). #338 chat: workertwo BUILDING (holds chat files, run-room.ts, lobby-overlay, matchmaking).
   Owner: "confirm both workers done first" → then workerone #339 (room caps from measured CPU/room, maxMessagesPerSecond,
   input validation, payload cap 2–3× measured max, deploy.sh from git archive HEAD) PLAN FIRST; workertwo #340 private
   rooms + join code, max ONE public room (quick play) PLAN FIRST. Queued: #341 stalled race exit (owner: "seriously
   missing"), #342 kick + name/chat filter (after #338). do-setup assigned #343 (Traefik rate/conn limit, SSH, upgrades,
   /metrics basic auth).
0000000. (superseded) RESUME HERE (2026-09-28 evening). #336 DEPLOY DONE dc2af77 (closed): LIVE at https://slur.kurmah.studio.
   Droplet `slur` 168.144.186.50 (blr1, $6 s-1vcpu-1gb, 1 GB swap), root + ~/.ssh/kurmah_ed25519, compose /opt/slur,
   own Traefik /opt/traefik (do-setup's; leave alone). Redeploy = OWNER runs `! ./scripts/deploy.sh` (auto-mode denies
   workers a production deploy; never route it to another session). Verified live: healthz/matchmake 200, wss race,
   /test-level → 404. Docker Desktop stopped. do-setup asked to commit kurmah-netbird-infra.md + MEMORY.md.
   Both workers idle, no files. ECS spike/RFC still awaits owner go.
000000. (seam 3, superseded) RESUME HERE (2026-09-28 ~14:30, seam 3 at ~150k).
   DONE (closed): #331 fb878e1 pickups 5u longest side, hover 3.2, pool 4.0 (handover 368063c) · #334 bcad382
   side hit scrapes keep 0.90 vz, no stun, grazeDepth 1.0, contact kind {kind,dir} (handover aeb5ff1) · #335 f664fee
   tug halved. Owner /test-level checks pending for all three. Both workers IDLE, no files. Dev stack is MY
   background task: client PID 96155 :5173, server PID 96154 :2567 (dies with this session; check lsof after /clear).
   ARCH DISCUSSION (owner, no decision yet): ECS drift (only ships/bolts/seekers/mines are entities; blockWorld,
   pickup-state, *-events queues, 14 *.state.ts are singletons; state as values not tags; 44 useFrame, no schedule).
   Gameplay constants should be server-owned room config sent to client (3 tiers: rules / track gen / look).
   Server ECS: koota 0.6.6 runs in Node (verified), world traits work, trait holds PlayerState by ref, BUT max 16
   live worlds/process (WORLD_ID_BITS 4). Offered spike + RFC to workerone — owner has NOT said go.
   DEPLOY (owner 2026-09-28): domain slur.kurmah.studio; keep dev routes hidden in prod; SLUR_TRACK_GEN=phrase;
   image delivery: unregistry `docker pussh` preferred (README verified v0.4.3), else GHCR/DOCR. Plan: one container,
   Node serves SPA + Colyseus same origin; client endpoint from location (wss); /healthz; SIGTERM; multi-stage
   Dockerfile w/ LFS guard; compose with Traefik labels. Mac is arm64 → build --platform linux/amd64.
   do-setup (peer session, uds:/tmp/cc-socks/99729.sock) facts: only droplet is `netbird` (doctl --context kurmah,
   blr1, 1 vCPU/2 GB, Ubuntu 24.04, Docker 29.8.1, root@134.209.152.230 key ~/.ssh/kurmah_ed25519). Traefik v3.6
   is NetBird-owned (/opt/netbird/docker-compose.yml), network netbird_netbird, entrypoints web/websecure, resolver
   letsencrypt (TLS-ALPN), timeouts 0. DNS on Cloudflare (do-setup holds the token). ASKED OWNER: separate slur
   droplet (recommended) vs share netbird. On answer → file deploy issue → workerone verifies (Colyseus+express
   attach, pnpm 11 deploy, docker pussh w/ containerd store) then builds; do-setup does droplet/DNS/Traefik.
00000. (seam 2b, superseded) RESUME HERE (2026-09-27 late, after supervisor /clear). #333 DONE 69edb82 (closed; relayed with brief;
   owner Q: pass ripple from hit point as follow-up?). workerone seamed at 182k (61419b8), cleared + resumed at 0%
   → #331 PLAN RELAYED to owner (longest side = 5u, uniform fit at build, hover 2.4→3.2, pool 3.2→4.0, grabR stays;
   client-only files: combat-look.ts, pickup-instances/*). Awaiting owner (a) longest side vs spin circle (b) hover/pool.
   workertwo: #334 PLAN RELAYED (grazeDepth 0.5→1.0 corner slide; side contact = no stun, vz × scrapeKeep 0.88 on
   fresh contact; contact kind returned from simulate()). Awaiting owner: flat 0.88 (rec) vs impact-scaled; scrape
   sound (default spark only); no leva dial OK? #335 tug halving DONE f664fee (closed; handover aa18516), relayed.
   Both workers idle-ish awaiting owner; neither holds files.
0000. (seam 2, superseded) RESUME HERE (2026-09-27 ~23:30, seam 2 at ~150k). Pane ids unchanged: workerone w2Z:p2, workertwo w2Z:p3.
   Dev stack: client PID 1557 :5173; server now PID 46767 :2567 (restarted by someone after seam 1; not mine).
   LIVE LANES:
   - workerone: #333 marigold membrane in the portal aperture (build direct; leva dials Portal.membraneOpacity/
     Glow/Flow already in 41bde5a). Holds portal-field/* + new portal-field/membrane-material.ts. Released
     tuning-schema.ts + tuning-panel.tsx. On DONE → relay /test-level brief; then brief #331 PLAN FIRST (all
     pickups ≈5u bbox incl. portal pickup; grab radius stays or scales?). workerone was 12% at #333 start.
   - workertwo: #334 block side hit nearly stops the ship. PLAN FIRST, no edits (cleared+resumed 0%). Causes
     [inferred from step.ts]: :264 grazeDepth 0.5 corner → z push; :316 vz = −bounceBack 9; bounceStun 0.25 s
     → NEUTRAL_INPUT (:379). Relay plan to owner. tuning-schema.ts free for a scrape dial.
     THEN build direct: halve tug (owner: "feels exactly like boost") — pull 1 s (0.5 strong + 0.5 ease),
     detach 0.75 s, tow 1 s × (1−armour); throw/peak/band/reel unchanged (issue "halve the pull", ~#335).
   DONE THIS SEAM (all closed): #327 7d52b75 flat weave · #328 8506bc1 tug ×2 · #330 bf9199f tug timeline
   (owner: band 250–450u, towed ctrl strong phase only, pull thrust, smoothstep, leva Tug.* dials; no block in
   band = tug keeps charge) · #332 d883422 tug HUD glyph from board · #329 350febc portal R5 Y3 (owner's own live
   value), clear window 11.5 × 12, placement nulls 1.64%/1.52% (was 0.69/0.76), catch top 7.2.
   OWNER CHECKS PENDING on /test-level: #327, #329, #330, #332, plus older #320/#321/#322/#323/#324/#326.
   OPEN OWNER Qs: tug glyph fleck <2 px at small size — drop? · #321 editor opens at 100% (zoom out / fit take?)
   · amber frame on portal exit · stalled race exit (host "End race" recommended) · lead non-monotonic
   · Freighter phrase-motif bumps · #14 Q1/Q2.
   Worker cross-session addresses: workerone uds:/tmp/cc-socks/1146.sock, workertwo uds:/tmp/cc-socks/1219.sock.
000. (seam 1, superseded by 0000) On workerone #327 DONE → relay with /test-level +
   editor brief (staircase gone). On workertwo #328 DONE → relay pull length near/far anchor + reel-in; remind
   :2567 restart for hosted rooms. Owner checks pending on /test-level: #320/#325 portal ring (my eyeball: glow
   dominates, rim barely reads; PORTAL_ARMED_INTENSITY dial), #321 recorder, #322/#323 arc, #324 pickup
   buttons, #326 rope (COIL_R dial). Open owner Qs: #321 editor opens at 100% (~68u) — open zoomed out or
   "fit take"? ~1 amber frame on portal exit — tone down? (TOW_S: OWNER YES, 0.8→1.6, told workertwo.) Stalled race exit;
   lead non-monotonic; Freighter bumps; #14 Q1/Q2. Dev stack PIDs 1555/1557 still up at this seam.
00. POST-REBOOT STATE (2026-09-27 19:35): pane IDs changed — workerone w2Z:p2, workertwo w2Z:p3 (cleared +
   resumed at 0%). workerthree/four/five NOT running (owner has not restarted them). Dev stack started by the
   supervisor as a background shell: client PID 1557 :5173, server PID 1555 :2567 (it dies with the supervisor
   session — after /clear, check `lsof -iTCP:5173 -iTCP:2567 -sTCP:LISTEN` and tell the owner if it is gone).
   #320 FILED (portal gate looks ~4u, sim catch is 6u = portalR 3; plus a hop cue). Assigned to workerone
   (plan-first, no edits until owner approves). OWNER APPROVED A + 1 + 2 (arch aperture = catch box 6u×5u;
   gate bursts via MineShock; local FOV punch on predicted hop; keep hop sound). D + 3 skipped. Workerone
   BUILDING; holds portal-ring.ts(+test), portal-field/*, mine-shock*, attach-room-to-world.ts (hop handler),
   camera/chase.ts + hop-kick.ts, ecs/net-systems.ts (hop branch), ART_SCALE_REFERENCE, GDD §5.
   #321 FILED (editor flight recorder: T manual start/stop, trace last 3 takes on the editor map, New Track
   = phrase default + seed field). Owner decisions: T manual; phrase default; seed option. Assigned to
   workertwo (w2Z:p3). Plan APPROVED (Q1–Q5 all yes: onTick hook in shared RunSim; keep takes until Clear;
   Edit stops a live take; bare /test-level defaults to phrase; speed colour = vz/maxCruise). DONE 4012255
   (closed; handover eab068e). workertwo idle, no files. Follow-up idea: editor opens at 100% = ~68u of track.
   #322 FILED (pickup HUD: arc of slot glyphs under the ship + pickup flash/Q tick; owner picked 1 + 4).
   #320 DONE b760826 (closed): arch clear 5.94u × 4.97u; draws pair 131, 135–136 during rings; FOV 70→78.9,
   back in ~0.3 s. Owner Q open: ~1 amber frame after exit (bloom of near arch + burst) — tone down?
   #322 workerone plan APPROVED (arc InstancedMesh +1 draw, layer 2 kept out of the mirror, corner keeps hint
   only; tick on any selection change; local ship only; touch unchanged). DONE 7696144 (closed; handover
   b2bfe54): 124 draws (+1), no arc in mirror, glyphs ~40 px, MIN_BACK 3.4u for bob. workerone idle, no files.
   Owner checks pending: #320, #321, #322.
   #323 DONE e499eee (closed): empty slot + bolt frame now rounded squares; other powers keep own frames
   (seeker square, mine star, boost chevrons, shield/portal circles, tug pill). Owner Q: all frames square?
   workerone idle, no files. (011e6e1 is an accidental empty commit of mine; harmless.)
   #324 DONE 16f962d (closed): leva panel (Backquote) → "Pickups" folder, 7 buttons, writes first empty server
   slot; full bag = no-op. workertwo idle, no files.
   OWNER 2026-09-27: arc — only the EMPTY frame square (bolt reverts; workerone, fix(#323), build direct).
   #325 FILED: portal = full 6u circle ring, raised, LOOK per ingredients/portal/concept-board.png; owner calls
   the #320 arch cartoon-ish/ugly. workerone PLAN FIRST (catch box vs circle, height).
   #326 FILED: tug rope thin + marigold, thrown/pay-out/slack waves/latch taut (owner confirmed reading).
   workertwo PLAN FIRST; holds tug-line/* on approval.
   #323 bolt revert DONE bc96f51. #325 OWNER: P1 (centre y=3) + circle catch in shared portal.ts → workerone
   BUILDING (holds portal files, portal.ts, GDD portal, ART_SCALE §7b). #326 OWNER: visual only, short throw,
   no miss → workertwo BUILDING (holds tug-line/*, rope-curve.utils).
   #327 FILED: phrase weave funnel = pixel staircase (weave-emit.ts floor/ceil per 4u row). Owner annoyed,
   says asked before (never filed). OWNER PICKED B: NO FUNNEL (straight wall face; run-up from ship physics).
   Decision commented on #327. → workerone (cleared, resumed), build direct; holds sim/phrase/* + tests.
   #325 DONE 1fc6aef (closed): ring centre 3, inner R3, rim 0.9; catch portalY 3 + portalRideY 0.8 (sim ship y=0
   on deck); widths 2.8@0.35 … 6@3; draws +6. Hosted rooms need :2567 restart if tsx watch missed shared dist.
   #326 DONE d48a5e4 (closed): rope 0.08u, ≥1.5 px, 900 u/s throw 0.08–0.2 s, coil R 1.6 (mostly under hull;
   COIL_R dial), draws +2 active. workertwo's "portalH typecheck errors" = transient stale dist (no source refs,
   dist has portalRideY; checked). workertwo idle, no files.
   My read of ring-front.png: glowing marigold circle dominates; graphite rim barely reads [eyeballed].
   On workerone's DONE: relay to owner with a /test-level brief (fly through a portal; gate reads 6u; burst + FOV kick). Owner not yet answered: perf after reboot, #319 check, glide cue issue.
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
