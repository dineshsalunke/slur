<!-- WRITING STANDARD — ASD-STE100 (Simplified Technical English). All CLAUDE-facing docs and replies SHALL
conform to ASD-STE100 where applicable: short sentences, active voice, one instruction per sentence, approved
vocabulary, no needless synonyms. "Where applicable" = procedural, spec, and how-to prose. Evocative design
pitch and flavour copy keep their voice. When clarity and voice conflict in technical text, clarity wins. -->

# SLUR — Project Guide

**SLUR** is a casual **multiplayer ship-racer** — play it on the office **LAN** or **hosted on the web** — a
party game about *messing with your friends*. Player-controlled flight down a **finite track to a finish line**
— **Race** — over courses that range from short to long. SkyRoads (1993) speed/jump × Blur (2010) pickup-combat
× [cuberun](https://github.com/akarlsten/cuberun) neon. **TRON / Star Trek** aesthetic. Server-authoritative,
**round-based** — the host launches a run and everyone in the room races together; **join a room anytime and
race the next round** (the field locks at GO; late joiners spectate). Asymmetric ship classes
(Fighter/Freighter/Interceptor…).

Design lives in **`docs/`** (GDD · TDD · ADD · AUDIO). This file is **how we build**. Retired design intent
lives in `docs/archive/superseded-design.md` (forward-framed as **PRECEDED**); decisions + rationale in
`docs/DECISIONS.md`.

---

## ⚠️ Golden rule — read the conventions before touching a subsystem

`conventions/*.md` are the **distilled, source-verified research** for each part of the stack — idioms,
version pins, anti-patterns, footguns. They exist so we **don't re-derive the stack from memory** (memory is
often wrong about these exact APIs/versions — see notes below).

**Before writing or changing code in a subsystem, read its `conventions/*.md` file.** Read the *one* you
need — do not bulk-load all seven every session (wasteful). This rule replaces auto-loading everything.

| Touching… | Read first | Verified-this-session pins & gotchas |
|-----------|-----------|--------------------------------------|
| Server / rooms / state sync | `conventions/colyseus.md` | Colyseus **0.17.10**; client is **`@colyseus/sdk` 0.17.43** (NOT legacy `colyseus.js`); `@colyseus/schema` **4.0.30**; callbacks via `getStateCallbacks(room)` |
| Client routing / app shell | `conventions/react-router.md` | React Router **8.3.0**, **framework mode SPA** (`ssr:false`); Route Modules + `routes.ts`; import from `react-router` (no `react-router-dom`); ESM-only; `useBlocker` guards back-button mid-match |
| Rendering / VFX / bloom | `conventions/r3f.md` | R3F **9.7.0**, drei **10.7.8**, postprocessing **3.0.4**; **pin `three@0.185.x`** (postprocessing peer `<0.186`); HDR emissive + single global `<Bloom>` |
| Entities / systems / sim | `conventions/ecs.md` | **koota 0.6.6** (chosen over miniplex/bitECS); no-re-render bridge; `reconcile()` Colyseus→ECS |
| Networking / prediction | `conventions/netcode.md` | Inputs-not-positions; shared 60Hz `simulate()`; `patchRate` 20Hz; server-authoritative hits |
| Repo / builds / packages | `conventions/monorepo.md` | pnpm **11.20.0**; `packages/shared` is **`tsc`-compiled** (schema needs `experimentalDecorators`), not source-consumed |
| 2D UI styling (HUD/lobby/landing) | `conventions/tailwind.md` | **Tailwind CSS v4** (`tailwindcss` **4.3.3** + `@tailwindcss/vite` **4.3.3**); CSS-first (`@import "tailwindcss"`, no config file); **DOM UI ONLY — never the Canvas**; no vanilla `.css`/CSS-Modules for new UI |

See `conventions/README.md` for the index.

---

## Stack (decided)

| Layer | Choice |
|-------|--------|
| Server | Colyseus 0.17 (`@colyseus/schema` 4) |
| Client routing | React Router 8 (framework mode, SPA `ssr:false`) |
| Rendering | React Three Fiber 9 + drei + postprocessing (three **0.185.x**) |
| 2D UI styling | **Tailwind CSS v4** (DOM UI only — HUD/lobby/landing; never the Canvas) |
| Simulation | **koota** ECS |
| Repo | pnpm workspace monorepo (plain `pnpm -r`, no Turborepo yet) |
| Build | Vite 8 (client) · tsx/Node ESM (server) · `tsc -b` (shared) |
| Language | TypeScript 7 (strict), ESM everywhere |

Versions are pinned via a **pnpm catalog** (`pnpm-workspace.yaml`) — single source of truth; see `monorepo.md`.

## Monorepo layout

```
slur/
├── apps/
│   ├── client/      @slur/client   — Vite + React 19 + RR8 + R3F 9 + koota
│   └── server/      @slur/server   — Colyseus 0.17, Node ESM, tsx watch
├── packages/
│   └── shared/      @slur/shared   — Schema classes + shared simulate() + constants/types
│                                     COMPILED (tsc→dist), ESM-only, private
├── conventions/     stack idioms (read-before-touching)
└── docs/            GDD · TDD · ADD · AUDIO
```
**Package scope: `@slur/*`.** No `game-core` / `config` packages until real duplication demands them.

## The load-bearing contract (baseline — `docs/DECISIONS.md` ADR-000)

> A room is a **descriptor** + **sequence-numbered inputs** + a thin slice of **dynamic state**. The server
> never sends geometry or visuals. Both ends materialize an *identical* physics-and-anchors `Track` from the
> descriptor (procgen or authored provider); the one shared `simulate()` runs over it. Prediction,
> collision-networking, deterministic pickups/anchors, and hazards are **consequences of one fact: the sim
> depends on the `Track` *abstraction* + determinism — never on how the track was produced.**

**Four invariants** (everything else derives): **(1)** descriptor is synced, the `Track` is materialized
locally — never sync the `Track`; **(2)** `Track` = gameplay data only (physics + anchors), zero visuals —
litmus: "would two clients disagreeing on this field desync the game?" (yes → in Track); **(3)** motion-affecting
→ shared `simulate()` + synced state, cosmetic → broadcast; **(4)** determinism — identical materialize +
`simulate()` across both JS engines (integer/IEEE-754 basic ops only, no transcendentals in the shared path).

## Project non-negotiables

1. **Server is authoritative.** Clients send **inputs (sequence-numbered), never positions**. Server owns positions, hits, pickups, deaths.
2. **Deterministic track from a descriptor** (in room state) — materialized identically on both ends behind the `Track` interface; never sync geometry tile-by-tile. *(← was "from a seed"; the seed is now one field inside the descriptor, owned by the procgen provider — ADR-000/ADR-001.)*
3. **One shared `simulate()`** (60Hz fixed timestep) in `@slur/shared`, imported by client (prediction) and server (authority).
4. **No per-frame React re-renders in gameplay.** ECS → R3F via refs/instancing in `useFrame` (see `ecs.md`/`r3f.md`).
5. **`@slur/shared` is `tsc`-compiled to `dist`**, not JIT-source-consumed — the `@colyseus/schema` decorator config makes source-consumption a silent wire-corruption footgun.
6. **Ship stats are data** (`ShipClass` config in `@slur/shared`), server-authoritative — balancing is a config edit, not code.
7. **No Python** for tooling/scripts (inherits user rule NN-1): jq/yq → fish/bash → node.
8. **`useEffect` is an escape hatch, NOT the default — and never the *only* way.** React's own docs file
   Effects under **"Escape Hatches"** and ship a page titled *"You Might Not Need an Effect"*: Effects
   exist to synchronize with systems *outside* React, and are the tool of **last** resort. Reach for the
   idiomatic mechanism FIRST — derive during render, handle events in handlers, own/flow data through
   **React Router loaders/actions**, use refs for imperative work, and keep **long-lived resources
   (sockets, subscriptions, the Colyseus room, timers) OUTSIDE React on module singletons** — never tied
   to a component's mount/unmount. **Coupling a connection's lifetime to a `useEffect` cleanup is the
   exact bug that cost S2** (`room.leave()` in an unmount cleanup → a route remount tore the room down →
   a new room every render, two clients never shared one). Meta-rule: the framework authors built these
   idioms deliberately — "most code does X" (including model training priors) is **not** evidence X is
   right; it is usually the mediocre default. Follow the idiom, and understand **why** before deviating.
   *(This is a hard non-negotiable, per explicit user directive after the S2 incident.)*
9. **React house style** (per explicit user directive, 2026-08-09): **no fragment shorthand** — write
   `<Fragment>…</Fragment>`, never `<>…</>`; **one component per file** (file name matches the component;
   helpers/hooks/constants may share). Exception: React Router route modules (`root.tsx`, `routes/*`) keep
   their framework-mandated multi-export. Full rule + rationale in `conventions/r3f.md` ("House React style").
10. **Componentize by subscription boundary — push every subscription DOWN to its leaf** (per explicit user
    directive, 2026-08-10). Split components wherever a distinct data subscription lives (koota `useQuery`, a
    Colyseus `.listen`, a React Router loader value, any store hook) so a change re-renders **only that leaf,
    never its siblings**. A parent that wraps siblings holds **zero** reactive subscriptions — only
    `useWorld()`/context + `useFrame`. Never subscribe high and prop-drill the value down. This is the
    composition rule *behind* non-negotiable #4: components are split so each re-render boundary is as small
    and as low in the tree as possible — not for tidiness. Full rule + rationale in `conventions/r3f.md`
    ("Componentize by subscription boundary"); backing incident: `colyseus-state-not-reactive` +
    `think-rerender-subscription-impact` memories.
11. **Space is CONTINUOUS; `CELL = 4u` is an AUTHORING SNAP GRID ONLY — read GDD §0 before ANY track/geometry/
    ship-size/collision work** (per explicit user directive, 2026-08-11 — this is core gameplay and was
    repeatedly misunderstood). `CELL` is the design-time snap increment for **all** authoring (procgen +
    hand-authored) — it is **NOT** a runtime unit, **NOT** a movement snap, **NOT** a block-size rule, and the
    sim never reads it (collision is continuous float-AABB in `step.ts`). **Blocks may be any size** (`5.5×5.5×8u`,
    …) — never assume cell multiples. The **one** load-bearing spatial invariant is threadable clearance:
    at every z-slice the widest lethal-free floor run **≥ `MIN_CLEAR = MAX_SHIP_WIDTH (1 cell = 4u) +
    CLEARANCE_MARGIN (3u) = 7u`**. Ceiling is the **ship-size contract** (widest class ≤ 1 cell, GDD §5.5), NOT
    roster-max (so a seed's geometry is stable across roster edits); a module-load assertion `2·max(halfW) ≤
    MAX_SHIP_WIDTH` enforces conformance. Never hand-type a width against the grid — that caused the stale
    "Freighter 3.6u" bug. Full contract: **GDD §0**. Generator internals: ADR-007 (`docs/DECISIONS.md`).

## Dev workflow

Scaffolded and verified 2026-08-06 (**runnable blank skeletons, no game logic yet**). From the repo root:

| Command | Does |
|---------|------|
| `pnpm install` | Install all workspaces (pnpm 11, catalog-pinned) |
| `pnpm dev` | All three in parallel: `shared` tsc-watch · `server` (tsx watch, `:2567`) · `client` (react-router dev, `:5173`) |
| `pnpm build` | Topological build: shared → server → client SPA (`apps/client/build/client`) |
| `pnpm typecheck` | `tsc -b` (shared/server) + `react-router typegen && tsc` (client) |
| `pnpm lint` | `biome check .` + `ls-lint` |
| `pnpm format` | `biome format --write .` |

**As-built notes (deviations worth knowing):**
- **Server transport:** `@colyseus/core` + `@colyseus/ws-transport` + `express` — NOT the `colyseus` meta-package (it pulls a git-based uWebSockets build pnpm blocks, plus auth/monitor/redis we don't need). `express` is ws-transport's optional peer.
- **0.17 client SDK is `@colyseus/sdk`**, not legacy `colyseus.js` (frozen at 0.16) — deferred until the client talks to the server.
- **Deferred deps (implement phase):** R3F/three/drei/postprocessing/koota/`@colyseus/sdk` are NOT installed yet; client renders a blank page.
- **`@slur/shared` now holds the S1 flight sim** — tuning/constants, input, `SimShip`, phase-split `stepShip`, fixed-step. Jump physics **derived** from `DEFAULT_JUMP` (GDC "Building a Better Jump"). Schema/networked state still land in S2.
- **`/solo` was REMOVED** (commit `52f5a04`) and stays removed — the old S1 note "`pnpm dev` → /solo" is stale. **Playtest the track in a hosted room:** the S4 `/game/:roomId` path materializes + renders + `simulate()`s the real track, and a host can **start solo** (no min-player gate on `startRace()`) → GO → race. Controls: W/S throttle-brake, A/D strafe, Space jump (tap/hold/double), Shift boost. Tune flight via `DEFAULT_JUMP` + `DEFAULT_TUNING` in `packages/shared/src/constants.ts`; tune the track via the ADR-006 arrangement-envelope + slalom/flick constants.
- **pnpm gates:** `allowBuilds: [esbuild, msgpackr-extract]` in `pnpm-workspace.yaml`; a global `minimumReleaseAge` policy auto-records version exclusions. `packageManager` pinned to `pnpm@11.12.0`.

## Working method

- **Design docs are living.** Each carries `OPEN QUESTIONS`; resolve with the team, fold the decision in, delete the question. Don't silently diverge from the docs — update them.
- **Arc phases** (Ideate → Brainstorm → Prep → Align → Implement → Reconcile): use `/arc` skill (load it — don't paraphrase). Thinking phases are collaborative; reviewed code is documented in the phase doc as reference, then built in Implement. Phase notes in `.claude/phases/`. **Status: S1 ✓ (solo flight sim; `/solo` since removed), S2 ✓ (networked flight), S3 ✓ — obstacle redesign + AABB collision + 5-class ship system (commit `12049bd`); 18 shared tests GREEN; feel-gate playtested (Freighter/imperial capped). **S4 ✓ — complete Race: live room list · host GO → countdown → race → leader+grace results → Play Again · lobby ship/colour pick + hero-orbit preview · spectator (cycle-any-racer) · leave guard · host authority+migration (commits `fc0418f`/`d155481`/`e5eb5f9`; human gate passed 2026-08-09). Round-based, Race spectate-next join policy (Survival dropped — ADR-004). **S5 ✓ — Combat & power-ups: BC1 server-sim projectiles → **Bolt** → **stun** (the track kills), track-placed pickups (`E` = discrete `USE_POWERUP`), server-authoritative hits; client bolt/pickup instancing + `heldPower` chip + hit-spark + on-ship stun-flicker + threat HUD; room→world bridge extracted (commits `9538e0e`→`fd6bdb3`; human gate 2026-08-10). Functionality locked, visuals polish deferred; Mine/Shield/Boost/auto-lock/rearview-mirror = fast-follows. NEXT: S6 (identity: `armour`/combat stats + lobby ship-pick UI + audio + art/juice).** S4 arc+as-built: `.claude/phases/2026-08-09-s4-session-flow.md` (+ `…-s4-batch4-spec.md`); procgen redesign (post-S4, validated headlessly): `…-procgen-flow-progression.md`. S3 arc (pt.1–5) in `.claude/phases/2026-08-09-collision-aabb-jump-vfx.md`; original S3 in `.claude/phases/2026-08-08-s3-track-hazards-collision.md`. **Design captured this session (durable in GDD):** §5.5 = 5-class matrix (Class = mechanics group, Ship = cosmetic variant; per-ship `FlightTuning`+footprint resolved by networked `shipId`); §5.2/§5.7 = **straight-ribbon + no-moving-geometry** constraints, **authored/procgen levels + two-floor fairness validator** (FIT + GAP-REACH; weave uncapped, self-balances via speed), and the **mechanic master-menu** (BC1–BC8 base capabilities). Balance is **playstyle-level, not geometry-equal**. Roadmap S1–S7 in `.claude/backlog.md`. **Track-provider ADRs (2026-08-10):** ADR-001 (`seed` → `TrackDescriptor` + `resolveTrack` provider) and ADR-002 (first-class `Track.anchors`; visual seam frozen) **SHIPPED** (#46/#47/#48); ADR-005 `validateTrack` deferred last. **ADR-006 (2026-08-10/11, playtest-tuned):** rhythm-paced generator — Believer arrangement envelope (`intensityAt`) + **discrete-slalom/flick** micro (short 4×8×8u cube pillars OUTSIDE a moving corridor via uncorrelated noise + 1-lane edge buffer; a 1-lane **flick** pillar juts in to force a sharp sidestep; slow grace-notes on the line) + **varied gaps** (full-width + partial floor-strip), over 3 fixed primitives (gaps/deadly/slow); continuous NOT a rhythm game; concretizes+supersedes ADR-003. Ships tuned for crisp flicks (strafeAccel/damp↑); chase camera raised above walls; `TRACK_SEGMENTS=400` (~2.5–2.8 min). Generator-only, feel-gated in a hosted room (`/solo` stays deleted); 71/71 tests green. **Committed `8ddc9d8`.** ("banks" was tried first + dropped as a tube.) Deferred: Slice 2 = positional-gap L/C/R *forcing*. See memory `rhythm-paced-generation` + `.claude/phases/2026-08-10-rhythm-paced-generation.md`. Full decision log + build sequence in **`docs/DECISIONS.md`**.
- **Roadmap = GitHub issues.** Actionable work lives as GitHub issues (`github.com/dineshsalunke/slur/issues`), grouped by milestone (**S6** current · **S7** next · **Backlog** deferred). `backlog.md` and the phase notes stay the design/narrative log; the issues are the task tracker. File an issue for every feature or fix before you build it (see `CONTRIBUTING.md`).
- **Batch related file changes** into one review turn.

---

## History

Retired design intent is **not** kept inline here — it lives in **`docs/archive/superseded-design.md`**,
forward-framed as **PRECEDED** (what it was → what it became → the ADR that moved us). Decisions + rationale:
**`docs/DECISIONS.md`** (the ADR log). Baseline reset was **2026-08-10** (ADR-004 dropped endless Survival).
