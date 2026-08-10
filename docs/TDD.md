# SLUR — Technical Design Document (TDD)

> Status: **v0 (reconciled with research)**. Architecture sketch. Stack-specific idioms live in
> `../conventions/*` — this doc references them rather than repeating them. Stack decisions below are final;
> tuning/behaviour details remain open (see §10).

## 1. Stack (decided — versions verified 2026-08-06, pinned via pnpm catalog)

| Layer | Choice | Notes |
|-------|--------|-------|
| Server | **Colyseus 0.17.10** | Authoritative rooms, `@colyseus/schema` **4.0.30**. See `conventions/colyseus.md` |
| Client SDK | **`@colyseus/sdk` 0.17.43** | NOT legacy `colyseus.js` (frozen at 0.16) |
| Transport | WebSocket (Colyseus) | LAN = low latency; TCP HOL acceptable. Web hosting adds WAN latency — client prediction + interpolation (server-authoritative, shipped S2) absorb it. See `conventions/netcode.md` |
| Client routing | **React Router 8.3.0** (framework mode, SPA `ssr:false`) | Static SPA, typed routes, auto code-split, Route Modules. Import from `react-router`. See `conventions/react-router.md` |
| Rendering | **R3F 9.7.0** + drei 10.7.8 + postprocessing 3.0.4 | Neon/bloom. **Pin `three@0.185.x`** (postprocessing peer `<0.186`). See `conventions/r3f.md` |
| Shaders (experimental) | **brometal** — later spike | TS→WGSL shader compiler for WebGPU (not a renderer); author custom track/trail shaders in TS, consume from R3F |
| Simulation | **koota 0.6.6** (ECS) | Chosen over miniplex (frozen) / bitECS (overkill). See `conventions/ecs.md` |
| Repo | **pnpm 11 monorepo** (`pnpm -r`, no Turborepo) | `apps/{client,server}` + `packages/shared`. See `conventions/monorepo.md` |
| Build | Vite 8 (client) · tsx/Node ESM (server) · `tsc -b` (shared) | TS end-to-end, ESM everywhere |
| Language | **TypeScript 7** (strict) | Shared types/schema via `@slur/shared` |

## 2. Topology

```
                       ┌─────────────────────  LAN / WAN  ────────────────────┐
                       │                                                      │
   ┌───────────────┐   │   WebSocket (Colyseus)     ┌────────────────────┐    │
   │  HOST client  │───┼──────────────────────────►│   Colyseus server  │    │
   │ (also a peer) │   │                            │  ┌──────────────┐  │    │
   └───────────────┘   │                            │  │   RunRoom    │  │    │
   ┌───────────────┐   │                            │  │  authoritative│ │    │
   │  PEER clients │───┼──────────────────────────►│  │  sim @ fixed  │  │    │
   │   (2..12)     │◄──┼── state patches @ ~20Hz ───│  │  timestep     │  │    │
   └───────────────┘   │                            │  └──────────────┘  │    │
                       │                            └────────────────────┘    │
                       └──────────────────────────────────────────────────────┘
```

- **Server owns truth:** positions, hits, pickups, deaths. Clients send **inputs**, not positions.
- **Host** is just the client that created the room (has start/config authority at the *session* level). The **server** holds the *simulation* authority. Host ≠ server-trust.
- Server may run **co-located on the host's machine** (zero-setup LAN play) **or on a hosted web server** (play over the internet). Same authoritative `RunRoom` either way; only the deploy target and the client's server URL change.

## 3. Client architecture

```
React Router (SPA)
  └─ <AppLayout>                     persistent: Colyseus connection + <Canvas> live across routes
       ├─ /            Landing / host-or-join
       ├─ /host        Room config → start
       ├─ /join        Discover/enter room
       └─ /run         In-game (mounts game systems, NOT the Canvas — Canvas is in layout)
```

- **Persistent `<Canvas>` and socket in the layout**, not per-route — never remount the renderer on navigation (see `conventions/react-router.md`, `r3f.md`).
- **Networked state → local ECS → R3F render.** The ECS is the bridge:
  - Colyseus `onStateChange` / schema callbacks feed authoritative snapshots into the ECS.
  - Systems interpolate/predict and mutate entity transforms.
  - R3F reads entity transforms in `useFrame` via **refs/instancing — no per-frame React re-renders** (see `conventions/ecs.md`, `r3f.md`).
- **(S6 — AS-BUILT 2026-08-10, `app/audio/**`) Audio subsystem — client-local, OUTSIDE React.** The `AudioContext` + master/duck buses live on a
  **module singleton** (never a `useEffect`-owned resource — the S2 lifetime bug), resumed on the first user
  gesture. SFX bind to ECS/game events (S5's `usePowerUp` / `'hit'` / `stunTimer` edge / pickup grab + the
  threat HUD); positional panning via three.js `PositionalAudio` (camera = listener), read in `useFrame`.
  Engine hum = synthesized oscillator (pitch ∝ speed); discrete SFX = CC0/CC-BY samples. See `docs/AUDIO.md`.
- **(S6 — AS-BUILT: landing done; in-game net-canvas integration REMAINING) Front-of-house over live 3D.** The landing (`/`) renders the ambient **Grid-Void** scene
  (`scene/environment.tsx`) behind a de-rounded neon UI; the lobby likewise overlays the live scene. *(The
  `/host`,`/join`,`/run`,`/solo` routes in the diagram above are historical — S4 collapsed flow into `/` +
  `/game/:roomId` phase-overlays; `/solo` was removed in S6.)*

## 4. Simulation model

- **One shared `simulate(state, input, dt)` module** in `@slur/shared`, imported by BOTH server (authority) and client (prediction). Divergent sim code = misprediction; a single module is the fix (see `netcode.md`).
- **Integration: semi-implicit Euler** over a plain framework-free `SimShip` shape — the S2 `PlayerState` schema declares the same fields, so a Schema instance structurally satisfies it → identical sim server-side, zero rework. Kinematic control (no physics engine). `stepShip` is split into pure phase-mutators; `resolveCollisions` is the seam S3 swaps for real track collision. **Jump is authored intuitively** (height + apex/descent times) and the physics derived — GDC *"Building a Better Jump"* (`DEFAULT_JUMP` → `deriveJump`).
- **Client = two loops:** fixed-60 physics accumulator + render on rAF/display-refresh (not pinnable to 60), bridged by **interpolation** (`advance()` returns `alpha`; render lerps prev→curr into `Object3D` refs via koota — no per-frame React re-render). Same accumulator the server uses. Cameras: rubberband chase now; **rearview mirror** (2nd render pass) was **deferred at S5** — v1 ships a **threat-warning HUD** for rear awareness (cheaper; no bloom/render-priority cost). The mirror is a fast-follow (rides with homing/mines).
- **Fixed timestep 60 Hz** (accumulator loop) on server via `setSimulationInterval`; **`patchRate` ~20 Hz** to clients (decoupled from sim rate).
- Client renders at display rate (60+), **interpolating** (~50–100 ms delay; linear pos / slerp rot) between authoritative snapshots for remote ships.
- **Local player:** client-side prediction from local input + **server reconciliation** (`lastProcessedInput` seq). Shipped full in S2 (not interpolate-only) — this is what keeps web/WAN latency playable, not just a LAN nicety. See `netcode.md`.
- **Deterministic track:** the room state carries a **descriptor** (opaque key — procgen `{seed,tier}` or
  authored `{levelId}`); both ends **materialize** an identical physics-and-anchors `Track` from it → never
  sync geometry tile-by-tile. The sim depends on the `Track` interface, not the descriptor's contents. Visuals
  are resolved separately client-side (never synced).
  > ⚠ SUPERSEDED 2026-08-10 (ADR-000/001) — was "server sends a **seed** … both ends generate geometry from it."
  > The seed is now one field inside the descriptor, owned by the procgen provider. See `docs/DECISIONS.md`.
- **(S6 — AS-BUILT 2026-08-10: `sim/noise.ts` + rewritten `sim/track.ts`) Track generator v2 — coherent weave + width variety** (plan in
  `.claude/phases/2026-08-10-procgen-weave-width-DRAFT.md`). Pickups now sit on the racing-line corridor
  (`corridorCenterX`). Deviation: walls are full-segment-depth (width variety only) — a `BLOCK_LIMIT=128` trade. Replaces the IID per-segment scatter with a
  hash-noise **carved racing-line + noise-walls** model (new trig-free `sim/noise.ts`: value-noise + smoothstep
  + triangle-wave), keeping `segmentAt(i)` **O(1) random-access**. Weave
  density/challenge rise via a **derived slope AND curvature cap** (curvature = the reversal-rate the
  least-capable class can still thread — the insight the slope-only prior missed); **variable block widths**
  fall out free + **fair-by-construction** once a `≥MIN_LANE` corridor is carved. `Segment`/`Block` shapes
  unchanged → renderer + collision untouched; the fairness assert becomes per-z-slice.
  > ⚠ NOTE 2026-08-10 (ADR-004) — the **O(1) random-access** constraint on `segmentAt(i)` existed *only* for
  > endless Survival. Endless is dropped → all tracks **materialize once at load**, so this constraint no longer
  > binds new generator work: stateful, rule-based materialize-time generation (a macro **beat grammar**,
  > ADR-003) is now legal. The current O(1) generator still works and stays as the micro fill layer.
- **Lag compensation deferred**, but server keeps a cheap per-ship position-history ring buffer so it's a drop-in later.

## 5. Networked state (Colyseus Schema) — AS-BUILT through S4 (APPEND-ONLY: declaration order = wire format)

```
RunState (room state)
  ├─ phase: uint8            // 0 lobby · 1 countdown · 2 racing · 3 finished  (@slur/shared race/director.ts PHASE)
  ├─ elapsed: float32        // RACE clock — reset at GO, advances ONLY while racing (→ finishTime/deadline are race-relative)
  ├─ descriptor: TrackDescriptorState  // (ADR-001, SHIPPED) replaced the old `seed: uint32`. Nested sub-schema {kind, seed, tier, length, levelId}; kind selects the arm (procgen built · authored reserved). Both ends materialize an identical Track via resolveTrack(); tier/length reserved-unwired.
  ├─ players: MapSchema<PlayerState>
  ├─ hostId: string          // sessionId; owns GO / Play-Again; reassigned on host leave
  ├─ countdown: float32      // >0 only during countdown; client renders ceil()
  ├─ finishDeadline: float32 // leader+grace race-end clock (0 until first finisher)
  ├─ projectiles: MapSchema<Projectile>  // (S5) server-sim bolts; interp-only on clients; pruned on hit/expire
  └─ pickupTaken: MapSchema<boolean>     // (S5) per-anchor availability (present&&true = taken); keyed by pickup ANCHOR id (ADR-002); positions derive from the descriptor, NEVER synced

Projectile (S5) — a live bolt; server-owned, client-interpolated like a remote ship (never predicted)
  ├─ x,y,z: float32          // authoritative pose (straight ribbon: x fixed at fire, z advances)
  ├─ ownerId: string         // firer sessionId — owner-immune in boltHits
  └─ ttl: float32            // seconds to expiry; server prunes at <=0

PlayerState (implements SimShip → server runs the shared simulate() on the schema instance directly)
  ├─ x,y,z, vx,vy,vz                                   // authoritative transform
  ├─ grounded, jumpsUsed, jumpHeld, coyote/bufferTimer // jump state (MUST sync so client replay re-predicts)
  ├─ dead, respawnTimer, invulnTimer, lastSafeX/Z      // collision / respawn (S3)
  ├─ finished, finishTime                              // finish latch + server-stamped race time
  ├─ shipId: string                                    // → class → FlightTuning, resolved BOTH ends
  ├─ name: string, colorId: uint8                      // identity — lobby list, standings, ship tint
  ├─ spectating: boolean                               // joined mid-round (Race) → NOT simulated
  ├─ connected: boolean                                // false while dropped (reconnection window)
  ├─ lastProcessedInput: uint32                        // client reconciliation seq
  ├─ stunTimer: float32                                // (S5) SimShip field — >0 freezes control (predicted); set on bolt hit
  └─ heldPower: uint8                                  // (S5) held slot (0 none / 1 bolt); schema-only, sim never reads it
```
Keep state **minimal** — sync only what clients can't derive. Effects/particles are client-local. (Anti-pattern:
syncing render state. See `conventions/colyseus.md`.) **Room list = the built-in Colyseus `LobbyRoom`**
(`define('lobby', LobbyRoom)` + `RunRoom…enableRealtimeListing()` — REQUIRED, the updateLobby hooks live inside
it); `{ hostName, phase }` rides along as non-schema `setMetadata`. No custom HTTP route.

## 6. Server systems (per fixed tick — PHASE-GATED, `race/director.ts`)
The fixed loop switches on `phase` (S4):
- **countdown:** bleed the countdown timer; NO ship motion; → racing at 0 (queues cleared).
- **racing:** ingest queued inputs (seq #) → integrate ONLY racers (spectators skipped) → resolve track
  collisions / deaths / respawns → stamp `finishTime` on finish → `raceShouldEnd?` (all-done / leader-grace /
  safety-cap) → finished.
- **lobby / finished:** idle — ships hold pose.
- Host `start`/`restart` + ship/colour picks (lobby-only) are **messages**, validated server-side (host + phase).
- **(S5) — AS-BUILT:** `stepWorld` (runs after `stepRace`) advances bolts (shared `stepProjectiles`) → owner-immune
  AABB `boltHits` → victim `stunTimer` (= `STUN_SECONDS × (1 − class armour)`, S6 sidegrade) + one-shot `broadcast('hit')` → prune; pickup grab-on-overlap → `heldPower` +
  server-plain respawn timer; `USE_POWERUP` message spawns a bolt from the authoritative pose; `clearCombat` on each
  race boundary. ~~**(S7 Survival)** advance difficulty (speed/hazard density) by distance.~~ *(Dropped — ADR-004; no endless mode. Difficulty is baked into the finite track at materialize-time via `D(i)` + the beat grammar, not advanced live by distance.)*
- Emit patch (`patchRate` ~20 Hz).

## 7. Shared code — `@slur/shared` (`packages/shared`)
Client and server MUST share: `@colyseus/schema` definitions, the `simulate()` step, the **`Track` provider(s)**
(`resolveTrack(descriptor) → Track` — procgen and/or authored), pure game math, the **`ShipClass` stat table**
(GDD §5.5), and power-up/enum constants. **`simulate()` + the `Track` provider being shared and deterministic**
is the linchpin that avoids syncing geometry and prevents client/server misprediction. The sim depends on the
`Track` **interface**, never on how it was produced (ADR-000/001) — so authored levels drop in with zero sim change.

- **Compiled with `tsc` → `dist`** (NOT source-consumed): `@colyseus/schema@4` needs `experimentalDecorators`
  + `useDefineForClassFields:false`; JIT source-consumption makes esbuild/tsx disagree on decorator config and
  silently corrupt the wire format. ESM-only, private, `exports` map, project references + `tsc -b`. See `monorepo.md`.
- Package scope is **`@slur/*`** (`@slur/shared`, `@slur/client`, `@slur/server`).

## 8. Testing strategy (lightweight — it's a side project)
- **Unit:** pure logic — track generator determinism (same seed → same track), power-up effect resolution, collision math. (Vitest.)
- **Determinism guard:** a test that generates a track from a fixed seed on "server" and "client" code paths and asserts equality.
- **Integration (later):** spin a headless Colyseus room, connect N mock clients, assert the round lifecycle
  (lobby→countdown→racing→finished) + standings order + join-mid-race → spectate. *(S4 started this: a headless
  `@colyseus/sdk` E2E drove lobby→countdown→racing and verified the live room-list metadata.)*
- No heavy E2E for v1 — playtesting is the real test. **(S5)** added combat pure-fn tests (`stepProjectiles` / `boltHits` / pickups → **41 shared tests**) + a throwaway room harness for `stepWorld`; `@colyseus/testing` still not installed (hardening item).

## 9. Non-goals (v1)
Matchmaking across networks, persistence/accounts, mobile/touch, gamepad, spectator replays. Anti-cheat stays light for LAN/trusted-crew play; **public web hosting will need it revisited** (the server is already authoritative, which is the foundation).

## 10. OPEN QUESTIONS
_(All initial questions RESOLVED by S1–S4 as-built — folded in below.)_
1. ~~**Server host**~~ → **co-located on the host laptop** for zero-setup LAN play (backlog decision 2026-08-06); **a hosted web deployment is the alternative path** for internet play (same authoritative room, different deploy target + client URL).
2. ~~**Prediction depth**~~ → **full client-prediction + reconciliation** (shipped S2; `lastProcessedInput` seq, `simulate()` replay). Not interpolate-only.
3. ~~**Sim on server: koota or plain?**~~ → **plain pure `simulate()` in `@slur/shared`** run directly on the schema; **koota is client-only** (render/entity layer). Confirmed by S1–S4.
4. ~~**Sim/patch rates**~~ → **60 Hz sim / 20 Hz patch** (`patchRate=50`), confirmed across S2–S4.

_Resolved by research: ECS = koota; monorepo = plain `pnpm -r`, 3 packages; shared `simulate()` module; `@slur/shared` compiled._
