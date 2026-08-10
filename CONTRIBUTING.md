<!-- This document follows ASD-STE100 (Simplified Technical English): short sentences, active voice, one
instruction per sentence. See the writing-standard note at the top of CLAUDE.md. -->

# Contributing to SLUR

SLUR is built to a standard. This document states that standard. Read it before you open a pull request.

The core rule: **no slop.** Every change must be understood, specified, reviewed, and tested. A change that
"works" but nobody can explain is not acceptable. Machine-generated code is welcome only when it meets the
same bar as hand-written code — the author is responsible for every line, whatever wrote it.

---

## 1. Read before you write

The repository already holds its own rules. You must read the relevant ones first.

1. **`CLAUDE.md`** — how we build. Start here.
2. **`conventions/*.md`** — the source-verified idioms for each subsystem (Colyseus, React Router, R3F, ECS,
   netcode, monorepo). **Read the one that covers the code you touch.** These are not suggestions. They are
   **acceptance criteria** — a pull request that violates a convention is rejected, even if it compiles and
   the tests pass.
3. **`docs/`** — GDD, TDD, ADD, AUDIO. The design intent. Do not diverge from it silently; update it.

## 2. Every feature needs an RFC / spec

**No feature or non-trivial fix lands without a written spec first.** This is the anti-slop gate.

1. **Open a GitHub issue** for the work. The issue is the RFC.
2. **State the problem before the solution.** What is broken or missing? What does success look like? What
   are the constraints?
3. **Describe the design.** What you will change, where, and why. Name the alternatives you rejected and the
   reason. Name the trade-offs you accept.
4. **List the test plan.** How will you prove it works?
5. **Get agreement before you write the implementation.** For anything that changes shared behaviour, wait
   for a maintainer to approve the design on the issue.

We follow a 6-phase arc: **Ideate → Brainstorm → Prep → Align → Implement → Reconcile** (see `.claude/phases/`
for examples). The RFC covers Ideate through Align. Code belongs to Implement. **Do not write the
implementation during the thinking phases.** Trivial changes (a typo, a one-line fix) may skip the arc.

## 3. Coding standards

- **TypeScript, strict, ESM everywhere.** No `any` escapes without a written reason. No CommonJS.
- **Match the surrounding code.** Copy its naming, its comment density, its idioms. New code must read like
  it was always there.
- **Comment the *why*, not the *what*.** The code says what. The comment says why this way and not the
  obvious other way.
- **Follow the house React style** (`conventions/r3f.md`): `<Fragment>`, never `<>`; one component per file
  (React Router route modules are the only exception).
- **Respect the project non-negotiables** in `CLAUDE.md` — server-authoritative, inputs-not-positions, one
  shared `simulate()`, no per-frame React re-renders in gameplay, `@slur/shared` is compiled not
  source-consumed, ship stats are data.
- **No Python** for tooling or scripts. Use `jq`/`yq`, then `fish`/`bash`, then the ecosystem's native tools.

## 4. Tests are required where possible

- **The shared simulation (`packages/shared`) MUST have tests.** It is deterministic and server-authoritative.
  Every invariant a human playtest cannot cheaply assert belongs in `*.test.ts`. Add a test with the change,
  not after.
- **For other code, add a test when the surface can be tested** (a pure function, a reducer, a data
  transform). Rendering and feel are gated by a human playtest instead — say so in the pull request.
- **A bug fix starts with a failing test** that reproduces the bug, where the code allows it.

## 5. Anti-patterns — not allowed

These are rejected on sight. Each one has already cost this project real time.

- **Coupling a long-lived resource to a React lifecycle.** The Colyseus room, sockets, subscriptions, and
  timers live on module singletons — never in a `useEffect` cleanup. (This bug cost us S2.)
- **`useEffect` as the default.** It is an escape hatch, for synchronizing with systems *outside* React.
  Reach for the idiomatic mechanism first: derive during render, handle events in handlers, flow data through
  React Router loaders/actions, use refs for imperative work. Every `useEffect` needs a justification comment.
- **Per-frame React re-renders in gameplay.** Drive the scene from ECS via refs and instancing in
  `useFrame`. React is never in the movement path.
- **Reading Colyseus state during React render.** It is not React-reactive. Read it through the loader +
  `.listen`, and pass it as props. ("Works after HMR" is the tell that you got this wrong.)
- **Syncing positions instead of inputs.** Clients send sequence-numbered inputs. The server owns positions.
- **Syncing track geometry tile-by-tile.** The track is deterministic from a seed. Sync the seed.
- **Source-consuming `@slur/shared`.** It is `tsc`-compiled to `dist`. The `@colyseus/schema` decorator
  config makes source consumption a silent wire-corruption bug.
- **`Math.random()` / `Date.now()` / `Math.sin` inside the deterministic sim.** They break determinism.
  Use seeded, deterministic math (e.g. a triangle wave for pacing). Client-only cosmetics may use them.
- **Fragment shorthand `<>`** and **more than one component per file** (see house style).

## 6. The verify gate

Before you open a pull request, all of these must pass from the repository root:

```
pnpm typecheck    # tsc across shared/server/client
pnpm lint         # biome + ls-lint
pnpm test         # the shared sim tests + the Colyseus room tests
pnpm build        # topological build, catches bad imports
```

`pnpm test` runs every package that declares a `test` script. Do **not** substitute
`pnpm --filter @slur/shared test` — that skips the server room tests entirely.

Green CI is necessary but **not sufficient** — it does not prove idiom-correctness (see §1). A reviewer still
checks the change against the conventions.

## 7. Commits and pull requests

- **Conventional commits:** `feat(client): …`, `fix(shared): …`, `docs: …`. Scope by package.
- **Do NOT add a `Co-Authored-By` trailer.** The repository's commit hook rejects it.
- **One logical change per pull request.** Batch the files that belong together (entity + schema + test);
  do not mix unrelated changes.
- **Link the issue** (the RFC) the pull request implements.
- **State how you verified it** — the gate output, and the manual playtest if the change has a feel or visual
  surface.

## 8. Writing standard

All contributor-facing documents and technical prose follow **ASD-STE100 (Simplified Technical English)**
where applicable: short sentences, active voice, one instruction per sentence, approved vocabulary, no
needless synonyms. Evocative design pitch and flavour copy keep their voice. When clarity and voice conflict
in technical text, clarity wins.

## 9. Assets

Every third-party asset must be freely licensed (CC0 preferred; CC-BY with attribution). **Record it in
`CREDITS.md`** — and add the required attribution line for any CC-BY asset. No asset lands without its
provenance recorded.
