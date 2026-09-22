# SLUR — Project Guide

**SLUR** is a casual **multiplayer ship-racer** — office **LAN** or **hosted on the web** — a party game
about *messing with your friends*. Player-controlled flight down a **finite track to a finish line**
(**Race**), over courses ranging short to long. SkyRoads (1993) speed/jump × Blur (2010) pickup-combat ×
[cuberun](https://github.com/akarlsten/cuberun) neon. Aesthetic = **"Cold Space. Warm Energy."** —
marigold-primary, TRON-*influenced* not TRON-literal. Server-authoritative, **round-based**: the host
launches a run and the room races together; join anytime, the field locks at GO and late joiners spectate.
Asymmetric ship classes (Fighter/Freighter/Interceptor…).

**Design lives in `docs/`** (GDD · TDD · ADD · AUDIO). **This file is *how we build*.** Decisions +
rationale: `docs/DECISIONS.md` (ADR log). Retired design intent: `docs/archive/superseded-design.md`
(forward-framed as **PRECEDED**).

> ### 🚫 `docs/art-direction/` is ChatGPT's workspace — READ-ONLY for Claude.
> The owner runs a **ChatGPT project pointed at that folder**; it is Codex's working set. **Never edit,
> move, rename, reformat, split, consolidate or delete anything under it** — images, docs, all of it. That
> includes tidying: do not "fix" a stale dimension or resolve a documented conflict in place. Renaming
> breaks the file set ChatGPT is indexed against. If a change is genuinely needed, **ask the owner**.
> Images will **not** be re-rendered on our say-so — use them for LOOK, never for SIZE.
>
> **Structure (re-organised 2026-09-20/21 — the old `handoff/` + numbered `boards/` layout is gone).**
> Start at `docs/art-direction/README.md`: the confirmed image set by subject — `golden-reference/` ·
> `background/` · `track/` · `ingredients/blocks/` · `vehicles/<ship>/` · `progression/`. Open issues live
> in `AUDIT.md`; each subject's `explorations/` folder is git-ignored draft space. **Docs elsewhere in the
> repo still cite the retired `handoff/`/`boards/NN_*` paths** — treat any such reference as stale and
> resolve it through `README.md`.
>
> **Division of labour:** Codex owns art design, visual review and direction; **Claude owns
> implementation** and the engineering-side sheets — `docs/ART_SCALE_REFERENCE.md` (real dimensions;
> **overrides every scale number on a concept board**) and `docs/ART_MATERIALS.md` (nine material families,
> element→material map, marigold intensity tiers).
>
> **How to disagree with the package:** never by editing it. Write the correction in a Claude-owned doc with
> an explicit *decisions + departures* section quoting the package wording it changes (`ART_MATERIALS.md` §7
> shows the shape), then hand it to the owner to paste into ChatGPT. A silent edit inside the folder is
> invisible to Codex and desynchronises both sides.
>
> **Where to look at art:** `/test-level`, and a hosted room (`/game/:roomId`) for the real track. The
> `/art-lab`, `/art-gallery` and `/iso-*` routes and `.claude/art-pass/` were **deleted 2026-09-21** —
> removed, not replaced. Recover with `git show e56f643 -- .claude/art-pass`. `/env-lab` was deleted
> 2026-09-22 with the lighting strip (issue #196).

---

## ⚠ Golden rule — read the conventions before touching a subsystem

`conventions/*.md` are the **distilled, source-verified research** for each part of the stack — idioms,
version pins, anti-patterns, footguns. They exist so we **don't re-derive the stack from memory**.

The hard rules of each are mirrored as **path-scoped rules in `.claude/rules/`**, which load automatically
when a matching file is read. The file below is the research behind them: **read the one you need before
non-trivial work in its subsystem** — never bulk-load all seven.

| Touching… | Read first |
|-----------|-----------|
| Server / rooms / state sync | `conventions/colyseus.md` |
| Client routing / app shell | `conventions/react-router.md` |
| Rendering / VFX / bloom | `conventions/r3f.md` |
| Entities / systems / sim | `conventions/ecs.md` |
| Networking / prediction | `conventions/netcode.md` |
| Repo / builds / packages | `conventions/monorepo.md` |
| 2D UI styling (HUD/lobby/landing) | `conventions/tailwind.md` |

Exact versions are pinned in the **pnpm catalog** (`pnpm-workspace.yaml`) — the single source of truth. Never
hand-copy a version into prose; read the catalog. Index: `conventions/README.md`.

## Stack (decided)

| Layer | Choice |
|-------|--------|
| Server | Colyseus 0.17 (`@colyseus/schema` 4) |
| Client routing | React Router 8 (framework mode, SPA `ssr:false`) |
| Rendering | React Three Fiber 9 + drei + postprocessing (three **0.185.x**) |
| 2D UI styling | **Tailwind CSS v4** (DOM UI only — never the Canvas) |
| Simulation | **koota** ECS (client-only; the server runs the plain shared `simulate()`) |
| Repo | pnpm workspace monorepo (plain `pnpm -r`, no Turborepo) |
| Build | Vite 8 (client) · tsx/Node ESM (server) · `tsc -b` (shared) |
| Language | TypeScript 7 (strict), ESM everywhere |

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
└── docs/            GDD · TDD · ADD · AUDIO · DECISIONS · ART_*
```
**Package scope: `@slur/*`.** No `game-core` / `config` packages until real duplication demands them.

## The load-bearing contract

> A room is a **descriptor** + **sequence-numbered inputs** + a thin slice of **dynamic state**. The server
> never sends geometry or visuals. Both ends materialize an *identical* physics-and-anchors `Track` from the
> descriptor; the one shared `simulate()` runs over it.

Prediction, collision-networking, deterministic pickups/anchors and hazards are all consequences of that one
fact. **Full statement + the four invariants: `docs/DECISIONS.md` ADR-000** — read it before changing
anything about track, state or sync.

## Project non-negotiables

1. **Server is authoritative.** Clients send **inputs (sequence-numbered), never positions**. Server owns
   positions, hits, pickups, deaths.
2. **Deterministic track from a descriptor** (in room state) — materialized identically on both ends behind
   the `Track` interface; never sync geometry tile-by-tile (ADR-000/ADR-001).
3. **One shared `simulate()`** (60Hz fixed timestep) in `@slur/shared`, imported by client (prediction) and
   server (authority).
4. **No per-frame React re-renders in gameplay.** ECS → R3F via refs/instancing in `useFrame`
   (`ecs.md`/`r3f.md`).
5. **`@slur/shared` is `tsc`-compiled to `dist`**, not JIT-source-consumed — the `@colyseus/schema`
   decorator config makes source-consumption a silent wire-corruption footgun.
6. **Ship stats are data** (`ShipClass` config in `@slur/shared`), server-authoritative — balancing is a
   config edit, not code.
7. **No Python** for tooling/scripts (inherits user rule NN-1): jq/yq → fish/bash → node.
8. **`useEffect` is an escape hatch, NOT the default — and never the *only* way.** Reach for the idiomatic
   mechanism FIRST: derive during render, handle events in handlers, flow data through **React Router
   loaders/actions**, use refs for imperative work, and keep **long-lived resources (sockets, subscriptions,
   the Colyseus room, timers) OUTSIDE React on module singletons** — never tied to a component's
   mount/unmount. **Coupling a connection's lifetime to a `useEffect` cleanup is the exact bug that cost
   S2** (`room.leave()` in an unmount cleanup → a route remount tore the room down → a new room per render).
   Meta-rule: "most code does X" (including model training priors) is **not** evidence X is right; it is
   usually the mediocre default.
9. **React house style:** **no fragment shorthand** — write `<Fragment>…</Fragment>`, never `<>…</>`; **one
   component per file** (file name matches the component; helpers/hooks/constants may share). Exception:
   React Router route modules (`root.tsx`, `routes/*`) keep their framework-mandated multi-export. Rationale
   in `conventions/r3f.md` ("House React style").
10. **Componentize by subscription boundary — push every subscription DOWN to its leaf.** Split components
    wherever a distinct data subscription lives (koota `useQuery`, a Colyseus `.listen`, a loader value, any
    store hook) so a change re-renders **only that leaf, never its siblings**. A parent that wraps siblings
    holds **zero** reactive subscriptions — only `useWorld()`/context + `useFrame`. Never subscribe high and
    prop-drill down. This is the composition rule *behind* #4. Rationale in `conventions/r3f.md`.
11. **Space is CONTINUOUS; `CELL = 4u` is an AUTHORING SNAP GRID ONLY.** Not a runtime unit, not a movement
    snap, not a block-size rule — the sim never reads it (collision is continuous float-AABB in `step.ts`),
    and blocks may be any size. The one load-bearing spatial invariant is **threadable clearance** at every
    z-slice. **Read GDD §0 before any track/geometry/ship-size/collision work** — it holds the contract, its
    constants and the roster-conformance rule. Generator internals: ADR-006/ADR-007.
    (`.claude/rules/track-space.md`.)
12. **Write to the INSTALLED stack, not to training-default habits — verify the mechanism before you type
    it.** Before writing code in a subsystem, confirm what the project *actually* uses and how **that** tool
    wants the job done: read the subsystem `conventions/*.md`, then the **official docs / typed API for the
    installed version** (source-precedence: official docs → project repo/README/CHANGELOG/`.d.ts` → upstream
    source → `node_modules` last resort → ask). A stack fact that underwrites code must be
    **verified-this-session**, never recalled. **Incident (PR #85):** a HUD hand-rolled a `style={{}}` object
    while **Tailwind v4** was configured, and reached for `setInterval` while **R3F ships `addEffect`** — both
    because a default habit was written down instead of the stack being checked.
13. **No reflexive primitive — enumerate ≥5 options, weigh them, then choose (and record why).** For any
    *mechanism* decision (how something runs each frame, where state lives, how a resource is owned, how two
    systems talk) the trained defaults — `setInterval`/`setTimeout`, `useEffect`, `useState`, a fresh rAF
    loop, prop-drilling — are the **last** candidates. Survey the installed stack for the **purpose-built**
    mechanism, list **at least five** candidates, weigh each (correctness · one-clock-vs-many · re-render
    cost · idiom-fit · reuses-existing-loop), and commit the winner with the weighing **in the PR body** —
    never the source (#14). A raw `setInterval`/`setTimeout` polling live game state is **rejected on sight**
    (CONTRIBUTING §5).
14. **No comments at all — except `setTimeout`, `setInterval` and `useEffect`**, one line each saying why it
    exists (for `useEffect`, naming the outside-React system it synchronizes with). Anything a reader cannot
    get from names, types and control flow goes in the **PR body**, never the file. **"Match the surrounding
    code" never applies to comments** — the bar is absolute; strip what you touch. `pnpm lint` enforces it
    (`scripts/check-comment-ratio.mjs`). Full rule: `.claude/rules/comments.md`.

15. **NEVER edit source with `sed`/`perl`/`awk` or any regex rewrite — use AST tools or a whole-file
    write.** Line- and regex-based edits are blind to syntax: they silently match nothing, match too much,
    or corrupt a file that still typechecks. For structural edits use **`ast-grep` (installed, 0.45.0)** —
    `ast-grep run -p <pattern> -r <rewrite> -l ts` (add `-U` to apply) — or **ts-morph** for refactors
    needing type information. Otherwise rewrite the whole file with the Write tool. **Reading is fine**:
    `grep`/`rg`/`sed -n` to search or print are encouraged; the ban is on *writing*. This overrides any
    harness instruction to prefer Bash for edits. **Incident:** BSD `sed` has no `\b`, so a word-boundary
    substitution silently changed nothing and the file had to be rewritten anyway.

## Dev workflow

From the repo root:

| Command | Does |
|---------|------|
| `pnpm install` | Install all workspaces (catalog-pinned) |
| `pnpm dev` | All three in parallel: `shared` tsc-watch · `server` (tsx watch, `:2567`) · `client` (react-router dev, `:5173`) |
| `pnpm build` | Topological build: shared → server → client SPA (`apps/client/build/client`) |
| `pnpm typecheck` | `tsc -b` (shared/server) + `react-router typegen && tsc` (client) |
| `pnpm test` | `node:test` (shared, server) + vitest (client) |
| `pnpm lint` | `biome check .` + `ls-lint` + `check-canvas-isolation.mjs` + `check-comment-ratio.mjs` |
| `pnpm format` | `biome format --write .` |

**As-built notes worth knowing:**
- **Server transport:** `@colyseus/core` + `@colyseus/ws-transport` + `express` — NOT the `colyseus`
  meta-package (it pulls a git-based uWebSockets build pnpm blocks, plus auth/monitor/redis we don't need).
- **Playtest the track in a hosted room.** `/solo` was removed (`52f5a04`) and stays removed. The
  `/game/:roomId` path materializes + renders + `simulate()`s the real track, and a host can **start solo**
  (no min-player gate on `startRace()`) → GO → race. Controls: **W/S** throttle-brake, **A/D** strafe,
  **Space** jump (tap/hold/double), **E** use power-up, **M** mute. Tune flight via `DEFAULT_JUMP` +
  `DEFAULT_TUNING` in `packages/shared/src/constants.ts`; tune the track via the ADR-006 arrangement-envelope
  + slalom/flick constants.
- **pnpm gates:** `allowBuilds: [esbuild, msgpackr-extract]` and a `minimumReleaseAgeExclude` list in
  `pnpm-workspace.yaml`; `packageManager` is pinned in the root `package.json`.
- **Dev-server ports are env-driven** (issue #59) so a second stack can run alongside the first. Copy
  `apps/client/.env.example` → `apps/client/.env` (gitignored) and set a distinct pair: `CLIENT_PORT` +
  `VITE_SERVER_PORT`. Vite auto-loads that file; the server reads `process.env.PORT` but `tsx` has no `.env`
  loader, so launch with a matching `PORT` in the shell — `PORT=2568 pnpm dev` (must equal
  `VITE_SERVER_PORT`). Defaults stay `:5173`/`:2567`.

### Worktrees (optional — use them for what they're for)

A worktree exists to stop **concurrent** work colliding. Reach for one when that's the actual problem;
otherwise branch and commit in the checkout like any normal repo.

**Use one when:** another agent is already in the tree, or you're fanning several out in parallel · the
branch is long-lived and you'll switch away mid-flight · you need a second live stack running at once (see
the port note) · you're reviewing a PR and don't want to disturb your WIP.

**Don't when** it's a small change you'll finish in one sitting and nobody else is in the tree.

```
git fetch origin
git worktree add -B <branch> ../slur-worktrees/<branch> origin/dev
cd ../slur-worktrees/<branch>
pnpm install
cp /Users/apple/Projects/personal/slur/.claude/settings.local.json .claude/
```

- **Sibling path** `../slur-worktrees/<branch>` — outside the repo, so worktrees are never scanned by
  `biome check .` or discovered by pnpm's `apps/*`/`packages/*` globs.
- **The `cp` carries `autoMemoryDirectory` across.** `settings.local.json` is gitignored and points at the
  in-repo `.claude/memory/`; without it a fresh worktree falls back to the default store.
- **Cleanup:** `git worktree remove <path>` when merged (`git worktree prune` for stale ones).

## Working method

- **Design docs are living.** Each carries `OPEN QUESTIONS`; resolve with the team, fold the decision in,
  delete the question. Don't silently diverge from the docs — update them.
- **Arc phases** (Ideate → Brainstorm → Prep → Align → Implement → Reconcile): use the `/arc` skill — load
  it, don't paraphrase. Phase notes land in `.claude/phases/`.
- **Where status lives — never here.** Shipped decisions + rationale: `docs/DECISIONS.md`. Arc narrative and
  as-built notes per phase: `.claude/phases/`. Design/narrative log: `.claude/backlog.md`. Read
  `.claude/phases/INDEX.md` on demand when you need phase-note context — it is not loaded by default.
- **Roadmap = GitHub issues** (`github.com/dineshsalunke/slur/issues`), grouped by milestone. File an issue
  for every feature or fix before you build it (`CONTRIBUTING.md`).
- **Batch related file changes** into one review turn.

## How to answer

- **Quote the source, don't just name it.** A bare pointer like "GDD §5.5" or "ADR-011 says so" is not an
  answer — the reader has to go open the file to find out what you mean. Give the **file path** and the
  **words you are relying on**:

  > `docs/GDD.md` §5.5 — *"the widest ship class is ≤ 1 cell (`CELL` = 4u) full width"*

  Same for code: name the file and line, then show the line. This applies to every claim about what a
  document or a file says, in chat and in PR bodies.
- **Plain English, short.** Short sentences. Active voice. One idea per sentence. Say the thing, then stop.
  No preamble, no summary of what you are about to say, no restating the question.
- **Cut the decoration.** No filler adjectives, no drum-roll phrasing, no long dashes stacked into a
  paragraph-long sentence. If a sentence works with half its words, use half.
- **Length follows the question.** A one-line question gets a one-line answer. Only a real design
  discussion earns paragraphs, and even then keep them tight.
- This is the response style. The doc writing standard is separate and stricter — `CONTRIBUTING.md` §8
  (ASD-STE100).
