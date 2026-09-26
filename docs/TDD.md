# SLUR — Technical Design Document (TDD)

> Status: **v1 — as-built through S6.** Architecture and the shipped shape of the system. Stack-specific
> idioms live in `../conventions/*`; this doc references them rather than repeating them. Decisions +
> rationale live in `DECISIONS.md` (the ADR log) — this doc states the *current* design, with no inline
> "superseded" retractions to peel back.

## 1. Stack (decided)

**Exact versions are pinned in the pnpm catalog (`pnpm-workspace.yaml`) — the single source of truth.** Read
the catalog, never a version copied into prose.

| Layer | Choice | Notes |
|-------|--------|-------|
| Server | **Colyseus 0.17** | Authoritative rooms, `@colyseus/schema` 4. See `conventions/colyseus.md` |
| Client SDK | **`@colyseus/sdk`** | NOT legacy `colyseus.js` (frozen at 0.16) |
| Transport | WebSocket (Colyseus) | LAN = low latency; TCP HOL acceptable. Web hosting adds WAN latency — client prediction + interpolation absorb it. See `conventions/netcode.md` |
| Client routing | **React Router 8** (framework mode, SPA `ssr:false`) | Static SPA, typed routes, auto code-split, Route Modules. Import from `react-router`. See `conventions/react-router.md` |
| Rendering | **R3F 9** + drei + postprocessing | Neon/bloom. **Pin `three@0.185.x`** (postprocessing peer `<0.186`). See `conventions/r3f.md` |
| Shaders (experimental) | **brometal** — later spike | TS→WGSL shader compiler for WebGPU (not a renderer); author custom track/trail shaders in TS, consume from R3F |
| Simulation | **koota** (ECS) | Client-only render/entity layer; chosen over miniplex (frozen) / bitECS (overkill). See `conventions/ecs.md` |
| Repo | **pnpm monorepo** (`pnpm -r`, no Turborepo) | `apps/{client,server}` + `packages/shared`. See `conventions/monorepo.md` |
| Build | Vite 8 (client) · tsx/Node ESM (server) · `tsc -b` (shared) | TS end-to-end, ESM everywhere |
| Language | **TypeScript 7** (strict) | Shared types/schema via `@slur/shared` |

## 2. Topology

```
                      ┌────────────────────  LAN / WAN  ───────────────────┐
                      │                                                    │
  ┌───────────────┐   │   WebSocket (Colyseus)    ┌───────────────────┐    │
  │  HOST client  │───┼──────────────────────────►│  Colyseus server  │    │
  │ (also a peer) │   │                           │  ┌─────────────┐  │    │
  └───────────────┘   │                           │  │   RunRoom   │  │    │
  ┌───────────────┐   │                           │  │ authoritative│ │    │
  │  PEER clients │───┼──────────────────────────►│  │ sim @ fixed  │ │    │
  │   (2..12)     │◄──┼── state patches @ ~20Hz ──│  │ timestep     │ │    │
  └───────────────┘   │                           │  └─────────────┘  │    │
                      │                           └───────────────────┘    │
                      └────────────────────────────────────────────────────┘
```

- **Server owns truth:** positions, hits, pickups, deaths. Clients send **inputs**, not positions.
- **Host** is just the client that created the room (start/config authority at the *session* level). The
  **server** holds *simulation* authority. Host ≠ server-trust.
- The server may run **co-located on the host's machine** (zero-setup LAN play) **or on a hosted web
  server**. Same authoritative `RunRoom` either way; only the deploy target and the client's URL change.

## 3. Client architecture

```
React Router (SPA) — apps/client/app/routes.ts
  ├─ /                 Landing: live room list, host-or-join, over the ambient Grid-Void scene
  ├─ /test-level       Fixed flyable level for art work (no server)
  └─ /game/:roomId     The room — lobby · countdown · race · results, as phase-overlays over one Canvas
```

- **The socket and the `<Canvas>` outlive any single route.** The Colyseus room is a module singleton, never
  a `useEffect`-owned resource (the S2 lifetime bug — CLAUDE.md non-negotiable #8). Never remount the
  renderer on navigation. See `conventions/react-router.md`, `r3f.md`.
- **Networked state → local ECS → R3F render.** The ECS is the bridge:
  - Colyseus `onStateChange` / schema callbacks feed authoritative snapshots into the ECS.
  - Systems interpolate/predict and mutate entity transforms.
  - R3F reads entity transforms in `useFrame` via **refs/instancing — no per-frame React re-renders** (see
    `conventions/ecs.md`, `r3f.md`).
- **Audio is client-local and OUTSIDE React** (`app/audio/**`). The `AudioContext` + master/duck buses live
  on a **module singleton**, resumed on the first user gesture. SFX bind to ECS/game events (`usePowerUp` /
  `'hit'` / `stunTimer` edge / pickup grab / the threat HUD); positional panning via three.js
  `PositionalAudio` (camera = listener), read in `useFrame`. Engine hum = synthesized oscillator (pitch ∝
  speed); discrete SFX = CC0/CC-BY samples. See `AUDIO.md`.
- **Front-of-house over live 3D.** The landing renders the ambient Grid-Void scene (`scene/environment.tsx`)
  behind a de-rounded neon UI; the lobby likewise overlays the live scene.

## 4. Simulation model

- **One shared `simulate(state, input, dt)` module** in `@slur/shared`, imported by BOTH server (authority)
  and client (prediction). Divergent sim code = misprediction; a single module is the fix (`netcode.md`).
- **Integration: semi-implicit Euler** over a plain framework-free `SimShip` shape — `PlayerState` declares
  the same fields, so a Schema instance structurally satisfies it → identical sim server-side. Kinematic
  control (no physics engine). `stepShip` is split into pure phase-mutators. **Jump is authored
  intuitively** (height + apex/descent times) and the physics derived — GDC *"Building a Better Jump"*
  (`DEFAULT_JUMP` → `deriveJump`).
- **Client = two loops:** fixed-60 physics accumulator + render on rAF/display-refresh, bridged by
  **interpolation** (`advance()` returns `alpha`; render lerps prev→curr into `Object3D` refs via koota — no
  per-frame React re-render). Same accumulator the server uses.
- **Fixed timestep 60 Hz** (accumulator loop) on the server via `setSimulationInterval`; **`patchRate`
  ~20 Hz** to clients (decoupled from sim rate).
- Clients render at display rate, **interpolating** (~50–100 ms delay; linear pos / slerp rot) between
  authoritative snapshots for remote ships and projectiles.
- **Local player:** client-side prediction from local input + **server reconciliation**
  (`lastProcessedInput` seq). This is what keeps web/WAN latency playable, not just a LAN nicety.
- **Camera:** rubberband chase (`game/camera/chase.ts`, constants in `CHASE` — height/back/lookAhead/
  lookAtLift/fov, owner-tuned per ADR-011). A **rearview mirror** (2nd render pass) was deferred at S5 in
  favour of a **threat-warning HUD** (cheaper; no bloom/render-priority cost); the mirror rides with
  homing/mines as a fast-follow.
- **Deterministic track:** the room state carries a **descriptor** (opaque key — procgen `{seed, tier}` or
  authored `{levelId}`); both ends **materialize** an identical physics-and-anchors `Track` from it → never
  sync geometry tile-by-tile. The sim depends on the `Track` **interface**, not the descriptor's contents.
  Visuals are resolved separately client-side (never synced). ADR-000/001/002.
- **Track generator — rhythm-paced (ADR-006).** Three primitives (gaps · deadly blocks · slow blocks). Two
  layers: **(macro)** a difficulty **arrangement envelope** (`intensityAt`) — a staircase of escalating
  waves, tense verses → building pre-choruses → chorus slams → a bridge-breakdown valley → final chorus →
  outro; the music is **hidden pacing scaffolding only, never a rhythm game**. **(micro)** **discrete slalom
  + flick** — short cube pillars (`BLOCK_DEPTH 8u`, not full-depth walls) placed OUTSIDE a moving corridor
  by uncorrelated noise with a 1-lane edge buffer, plus a 1-lane **flick** pillar that juts in to force a
  sidestep; slow grace-notes on the line; **varied gaps** (full-width + partial floor-strip). Fairness is
  the derived ceiling: `SLOPE_CAP` / `CURV_CAP` (the reversal rate the least-capable class can still thread)
  and a `≥ MIN_LANE` corridor per z-slice, asserted in `sim/track.test.ts`.
  - **Tracks materialize once at load** (finite courses). The old `segmentAt(i)` **O(1) random-access**
    constraint existed only for endless Survival (dropped — ADR-004) and no longer binds new generator work;
    the O(1) path still works and stays as the micro fill layer.
  - Prior generators (the S6 carved value-noise line + noise-walls; the ADR-003 two-layer beat grammar) are
    retired to `archive/superseded-design.md`.
- **Lag compensation deferred**, but the server keeps a cheap per-ship position-history ring buffer so it is
  a drop-in later.

## 5. Networked state (Colyseus Schema) — AS-BUILT (APPEND-ONLY: declaration order = wire format)

Field order below mirrors `packages/shared/src/schema.ts`. **Appending is safe; reordering is a wire break.**

```
RunState (room state)
  ├─ phase: uint8            // 0 lobby · 1 countdown · 2 racing · 3 finished  (race/director.ts PHASE)
  ├─ elapsed: float32        // RACE clock — reset at GO, advances ONLY while racing (finishTime/deadline are race-relative)
  ├─ descriptor: TrackDescriptorState  // ADR-001; replaced the old `seed: uint32`
  ├─ players: MapSchema<PlayerState>
  ├─ hostId: string          // sessionId; owns GO / Play-Again; reassigned on host leave
  ├─ countdown: float32      // >0 only during countdown; client renders ceil()
  ├─ finishDeadline: float32 // leader+grace race-end clock (0 until first finisher)
  ├─ projectiles: MapSchema<Projectile>  // server-sim bolts; interp-only on clients; pruned on hit/expire
  └─ pickupTaken: MapSchema<boolean>     // per-anchor availability (present && true = taken); keyed by pickup ANCHOR id (ADR-002) — positions derive from the descriptor, NEVER synced

TrackDescriptorState — { kind, seed, tier, length, levelId }
  kind selects the arm (procgen built · authored reserved); tier/length reserved-unwired.
  Both ends materialize an identical Track via resolveTrack().

Projectile — a live bolt; server-owned, client-interpolated like a remote ship (never predicted)
  ├─ x, y, z: float32        // authoritative pose (straight ribbon: x fixed at fire, z advances)
  ├─ ownerId: string         // firer sessionId — owner-immune in boltHits
  └─ ttl: float32            // seconds to expiry; server prunes at <= 0

PlayerState (implements SimShip → the server runs the shared simulate() on the schema instance directly)
  ├─ x, y, z, vx, vy, vz                                // authoritative transform
  ├─ grounded, jumpsUsed, jumpHeld, coyoteTimer, bufferTimer  // jump state (MUST sync so client replay re-predicts)
  ├─ lastProcessedInput: uint32                         // client reconciliation seq
  ├─ connected: boolean                                 // false while dropped (reconnection window)
  ├─ dead, respawnTimer, lastSafeX, lastSafeZ           // collision / respawn
  ├─ invulnTimer                                        // dead field, never written (#281, ADR-016)
  ├─ finished, finishTime                               // finish latch + server-stamped race time
  ├─ shipId: string                                     // → class → FlightTuning + armour, resolved BOTH ends
  ├─ name: string, colorId: uint8                       // identity — lobby list, standings, ship tint
  ├─ spectating: boolean                                // joined mid-round → NOT simulated
  ├─ stunTimer: float32                                 // SimShip field — >0 freezes control (predicted); set on bolt hit
  └─ heldPower: uint8                                   // held slot (0 none / 1 bolt); schema-only, the sim never reads it
```

Keep state **minimal** — sync only what clients can't derive. Effects/particles are client-local.
(Anti-pattern: syncing render state. See `conventions/colyseus.md`.) **Room list = the built-in Colyseus
`LobbyRoom`** (`define('lobby', LobbyRoom)` + `RunRoom…enableRealtimeListing()` — REQUIRED, the updateLobby
hooks live inside it); `{ hostName, phase }` rides along as non-schema `setMetadata`. No custom HTTP route.

## 6. Server systems (per fixed tick — PHASE-GATED, `race/director.ts`)

The fixed loop switches on `phase`:

- **countdown:** bleed the countdown timer; NO ship motion; → racing at 0 (queues cleared).
- **racing:** ingest queued inputs (seq #) → integrate ONLY racers (spectators skipped) → resolve track
  collisions / deaths / respawns → stamp `finishTime` on finish → `raceShouldEnd?` (all-done / leader-grace
  `RACE_GRACE_SECONDS` 45 s / no racers left; no time cap, #301) → finished.
- **lobby / finished:** idle — ships hold pose.
- Host `start`/`restart` + ship/colour picks (lobby-only) are **messages**, validated server-side (host +
  phase).
- **`stepWorld`** (after `stepRace`) advances bolts (shared `stepProjectiles`) → owner-immune AABB
  `boltHits` → victim `stunTimer` (`stunDurationForShip` = `SimConfig.stunSeconds × (1 − class armour)`) +
  one-shot `broadcast('hit')` → prune; pickup grab-on-overlap → `heldPower` + server-plain respawn timer;
  `USE_POWERUP` spawns a bolt from the authoritative pose; `clearCombat` on each race boundary.
- Emit patch (`patchRate` ~20 Hz).

Difficulty is baked into the finite track at materialize-time via the ADR-006 envelope — never advanced live
by distance (ADR-004 dropped endless Survival).

## 7. Shared code — `@slur/shared` (`packages/shared`)

Client and server MUST share: `@colyseus/schema` definitions, the `simulate()` step, the **`Track`
provider(s)** (`resolveTrack(descriptor) → Track`), pure game math, the **`ShipClass` stat table** (GDD
§5.5), and power-up/enum constants. **`simulate()` + the `Track` provider being shared and deterministic**
is the linchpin that avoids syncing geometry and prevents client/server misprediction. The sim depends on
the `Track` **interface**, never on how it was produced (ADR-000/001) — so authored levels drop in with zero
sim change.

- **Compiled with `tsc` → `dist`** (NOT source-consumed): `@colyseus/schema@4` needs `experimentalDecorators`
  + `useDefineForClassFields:false`; JIT source-consumption makes esbuild/tsx disagree on decorator config
  and silently corrupt the wire format. ESM-only, private, `exports` map, project references + `tsc -b`.
  See `monorepo.md`.
- Package scope is **`@slur/*`** (`@slur/shared`, `@slur/client`, `@slur/server`).

## 8. Testing strategy (lightweight — it's a side project)

`pnpm test` runs all three workspaces: `node:test` for shared + server, vitest for the client. **Read the
count from the run, never from this doc.**

- **Unit:** pure logic — track generator determinism (same seed → same track), the fairness asserts
  (`MIN_LANE` corridor per z-slice, `SLOPE_CAP`/`CURV_CAP`, gap reach), collision math, combat pure-fns
  (`stepProjectiles` / `boltHits` / pickups), the race director, ship-class armour invariants.
- **Determinism guard:** a track generated from a fixed seed must compare equal across the "server" and
  "client" code paths.
- **Integration:** `@colyseus/testing` drives a real `RunRoom` (`apps/server/src/rooms/run-room.test.ts`) —
  bolt hit/prune, pickup grab + respawn, and the add/remove symmetry the client relies on. The remaining
  gap is the full round lifecycle (lobby→countdown→racing→finished) with standings order and
  join-mid-race → spectate.
- No heavy E2E for v1 — playtesting is the real test.

## 9. Non-goals (v1)

Matchmaking across networks, persistence/accounts, mobile/touch, gamepad, spectator replays. Anti-cheat
stays light for LAN/trusted-crew play; **public web hosting will need it revisited** (the server is already
authoritative, which is the foundation).

## 10. OPEN QUESTIONS

_None outstanding._ The v0 questions are resolved and folded into the body above: server co-located on the
host for LAN play (hosted deploy is the alternative path) · full client prediction + reconciliation, not
interpolate-only · the sim is a plain pure `simulate()` run directly on the schema, with koota client-only ·
60 Hz sim / 20 Hz patch.
