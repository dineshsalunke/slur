# Backlog

Project **SLUR**. Slice roadmap — see `docs/` (GDD/TDD/ADD/AUDIO) and `.claude/phases/2026-08-06-setup.md`.
Working model: pick one slice → arc (ideate → brainstorm → prep → align) collaboratively → implement in a
background agent → reconcile; design the next slice while the current one builds.
Dependency note: **S1→S2→S3→S4 are sequential** (each builds on the prior's code); S5–S7 layer on S4.

## Pending

- [x] 2026-08-06 → 2026-08-07 [feature] [slice] S1 — Flight feel (local, no network) — **DONE; human gate passed 2026-08-07 ("controls are good")**
  Code is source of truth (`@slur/shared/src`, `apps/client/app/game/`); spec + as-built reconcile: `.claude/phases/2026-08-06-s1-flight-feel.md`. Jump = derived (GDC "Building a Better Jump").
- [x] 2026-08-06 → 2026-08-08 [feature] [slice] S2 — Networked flight (server-authoritative) — **DONE; human gate passed 2026-08-08 (two browser windows, both players visible + smooth)**
  Code is source of truth (`@slur/shared` schema + `simulate()`; `apps/server/src/rooms/run-room.ts`; `apps/client/app/net/` + `app/game/net-canvas.tsx`). Spec + as-built reconcile: `.claude/phases/2026-08-07-s2-networked-flight.md`. Reconnection (`allowReconnection(20)`) landed here, not S4.
- [x] 2026-08-06 → 2026-08-09 [feature] [slice] S3 — Track, hazards, collision — **DONE; obstacle redesign + AABB + 5-class ships (commit `12049bd`); 18 shared tests GREEN; feel-gate playtested (Freighter capped)**
  why: built on the shared sim → auto-networked, no port. Deterministic seeded track (**4u cell grid**) + finish gate, **open-scatter cube fields + gaps**, **AABB collision** + death/respawn; client instanced track/cubes + edge-rails + bloom + per-class Quaternius models.
  As-built: S3 arc `.claude/phases/2026-08-09-collision-aabb-jump-vfx.md` (pt.1–5) + original `.claude/phases/2026-08-08-s3-track-hazards-collision.md`. Design captured this session: GDD §5.5 (5-class matrix), §5.2/§5.7 (straight-ribbon + no-moving-geometry constraints; hand-authored levels + two-floor validator; mechanic menu + BC1–8). **Next: S4.**
- [x] 2026-08-09 [feature] [task] AABB collision + obstacle redesign + 5-class ship matrix — **DONE; typecheck/build/18 shared tests GREEN; human feel-gate ACTIVE**
  Landed together (one arc): **4u cell grid** (16-lane/64u track, 5-cell segments); **open-scatter cube fields** (discrete 1×1-cell un-jumpable pillars — strafe/destroy, never hop) replacing track-wide walls; **platform archetype cut** (clean gap→jump / block→strafe split); **AABB×AABB collision** (Minkowski, footprint = model box) + generous grounded rule; **per-ship FlightTuning** resolved server + client from a shared `ship-classes.ts` registry (Class = mechanics group, Ship = cosmetic variant); **5 classes wired** (Interceptor/Fighter/Comet/Phantom/Freighter) with the 5 CC0 models (WYSIWYG scale/lift) + dev **hot-swap keys 1–5** (`setClass` message, server-authoritative). GDD §5.5 rewritten; full as-built in `.claude/phases/2026-08-09-collision-aabb-jump-vfx.md` (pt.1–4). **Feel-gate findings:** imperial/Freighter too big → capped (2026-08-09).
- [ ] 2026-08-09 [feature] [infra] Ship-content pipeline: code registry → JSON → DB (adding a ship = data + gltf, no code/build)
  why: user wants adding a ship to be "a few DB entries + gltf files, no code change/build". **NOT NOW** (YAGNI pre-S4; ships are added by devs who already build). Sequence: (1) code registry **[DONE]** → (2) **JSON registry** behind a swappable `ShipSource` interface + a **gltf-bbox measure script** (auto-computes scale/lift/halfW/halfL from the asset) + **authoritative def-sync to clients** → (3) **DB** as a drop-in source + editor UI when content-ops is real (live balance / community ships). Build (2) when roster growth justifies it. **KEY constraint:** ship tuning is server-authoritative **SIM** config — it must reach every client **identically and version-locked** (like the track seed) or client prediction desyncs. A DB doesn't remove that; it adds a layer under it.
- [ ] 2026-08-09 [feature] [infra] Track provider + anchors + grammar + validator (post-S4) — **SEQUENCED as ADRs**
  ⚠ **REFRAMED 2026-08-10 → `docs/DECISIONS.md` (ADR-001/002/003/004/005).** Build order is dependency-driven,
  NOT ADR-number order (see the DECISIONS "Build sequence"):
  1. **ADR-001** provider decoupling — `RunState.seed` → nested `TrackDescriptorState`; `resolveTrack(descriptor)
     → Track`; seed becomes procgen-provider-internal. `length`/`tier` reserved UNWIRED. Folds in ADR-004 comment
     cleanup. *(the unblocker)*
  2. **ADR-002** anchors — `Track.anchors: Anchor[]` (procgen emits; pickups = `anchors.filter(kind==='pickup')`;
     `corridorCenterX` internalised). **Visual seam FROZEN** (rule only, ADD.md #6). *(dep: 001)*
  3. *(gated)* first **BC5 beats** (boost/slow/launch) → unlocks **ADR-003** macro beat grammar (sequences §5.7
     vocabulary; generate == validate). Build the grammar only after ≥2–3 beat types exist.
  4. **ADR-005** `validateTrack()` FIT + GAP-REACH — **LAST** (validates a settled system; deferred until its
     consumers — authored provider + grammar — exist).
  **ACTIVE:** an implement loop builds **ADR-001 → ADR-002** (stop at green PR for human review/merge; wire
  changes do NOT auto-merge). `D(i)` = finite ramp only. **Weave difficulty uncapped** (self-balances via speed).
  Principle: [[balance-at-playstyle]]; [[load-bearing-track-contract]]; constraints GDD §5.2/§5.7.
- [x] 2026-08-06 → 2026-08-09 [feature] [slice] S4 — Session flow → complete Race — **DONE; human gate passed 2026-08-09** (two-tab playtest: full lobby→race→results→Play Again + spectate; commits `fc0418f`/`d155481`/`e5eb5f9`)
  **Polish deferred (edge cases, non-blocking):** reconnection under the NEW phase machine (a dropped racer is
  skipped but still counts toward race-end until the 20s window evicts them; host-drop reassigns host but a
  reconnecting ex-host is NOT restored to host; client auto-reconnect untested against the new overlays) →
  fold into **S7 "reconnection hardening"**. Also: spectator drop/reconnect, empty-room dispose mid-navigation.
  why: makes it "a game". **Round-based** (superseded drop-in-beside-pack for Race): server 4-phase lifecycle
  (lobby→countdown→racing→finished; host GO / Play-Again; finish + grace-timer→standings incl. DNF; restart);
  **join policy is per-mode** — Race locks the field at GO (late join → spectate the round, cycle-any-racer),
  Survival keeps drop-in-beside-pack (S7, via the `shouldSpectateOnJoin` seam); live **room list** (built-in
  `LobbyRoom` + `enableRealtimeListing()`); client landing → `/game/:roomId` (phases are OVERLAYS over one
  persistent Canvas, not routes); lobby ship/colour pick + hero-orbit 3D preview (reuses main scene), results.
  **Status:** B1–B3 DONE + committed (`fc0418f`; typecheck + 28 shared tests + headless E2E GREEN) = shared race
  director + schema (+name/colorId/spectating/hostId/countdown/finishDeadline), server lifecycle + host authority
  + room list, client shell/routing. **B4** (overlays/spectator/preview/leave-guard) building in a subagent.
  **B5** = docs reconcile (GDD §1/§3/§4 + CLAUDE.md tagline + this line — DONE). Full spec:
  `.claude/phases/2026-08-09-s4-session-flow.md` + `…-s4-batch4-spec.md`. (Reconnection landed in S2 — verify/harden.)
- [x] 2026-08-06 → 2026-08-10 [feature] [slice] S5 — Combat & power-ups — **DONE; human gate passed 2026-08-10** (two-tab: fire → bolt → hit → spark + stun-flicker). Functionality locked; visuals polish deferred.
  why: the "mess with your friends" payload — after the loop works. shared: pickups + roster (Bolt/Mine/Shield/**Boost**…), server-authoritative hit detection, disruption (stun/spin), auto-lock-nearest; client: instanced pickups, combat VFX + threat-warning HUD, held-powerup HUD. **Includes the rearview mirror camera** (2nd render pass → RenderTexture on a HUD inset; main Loop takes render priority) — needed to see tracking projectiles from behind. Design note in S1 phase doc.
  **NOTE (2026-08-09):** Boost was REMOVED from base flight (was Shift-held overdrive) and the energy meter cut — Boost is now a S5 **pickup** with its own charge/duration (the `E`/`usePowerUp` input is reserved for it). Don't rebuild base-flight boost.
  **NOTE (2026-08-09):** **BC1 (server-sim dynamic entities — projectiles/mines/drops/decoys) is the KEYSTONE** that unlocks the whole "mess" half. Full curated mechanic menu + base-capabilities BC1–BC8 in **GDD §5.7**. Design locks: straight-ribbon (no turning), no autonomous moving geometry (switches OK), balance is playstyle-level. **Tractor REDEFINED** = momentum leech (drain targets' speed, add to self — the Freighter's signature tool).
  **Shipped (C1–C4c, `dev`):** BC1 server-sim projectiles (`MapSchema<Projectile>`, interp-only) + **Bolt** (dumb forward, owner-immune AABB) → **stun** (BC2; `stunTimer` SimShip field, predicted) → the track does the killing; track-placed **pickups** (deterministic, hazard-aware, single held slot, `E` = discrete `USE_POWERUP` message); server-authoritative `stepWorld` hits + pickup grab/respawn + race-boundary clear; client instanced+interpolated bolts/pickups, `heldPower` chip, **hit-spark**, on-ship **stun-flicker**, **threat-warning HUD**. Opening move: room→world bridge extracted to `net/attach-room-to-world.ts`. Full as-built + reconcile: `.claude/phases/2026-08-09-s5-combat-powerups.md`.
  **Deferred fast-follows:** auto-lock-nearest (BC8), rearview mirror (RenderTexture), Mine/Shield/Boost pickups, wider `BOLT_HALF`/aim-assist if aim feels fussy, combat visuals polish. **Hardening (→ S7 / cleanup):** per-bolt `onChange` detach, `@colyseus/testing` room test, `overlays.css` maxLines.
- [ ] 2026-08-06 [feature] [slice] S6 — Identity: ship classes + audio + juice
  why: makes it feel like SLUR. **5 classes + per-ship flight/size/models ALREADY wired (S3 pull-forward; dev hot-swap keys 1–5).** S6 remainder = **`armour`/combat stats + a real lobby ship-pick UI** + audio pass (engine/hit/positional + synthwave + LCARS blips) + art pass (TRON derezz, trails, LCARS HUD, comfort sliders).
  **NOTE (2026-08-09):** ship taxonomy IMPLEMENTED — `@slur/shared/ship-classes.ts` (Class = mechanics group, Ship = cosmetic variant); per-ship `FlightTuning` incl. AABB footprint (`halfW`/`halfL`), resolved server+client by networked `shipId`. 5 classes + 5 models wired (footprints model-derived; Freighter capped) — GDD §5.5. S6 adds `armour`/`powerAffinity` to `ShipClass` + the pick-screen. Ship-content pipeline (code→JSON→DB) is the milestone above.
  **ARC (2026-08-10):** ideate+brainstorm DONE → `.claude/phases/2026-08-10-s6-identity.md`. Decisions LOCKED: **armour = per-class stun-duration multiplier** (sidegrade, agility⊥armour; `powerAffinity` DEFERRED); **audio** = three.js `PositionalAudio` singleton-outside-React + synth engine + Kenney CC0 SFX + CC-BY MacLeod in-run / Cynic CC0 lobby; **pick-UI** = upgrade existing lobby picker to show identity stats; **derezz** = dissolve-shader + keep burst; **environment pass** (pulled into S6) = Grid Void variant, **hybrid ribbon+tube-walls**, conservative post, `COLOR_COUNT` 8→12; **aesthetic** = TRON colour × Trek-Wars **de-rounded** geometry, palette **cyan × marigold** (magenta→player hue). `/solo` REMOVED; `/env-lab` prototype landed. Implement kicked off via 3 parallel worktree agents: **audio · landing-UI · procgen** (2026-08-10). Procgen plan: `…-procgen-weave-width-DRAFT.md`; env prototype: `…-env-lab-DRAFT.md`.
  **IMPLEMENT pt.1 DONE (2026-08-10, GREEN — 51 shared tests/typecheck/lint/build):** 3 worktree agents merged → **landing UI** (`15229e8`), **procgen v2** (`b54b837`, carved-corridor + variable-width walls, 40→51 tests), **audio** (`0471d02`), **integration fixes** (`b827f54`, pickups→racing-line corridor ~6→~60/track). LAN config (`93ec151`). As-built + deviations in the phase doc. **IMPLEMENT pt.2 DONE (2026-08-10, GREEN — typecheck/lint/build):** visual-polish pass closing art issues #1–#5 → **derezz dissolve** now shows on death (`cf397ab`, stopped hard-hiding the ship group; temp diagnostics stripped) · near-black track floor (#1) · readable in-game starfield (#3) · no stray origin cube (#2, pool parked at mount via callback ref) · **landing hero ship + TRON grid** (#5, new `landing-ship.tsx`); screenshot `slur.png` → new **root `README.md`**. As-built in the S6 phase doc. **REMAINING S6:** `armour` stun-multiplier · pick-UI identity stats · integrate `environment.tsx` into the in-game net canvas · hull-colour + `COLOR_COUNT` 8→12 · trails. **⛔ HUMAN FEEL-GATE (#11) PENDING — procgen/audio/landing not yet played; playtest before more build.**
- [ ] 2026-08-06 [feature] [slice] S7 — ~~Survival mode~~ + hardening
  ⚠ **UPDATED 2026-08-10 (ADR-004): endless Survival DROPPED.** ~~endless track + chasing derezz-wall +
  distance/time scoring~~ is cut — replaced by **longer finite tracks** + an in-track difficulty arc (no
  second mode). **Remaining S7 = hardening only:** LAN discovery (room-code QR / mDNS); reconnection hardening;
  perf tuning for 8–12 ships. New track work is tracked under the ADR threads (provider decoupling → beats →
  grammar), not here. See `docs/DECISIONS.md`.

- [x] 2026-08-07 → 2026-08-08 [research] [assets] Find CC-licensed X-wing-style / low-poly space-fighter GLBs — **DONE.** Chose **Quaternius "Ultimate Spaceships Pack" (CC0)**; 5 gltf ships added under `apps/client/public/models/ships/` (Git LFS-tracked). Poly Pizza X-wing/TIE results excluded as Lucasfilm IP; one Sketchfab CC-BY-NC excluded (non-commercial). `bob.gltf` wired into `/run`. Remaining: per-class assignment + neon material/team-colour pass (S6).

## Done
- [x] 2026-08-06 → 2026-08-06 [decision] [netcode] v1 mode = **Race** (finite, finish-line). Survival deferred to S7.
- [x] 2026-08-06 → 2026-08-06 [decision] [infra] Colyseus server **co-located on host laptop** (zero-setup office play).
