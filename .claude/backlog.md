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
- [~] 2026-08-06 → 2026-08-09 [feature] [slice] S3 — Track, hazards, collision — **IMPLEMENTED + hardened; typecheck/build/14 tests GREEN; human feel-gate PENDING**
  why: built on the shared sim → auto-networked, no port. Deterministic seeded track + finish gate, hazards (gaps/walls/platforms), collision + death/respawn; client instanced track/hazards + edge-rails + first bloom + Quaternius ship model.
  As-built + the 6 playtest fixes (esp. the client/server seed-desync root cause): `.claude/phases/2026-08-08-s3-track-hazards-collision.md`. **2026-08-09 hardening pass** (jump tune, 3 swept-collision fixes — floor tunnel / platform slip-under / invuln phase-through, z-fighting, death-VFX explosion, boost removal): `.claude/phases/2026-08-09-collision-aabb-jump-vfx.md`. **Resume:** implement AABB collision (next task ↓), THEN feel-gate — confirm gaps/jump/strafe feel + `SHIP_FACING`, then commit-verify. Then S4.
- [x] 2026-08-09 [feature] [task] AABB collision + obstacle redesign + 5-class ship matrix — **DONE; typecheck/build/18 shared tests GREEN; human feel-gate ACTIVE**
  Landed together (one arc): **4u cell grid** (16-lane/64u track, 5-cell segments); **open-scatter cube fields** (discrete 1×1-cell un-jumpable pillars — strafe/destroy, never hop) replacing track-wide walls; **platform archetype cut** (clean gap→jump / block→strafe split); **AABB×AABB collision** (Minkowski, footprint = model box) + generous grounded rule; **per-ship FlightTuning** resolved server + client from a shared `ship-classes.ts` registry (Class = mechanics group, Ship = cosmetic variant); **5 classes wired** (Interceptor/Fighter/Comet/Phantom/Freighter) with the 5 CC0 models (WYSIWYG scale/lift) + dev **hot-swap keys 1–5** (`setClass` message, server-authoritative). GDD §5.5 rewritten; full as-built in `.claude/phases/2026-08-09-collision-aabb-jump-vfx.md` (pt.1–4). **Feel-gate findings:** imperial/Freighter too big → capped (2026-08-09).
- [ ] 2026-08-09 [feature] [infra] Ship-content pipeline: code registry → JSON → DB (adding a ship = data + gltf, no code/build)
  why: user wants adding a ship to be "a few DB entries + gltf files, no code change/build". **NOT NOW** (YAGNI pre-S4; ships are added by devs who already build). Sequence: (1) code registry **[DONE]** → (2) **JSON registry** behind a swappable `ShipSource` interface + a **gltf-bbox measure script** (auto-computes scale/lift/halfW/halfL from the asset) + **authoritative def-sync to clients** → (3) **DB** as a drop-in source + editor UI when content-ops is real (live balance / community ships). Build (2) when roster growth justifies it. **KEY constraint:** ship tuning is server-authoritative **SIM** config — it must reach every client **identically and version-locked** (like the track seed) or client prediction desyncs. A DB doesn't remove that; it adds a layer under it.
- [ ] 2026-08-06 [feature] [slice] S4 — Session flow → complete Race
  why: makes it "a game". server lifecycle (lobby→running→results, finish detection, standings, restart, join-mid-run spawn-beside-pack); client landing/host/join/room routes, lobby + ship/colour pick, results, spectate. Done: full office race lobby→results with a winner. (Reconnection already landed in S2 — verify/harden here, don't rebuild.)
- [ ] 2026-08-06 [feature] [slice] S5 — Combat & power-ups
  why: the "mess with your friends" payload — after the loop works. shared: pickups + roster (Bolt/Mine/Shield/**Boost**…), server-authoritative hit detection, disruption (stun/spin), auto-lock-nearest; client: instanced pickups, combat VFX + threat-warning HUD, held-powerup HUD. **Includes the rearview mirror camera** (2nd render pass → RenderTexture on a HUD inset; main Loop takes render priority) — needed to see tracking projectiles from behind. Design note in S1 phase doc.
  **NOTE (2026-08-09):** Boost was REMOVED from base flight (was Shift-held overdrive) and the energy meter cut — Boost is now a S5 **pickup** with its own charge/duration (the `E`/`usePowerUp` input is reserved for it). Don't rebuild base-flight boost.
- [ ] 2026-08-06 [feature] [slice] S6 — Identity: ship classes + audio + juice
  why: makes it feel like SLUR. 3 classes with real stat deltas + hitbox-scales-with-armour + lobby pick; audio pass (engine/boost/hit/positional + synthwave + LCARS blips); art pass (TRON derezz, trails, LCARS HUD, comfort sliders).
  **NOTE (2026-08-09):** per-ship flight is already a data swap — `simulate()` takes a `FlightTuning` arg; `DEFAULT_TUNING` = Fighter/baseline preset. Ship **footprint LOCKED** (Fighter 2.6×3.8×0.9; width ×0.8 Interceptor / ×1.5 Freighter) — see GDD §5.5 + the AABB task. A `ShipClass` just bundles a `FlightTuning` (incl. `halfW`/`halfL`) + armour/hitbox/powerAffinity.
- [ ] 2026-08-06 [feature] [slice] S7 — Survival mode + hardening
  why: second mode + robustness. endless track + chasing derezz-wall + distance/time scoring; LAN discovery (room-code QR / mDNS); reconnection hardening; perf tuning for 8–12 ships.

- [x] 2026-08-07 → 2026-08-08 [research] [assets] Find CC-licensed X-wing-style / low-poly space-fighter GLBs — **DONE.** Chose **Quaternius "Ultimate Spaceships Pack" (CC0)**; 5 gltf ships added under `apps/client/public/models/ships/` (Git LFS-tracked). Poly Pizza X-wing/TIE results excluded as Lucasfilm IP; one Sketchfab CC-BY-NC excluded (non-commercial). `bob.gltf` wired into `/run`. Remaining: per-class assignment + neon material/team-colour pass (S6).

## Done
- [x] 2026-08-06 → 2026-08-06 [decision] [netcode] v1 mode = **Race** (finite, finish-line). Survival deferred to S7.
- [x] 2026-08-06 → 2026-08-06 [decision] [infra] Colyseus server **co-located on host laptop** (zero-setup office play).
