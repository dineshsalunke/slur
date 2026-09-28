Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-28 late night (seam 5 at ~155k)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "│ [█░]* [0-9]*%"`; loop reads
until 0%. Use `bash -c '…'` for herdr loops. Reply to a worker's cross-session message with SendMessage to its
`from=` socket (or its name). Older history: `git log -p -- .claude/handovers/slur-supervisor.md` (seam 4g = bac2c45).

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE: the owner tests everything on /test-level. Every brief says so.
- OWNER RULE: never ask about an issue by number alone (title + one line).
- ONLY THE OWNER DEPLOYS: `! docker desktop start && ./scripts/deploy.sh`. deploy.sh (8fc2486) refuses a dirty tracked
  tree or unpushed HEAD, builds `git archive HEAD`, never writes /opt/slur/docker-compose.yml.
- Prod: https://slur.kurmah.studio. do-setup owns infra (Traefik labels in /opt/slur/docker-compose.yml; backups
  .bak-pre343, .bak-pre344). #344 infra: br/gzip on (bundle 1.22 MB → 305 KB br; 5 .gltf 20.5 → 15.2 MB), /models
  max-age 3600 + swr 7 d, own limiter slur-models-ratelimit 20/s burst 150 (Traefik limiters are per ROUTER).
- Older standing decisions (bag, marigold, portal, race end, draw budget, #300 RFC) unchanged: see seam 4g.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2Z:p2 | #345 lighting: OWNER APPROVED option 6 (metal base F0≈0.2 ~#7b7f86, metalness 1, cool directional key behind camera, no shadows, dials; option 7 metalness 0.6 = fallback). Cleared + resumed this seam (handover b842f29). Also: after deploy verify prod /metrics, close #337 + #339 | BUILDING | will claim key-light/*, metal.ts, tuning-panel.tsx, ART_MATERIALS rev 9, DECISIONS; world-scene.tsx + tuning-schema.ts AFTER workerthree's P2 commit |
| workertwo | w2Z:p3 | #346 phone joystick/d-pad + #347 fullscreen: PLAN FIRST (sent this seam). Also: after deploy verify #338/#340/#341 on prod and close | PLANNING | none |
| workerthree | w2Z:p5 | #344 P1 DONE 5ecbc6c (menu first, 2D fallback, boot cut). P2 quality tier (low/med/high, PerformanceMonitor step-down, menu picker) BUILDING, claims cleared. Keep #344 open until owner device sign-off | BUILDING (uncommitted P2 in tree) | quality/*, quality-step-down/*, render-scale.tsx(+utils), tuning-schema.ts, scene-effects.utils.ts, nebula-baker.ts, game-environment.tsx, world-scene.tsx, rear-view.tsx, net-canvas.tsx, landing-scene.tsx, menu-strip.tsx, quality-picker/*; ALSO game-shell.tsx is dirty (not in its claim — ask it) |
| do-setup | w2Z:p4 | infra; #344 compression done (memory b957367) | idle | — |

## Issue state (triage done this seam)

- Closed: #12 (web hosting, done by #336 dc2af77), #342 (workerone eaeb301).
- Built, await OWNER DEPLOY then worker closes: #337 metrics · #338 chat · #339 hardening (fda4814, e8bb786, 8fc2486)
  · #340 join codes · #341 race always ends (9b0c726). #337–#344 in milestone "S7 — Hardening & web".
- Filed this seam: #345 lighting · #346 phone controls · #347 fullscreen (all S7).
- Bugs still present (checked in code): #299 Seeker.flyY dial dead · #311 gap-deck widths 4/8/12 (gap-blocks.ts:40)
  · #312 fixed-step drops time (fixed-step.ts:13, OWNER decision) · #313 spectator camera z lag (OWNER decision).
  #299/#311 parked (owner chose #346/#347 for workertwo).

## Open owner questions

1. Deploy now (everything #337–#342 + #344 P1 is pushed) or after #344 P2? Recommended now. Tree must be clean.
2. After deploy: device test of #344 P1 — iPhone 12 Chrome `?quality=low|medium|high`, `?nocanvas`, plain `/`;
   Windows laptop `chrome://gpu` GL_RENDERER + plain / and `?quality=low`.
3. File an issue: ship models .gltf → .glb + meshopt/KTX2 (15.2 MB br today)?
4. Kick button on the results rows too (#342 has lobby only)?
5. #14 reconnection: Q1 ex-host gets host back? Q2 drop a dropped racer at once or after N s?
6. #312 hitch behaviour (keep / clamp / drop) and #313 spectator follow rule.
7. #16: close (link + code exist) or cut to QR only?
8. #342 known gaps (spaced letters pass; "Dick Grayson" masked; clearing site data beats the kick block) — OK?

## Next

1. On workertwo's #346/#347 plans → relay to owner (AskUserQuestion with the points to settle).
2. On workerthree's P2 commit → release world-scene.tsx + tuning-schema.ts to workerone; relay the P2 /test-level brief.
3. On owner deploy → ping workerone (/metrics, close #337/#339) and workertwo (close #338/#340/#341).
4. Ask the owner the open questions above that are still unanswered.

## Late notes (seam 5)

- workerone found workerthree's uncommitted P2 renders quality=low as a BLACK canvas (post gate removes the only
  renderer; priority useFrames disable R3F auto-render). workerthree owns the fix; P2 must not land black.
- workerone #345 claim + hull-look.ts (phase 2): track metal #7b7f86, HULL_BASE_COLOR #4a4d52 kept, 'Hull.baseColor' dial.

- #344 P2 DONE 286c8ef (black-canvas fixed; menu "Graphics" Auto/Low/Med/High saved; auto step-down hosted races
  only, <40 fps for 2.5 s; Render.dpr default 0 = auto, dial > 0 wins). #344 open for owner device sign-off.
  Owner Q: frozen sky saves ~no GPU [inferred]; a cheaper still sky needs a sky-shader change — want it?
- workerthree cleared + resumed on #299 + #311 (build direct). workerone owns world-scene.tsx/tuning-schema.ts now.
- Tree was clean + pushed at d06f268+286c8ef → deploy window open until workerone's next edits.

- #345 DONE 8c94537 (open for owner sign-off): track metal #7b7f86, KeyLight #cfd8e6 ×2 behind camera; near deck
  15→43, far 34→58, block fronts 14→36 (low tier similar); +0 draws, GPU same. Hull stays #4a4d52; owner option
  Metal > hullColor #7b7f86 (hull luma 50→83). Old saved Metal.baseColor overrides reset once.
- #299 DONE ea2552b + #311 DONE 1236573 (both closed by workerthree): gap blocks 283 widths 4–20u; weave digest moved.
- #346/#347 OWNER APPROVED (brake = stick down >50%, KeyR = previous pickup) → workertwo BUILDING #347 then #346;
  also fixes stale GDD.md:84 "1–3 lanes wide".
- workerone + workerthree IDLE, no files. Next lane candidates: #14 reconnection (needs owner Q1/Q2), #313/#312
  (owner decisions), #15, .glb models issue (owner not yet answered).
- Tree clean + pushed after 8c94537/1236573 → deploy window open until workertwo writes.

- #347 DONE 7c34699 (closed). #346: owner picked KeyR = previous, dev mirror toggle KeyR → KeyV
  (rear-view-toggle.ts added to workertwo's claim).

- #346 DONE ff4d722 (closed). workertwo cleared + resumed idle. ALL THREE WORKERS IDLE, no files held.
  Tree clean + pushed: DEPLOY READY (#337–#347). Owner checks: iPhone 12 pad race + Home Screen launch; Windows
  Chrome fullscreen; /test-level R = previous, V = mirror, lighting dials, Seeker.flyY, Graphics row.

- OWNER DIRECTION (2026-09-28 late): biggest problems = perf on low-end devices + bad lighting. Also wants code
  organisation/architecture (focus look + dev) IN PARALLEL, and Blur-style controls for keyboard + gamepad only.
  Filed #348 Blur controls → workertwo PLAN FIRST · #349 architecture RFC → workerone RFC ONLY · #344 next perf
  step (race profile per tier, cheaper still sky, .glb models) → workerthree PLAN FIRST. Lighting: await owner
  check of #345 (8c94537) on /test-level before the next lighting lane.

- OWNER OVERRIDE (later same night): ARCHITECTURE FIRST. #348 and the #344 perf step PAUSED. All three on #349:
  workerone leads + sole writer of docs/RFC-349-ARCHITECTURE.md (claimed, clear); workertwo = net/input/state/
  server-config section; workerthree = render/useFrame schedule/pipeline/quality section. RFC only, no source edits.
  On RFC summary → relay to owner. The deploy is still worth doing now (ships phone + lighting fixes).

- #349: workertwo §4 draft sent to workerone (handover 4b58658). Top finding: on /test-level the predictor uses
  DEFAULT_SIM_CONFIG (prediction.ts:52) while the loopback server uses tunedSimConfig (test-level-room.ts:40) →
  sim-dial tests show reconcile snaps live play lacks; RFC stage S1 fixes it. workerthree render section agreed
  (6118831). Awaiting workerone's merged RFC → relay summary to owner.
- Supervisor built (owner ask): drei <Stats /> dev-only, mounted in root.tsx App (3d9eed0). Unchecked in browser;
  may overlap top-left HUD — offer move/toggle.

- OWNER DIRECTION for #349: FEATURE MODULES — e.g. tug-line exports traits/systems/views by convention, the engine
  auto-wires them. Sent to workerone as the RFC's centre: contract, registry vs import.meta.glob, declared system
  order, shared-sim half vs client half, no cross-module internals, tug-line pilot.

- #349 RFC DRAFT af25d7c (docs/RFC-349-ARCHITECTURE.md): §3 feature modules, §4 merged, §5 pending (workerthree).
  Facts: tug = 11 own files + edits to 19 central files; koota has no scheduler; import.meta.glob client-only;
  predictor hard-codes DEFAULT_SIM_CONFIG in 4 places; resetSlot() has no caller (power slot leaks between runs —
  file a bug?). RELAYED owner Qs §8: (1) modules + tug pilot (2) explicit registry now, codegen later (3) order =
  phase + before/after, ties by id (4) state rule C + room config B2 (preset + sparse overrides, locked at GO)
  (5) #70 scope combat only or ship tuning too (6) dev dials in hosted rooms or /test-level only. Await answers.

- #349 net half merged 1a1c39c: schema exception gone (schema() composition); risk PlayerState 39/64 fields (hard
  cap, server throws at boot). New owner Q7: add valibot or zod so the server validates command messages
  (Colyseus 0.17 validate())? Waiting on workerthree §5 → workerone sends owner summary §8 Q1–Q8.

- #350 FILED (owner screenshot): long wall blocks have a marigold seam at one end only; open end facing the gap has
  none → seam on every exposed end. workertwo PLAN FIRST (briefed via herdr).

## Uncommitted

None of mine. In the tree: workerthree's #344 P2 files (+ game-shell.tsx), MEMORY.md (workerone's line + a peer's line).

## Lessons → memory

none

## Latest (seam 6, ~238k — clear me)

- #351 FILED: dev dial for marigold (3D + Tailwind token, one dial) → workerthree BUILD (owner asked directly).
- workerthree's #344 race-profile run is PARKED behind #351. Its plan: one headless Chrome ~20 min, doubles the
  owner's frame time while it runs → ASK THE OWNER FOR A TIME WINDOW before saying go.
- Owner Qs pending: #349 §8 Q1–Q8 (+ workerthree §5.7: O1 for views; tier change rebuilds sky/track textures
  mid-race or reload-only?); deploy; power-slot leak bug (resetSlot never called) — file it?
