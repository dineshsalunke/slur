# Backlog

Project **SLUR**. Slice roadmap — see `docs/` (GDD/TDD/ADD/AUDIO) and `.claude/phases/2026-08-06-setup.md`.
Working model: pick one slice → arc (ideate → brainstorm → prep → align) collaboratively → implement in a
background agent → reconcile; design the next slice while the current one builds.
Dependency note: **S1→S2→S3→S4 are sequential** (each builds on the prior's code); S5–S7 layer on S4.

## Pending

- [x] 2026-08-06 → 2026-08-07 [feature] [slice] S1 — Flight feel (local, no network) — **DONE; human gate passed 2026-08-07 ("controls are good")**
  Code is source of truth (`@slur/shared/src`, `apps/client/app/game/`); spec + as-built reconcile: `.claude/phases/2026-08-06-s1-flight-feel.md`. Jump = derived (GDC "Building a Better Jump").
- [ ] 2026-08-06 [feature] [slice] S2 — Networked flight (server-authoritative)
  why: de-risk netcode + the schema-decorator footgun while the surface is tiny. shared: @colyseus/schema + same simulate() server-side; server: RunRoom fixed-timestep loop + buffered inputs; client: @colyseus/sdk, send inputs, reconcile→koota (predict local, interpolate remotes). Done: two laptops fly the same seeded track and see each other.
- [ ] 2026-08-06 [feature] [slice] S3 — Track, hazards, collision
  why: built on the shared sim → auto-networked, no port. Deterministic seeded track + finish gate, hazards (gaps/walls/gates), collision + death; client instanced track/hazards + camera juice + first bloom. Done: race a hazard track to a finish, can die/win.
- [ ] 2026-08-06 [feature] [slice] S4 — Session flow → complete Race
  why: makes it "a game". server lifecycle (lobby→running→results, finish detection, standings, restart, join-mid-run spawn-beside-pack, reconnection); client landing/host/join/room routes, lobby + ship/colour pick, results, spectate. Done: full office race lobby→results with a winner.
- [ ] 2026-08-06 [feature] [slice] S5 — Combat & power-ups
  why: the "mess with your friends" payload — after the loop works. shared: pickups + roster (Bolt/Mine/Shield/Boost…), server-authoritative hit detection, disruption (stun/spin), auto-lock-nearest; client: instanced pickups, combat VFX + threat-warning HUD, held-powerup HUD. **Includes the rearview mirror camera** (2nd render pass → RenderTexture on a HUD inset; main Loop takes render priority) — needed to see tracking projectiles from behind. Design note in S1 phase doc.
- [ ] 2026-08-06 [feature] [slice] S6 — Identity: ship classes + audio + juice
  why: makes it feel like SLUR. 3 classes with real stat deltas + hitbox-scales-with-armour + lobby pick; audio pass (engine/boost/hit/positional + synthwave + LCARS blips); art pass (TRON derezz, trails, LCARS HUD, comfort sliders).
- [ ] 2026-08-06 [feature] [slice] S7 — Survival mode + hardening
  why: second mode + robustness. endless track + chasing derezz-wall + distance/time scoring; LAN discovery (room-code QR / mDNS); reconnection hardening; perf tuning for 8–12 ships.

- [ ] 2026-08-07 [research] [assets] Find CC-licensed X-wing-style / low-poly space-fighter GLBs for ship models
  why: user wants X-wing-style ships. Surface CC-licensed options (Sketchfab CC, Poly Pizza, Quaternius, Kenney, Fab) + IP caveat — actual X-wing is Lucasfilm IP, so use CC "X-wing-style" or original fighters, not a rip. Do after context clear (user's call: "we'll do it once we're back").

## Done
- [x] 2026-08-06 → 2026-08-06 [decision] [netcode] v1 mode = **Race** (finite, finish-line). Survival deferred to S7.
- [x] 2026-08-06 → 2026-08-06 [decision] [infra] Colyseus server **co-located on host laptop** (zero-setup office play).
