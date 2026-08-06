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

Not scaffolded yet. Target scripts (run client + server + shared-watch together) are specified in
`conventions/monorepo.md` §Scripts. Update this section once `package.json`s exist.

## Working method

- **Design docs are living.** Each carries `OPEN QUESTIONS`; resolve with the team, fold the decision in, delete the question. Don't silently diverge from the docs — update them.
- **Arc phases** (Ideate → Brainstorm → Prep → Align → Implement → Reconcile): use `/arc` skill; phase notes in `.claude/phases/<date>-<topic>.md`. We're currently at **Brainstorm/Prep** (design + research done, no code yet).
- **Batch related file changes** into one review turn.
