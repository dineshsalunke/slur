# SLUR — Project Guide

**SLUR** is a casual **LAN multiplayer ship-racer** for the office — a party game about *messing with your
friends*. Player-controlled flight down a track in two modes: **Race** (finite, finish-line) and **Survival**
(endless, chase-wall). SkyRoads (1993) speed/jump × Blur (2010) pickup-combat × [cuberun](https://github.com/akarlsten/cuberun)
neon. **TRON / Star Trek** aesthetic. Server-authoritative, **drop-in-anytime** (host launches a run, players
join live and spawn beside the pack). Asymmetric ship classes (Fighter/Freighter/Interceptor…).

Design lives in **`docs/`** (GDD · TDD · ADD · AUDIO). This file is **how we build**.

---

## ⚠️ Golden rule — read the conventions before touching a subsystem

`conventions/*.md` are the **distilled, source-verified research** for each part of the stack — idioms,
version pins, anti-patterns, footguns. They exist so we **don't re-derive the stack from memory** (memory is
often wrong about these exact APIs/versions — see notes below).

**Before writing or changing code in a subsystem, read its `conventions/*.md` file.** Read the *one* you
need — do not bulk-load all six every session (wasteful). This rule replaces auto-loading everything.

| Touching… | Read first | Verified-this-session pins & gotchas |
|-----------|-----------|--------------------------------------|
| Server / rooms / state sync | `conventions/colyseus.md` | Colyseus **0.17.10**; client is **`@colyseus/sdk` 0.17.43** (NOT legacy `colyseus.js`); `@colyseus/schema` **4.0.30**; callbacks via `getStateCallbacks(room)` |
| Client routing / app shell | `conventions/react-router.md` | React Router **8.3.0**, **framework mode SPA** (`ssr:false`); Route Modules + `routes.ts`; import from `react-router` (no `react-router-dom`); ESM-only; `useBlocker` guards back-button mid-match |
| Rendering / VFX / bloom | `conventions/r3f.md` | R3F **9.7.0**, drei **10.7.8**, postprocessing **3.0.4**; **pin `three@0.185.x`** (postprocessing peer `<0.186`); HDR emissive + single global `<Bloom>` |
| Entities / systems / sim | `conventions/ecs.md` | **koota 0.6.6** (chosen over miniplex/bitECS); no-re-render bridge; `reconcile()` Colyseus→ECS |
| Networking / prediction | `conventions/netcode.md` | Inputs-not-positions; shared 60Hz `simulate()`; `patchRate` 20Hz; server-authoritative hits |
| Repo / builds / packages | `conventions/monorepo.md` | pnpm **11.20.0**; `packages/shared` is **`tsc`-compiled** (schema needs `experimentalDecorators`), not source-consumed |

See `conventions/README.md` for the index.

---

## Stack (decided)

| Layer | Choice |
|-------|--------|
| Server | Colyseus 0.17 (`@colyseus/schema` 4) |
| Client routing | React Router 8 (framework mode, SPA `ssr:false`) |
| Rendering | React Three Fiber 9 + drei + postprocessing (three **0.185.x**) |
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

## Project non-negotiables

1. **Server is authoritative.** Clients send **inputs (sequence-numbered), never positions**. Server owns positions, hits, pickups, deaths.
2. **Deterministic track from a seed** (in room state) — generated identically on both ends; never sync geometry tile-by-tile.
3. **One shared `simulate()`** (60Hz fixed timestep) in `@slur/shared`, imported by client (prediction) and server (authority).
4. **No per-frame React re-renders in gameplay.** ECS → R3F via refs/instancing in `useFrame` (see `ecs.md`/`r3f.md`).
5. **`@slur/shared` is `tsc`-compiled to `dist`**, not JIT-source-consumed — the `@colyseus/schema` decorator config makes source-consumption a silent wire-corruption footgun.
6. **Ship stats are data** (`ShipClass` config in `@slur/shared`), server-authoritative — balancing is a config edit, not code.
7. **No Python** for tooling/scripts (inherits user rule NN-1): jq/yq → fish/bash → node.

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
- **S1 flight prototype is playable:** `pnpm dev` → http://localhost:5173/**solo** — W/S throttle-brake, A/D strafe, Space jump (tap/hold/double), Shift boost. Tune feel via `DEFAULT_JUMP` + `DEFAULT_TUNING` in `packages/shared/src/constants.ts` (every field commented).
- **pnpm gates:** `allowBuilds: [esbuild, msgpackr-extract]` in `pnpm-workspace.yaml`; a global `minimumReleaseAge` policy auto-records version exclusions. `packageManager` pinned to `pnpm@11.12.0`.

## Working method

- **Design docs are living.** Each carries `OPEN QUESTIONS`; resolve with the team, fold the decision in, delete the question. Don't silently diverge from the docs — update them.
- **Arc phases** (Ideate → Brainstorm → Prep → Align → Implement → Reconcile): use `/arc` skill (load it — don't paraphrase). Thinking phases are collaborative; reviewed code is documented in the phase doc as reference, then built in Implement. Phase notes in `.claude/phases/`. **Status: S1 (flight feel) IMPLEMENTED & playable at `/solo`, feel-tuning in progress** (spec + as-built reconcile in `.claude/phases/2026-08-06-s1-flight-feel.md`). **Next: finish S1 tuning (human gate), then S2 (networked flight).** Roadmap S1–S7 in `.claude/backlog.md`.
- **Batch related file changes** into one review turn.
