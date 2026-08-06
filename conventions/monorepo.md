# pnpm Monorepo Conventions

> Source: https://pnpm.io/workspaces, https://pnpm.io/pnpm-workspace_yaml, https://pnpm.io/catalogs,
> https://turborepo.dev/docs/core-concepts/internal-packages,
> https://www.typescriptlang.org/docs/handbook/project-references.html,
> https://docs.colyseus.io/getting-started/typescript, https://github.com/colyseus/schema
> Versions verified 2026-08-06: pnpm **11.20.0** (stable; v12 in beta), TypeScript **7.0.2** (native compiler),
> Vite **8.2.0**, @colyseus/schema **4.0.30**, colyseus **0.17.10**, colyseus.js **0.16.22**,
> react **19.2.8**, react-router **8.3.0**, @react-three/fiber **9.7.0**, three **0.185.1**.

---

> **As-built reconciliation (2026-08-06).** The scaffold follows this doc's core decisions (3 packages, compiled
> `shared`, catalog pins, project references, no Turborepo) with these deviations — **treat these as authoritative
> over the illustrative excerpts below**:
> - **Package scope is `@slur/*`** (examples below say `@game/*`).
> - **Lint/format = Biome + ls-lint**, not ESLint. No `eslint.config.js`; root scripts are `biome check .` / `ls-lint`.
> - **Client = React Router 8 _framework mode_ SPA** (`@react-router/dev`, `react-router dev/build`), not the plain-Vite client in the excerpt.
> - **0.17 client SDK is `@colyseus/sdk`** (deferred), NOT `colyseus.js` — the version line above and client excerpt below are wrong on this; `colyseus.js` is frozen at 0.16.
> - **Server transport:** `@colyseus/core` + `@colyseus/ws-transport` + `express` (ws-transport's optional peer), not the `colyseus` meta-package — pnpm blocks its git-based uWebSockets subdep.
> - **pnpm gates:** `allowBuilds: [esbuild, msgpackr-extract]`; `packageManager` = installed `pnpm@11.12.0`.

## TL;DR — the rules that matter most

1. **Two apps, one shared package. Start there.** `apps/client`, `apps/server`, `packages/shared`. Do **not**
   pre-create `game-core` or `config` — add them only when duplication actually hurts (see Layout for the test).
2. **`packages/shared` is COMPILED (tsc → `dist`), not raw-source consumed.** This is the one deliberate exception to
   the modern "just import TS" fashion, and the reason is concrete: the shared package holds `@colyseus/schema`
   classes that depend on **legacy `experimentalDecorators` + `useDefineForClassFields: false`**. Compiling once with
   `tsc` guarantees identical decorator semantics for *both* consumers; JIT-source consumption forces you to make
   Vite's esbuild transform AND the server's runtime agree on decorator config, which is a live footgun (Gotchas §2).
3. **`workspace:*` for every internal dependency.** Never a version range, never a relative path.
4. **`catalog:` for every third-party dep shared by more than one package** — especially `react`, `react-dom`,
   `three`, `@colyseus/schema`. Two copies of React or of the schema type-registry is a runtime failure, not a
   style nit (Gotchas §1, §3).
5. **Resolution via `package.json` `exports`, not `tsconfig` `paths`.** `moduleResolution: "bundler"` (client) /
   `"nodenext"` (server). Paths aliases create a second, divergent resolution graph — skip them.
6. **`"private": true` on every app and internal package.** No changesets, no publish pipeline — you are not
   shipping to npm.
7. **The dependency graph is a DAG that points at `shared`.** `shared` imports nothing from `apps/*`. Ever.
8. **Turborepo is overkill at this size.** `pnpm -r --parallel` + tsc watch is enough. Revisit only when CI build
   time or remote caching actually justifies it.

---

## Recommended Layout (concrete apps/ + packages/ tree for this project)

```
slur/
├── pnpm-workspace.yaml
├── package.json                # root: private, scripts only, no runtime deps
├── pnpm-lock.yaml              # single shared lockfile (sharedWorkspaceLockfile default)
├── tsconfig.base.json          # compilerOptions everyone extends
├── tsconfig.json               # solution file: references the three projects, empty files[]
├── eslint.config.js            # single flat config at root
├── apps/
│   ├── client/                 # Vite + React 19 + React Router 8 + R3F 9
│   │   ├── package.json        # deps: @game/shared (workspace:*), react, colyseus.js…
│   │   ├── tsconfig.json       # extends base; references ../../packages/shared
│   │   ├── vite.config.ts
│   │   └── src/
│   └── server/                 # Colyseus 0.17 game server (Node, ESM)
│       ├── package.json        # deps: @game/shared (workspace:*), colyseus, @colyseus/schema
│       ├── tsconfig.json       # extends base; references ../../packages/shared
│       └── src/
└── packages/
    └── shared/                 # @game/shared — the ONE shared package
        ├── package.json        # "type":"module", exports → dist, deps: @colyseus/schema
        ├── tsconfig.json        # composite:true, outDir dist, experimentalDecorators
        └── src/
            ├── schema/          # @colyseus/schema state classes (MyState, Player…)
            ├── constants.ts     # tick rate, room names, map dims, enums
            └── index.ts         # public surface
```

### Boundary justifications (and where I push back on splitting)

- **`apps/client` + `apps/server`** — non-negotiable split: two different runtimes (browser bundle vs Node process),
  two different bundlers, two different `moduleResolution` modes. They are deployables, so they are apps.
- **`packages/shared`** — earns its existence immediately. The schema classes are the *encoder/decoder contract*:
  server and client MUST compile byte-identical `@type()` field order or decoding corrupts. One source of truth is
  the whole point of the monorepo. Constants (tick rate, room names, message opcodes) and shared enums/types ride
  along here because they share the same consumers and the same "change once, both sides see it" requirement.
- **`packages/game-core` (ECS/systems) — DO NOT create yet.** Only justified if the *client* runs the same
  simulation as the server (client-side prediction / rollback). If your server is authoritative and the client only
  renders received state (the common Colyseus pattern), systems live in `apps/server/src` and there is nothing to
  share. Creating `game-core` speculatively buys you a build edge, a dependency hop, and a naming decision for zero
  present value. **Test to promote it:** you have copy-pasted a system file between client and server twice. Until
  then, keep sim code in whichever app owns it.
- **`packages/config` (tsconfig/eslint presets) — DO NOT create yet.** At two apps + one package, a root
  `tsconfig.base.json` plus a root `eslint.config.js` is *less* indirection than a package, and flat ESLint config
  already composes by import. A `config` package pays off at ~4+ consumers or when you need versioned, publishable
  presets. You have neither. **Test to promote it:** a third app appears, or you want to `extends` a preset by
  package name rather than relative path.

Net: **three projects to start.** Two of the four packages the brief floated are speculative; resist them.

---

## Sharing Code (Colyseus Schema across client+server, TS config strategy)

### The consumption decision: COMPILED, not Just-in-Time

Turborepo documents three internal-package strategies: **Just-in-Time** (export raw `.ts`, consumer's bundler
transpiles), **Compiled** (`tsc → dist`, ship JS + `.d.ts`), **Publishable** (full npm hardening). JIT is the
fashionable default for React component libs and it is genuinely nice — but it is the **wrong** default *here*:

- JIT means Vite's esbuild transpiles the shared `.ts` *and* the server's runtime (tsx) transpiles it — **two
  transpilers that must agree on decorator semantics**. `@colyseus/schema@4` still uses **legacy decorators**, which
  require `experimentalDecorators: true` and `useDefineForClassFields: false`. esbuild honours these only from the
  *app's* tsconfig, and Vite does not apply your app tsconfig's transform options to symlinked workspace source by
  default. One mismatch and `@type()` silently stops defining accessors → fields don't serialize → wire corruption
  that looks like a game bug, not a build bug.
- **Compiled** collapses this to one transpiler. `tsc` in `packages/shared` fully honours the decorator flags, emits
  correct JS + `.d.ts` once, and both apps consume the *same* built artifact. Decorator config now lives in exactly
  one tsconfig. This is worth the `tsc --watch` you add to the dev loop.

So: **`packages/shared` compiles with `tsc` to `dist/` (ESM only), ships `.d.ts`, and both apps import the built
output.** `packages/config` (if it ever exists) can be JIT — it has no decorators and no runtime.

### ESM-only shared package

Ship **ESM only** (`"type": "module"`, `exports` → `.mjs`/`.js` + `.d.ts`). Do **not** dual-publish CJS+ESM: a
dual internal package invites the dual-package hazard (Gotchas §3) for zero benefit — you control both consumers and
both can be ESM (Vite is ESM-native; Node 20+/Colyseus 0.17 runs ESM fine). `@colyseus/schema@4` itself is dual
(`exports.import`/`exports.require`), which is fine as a *leaf* dep as long as each process resolves one condition.

### TS config strategy: project references for build, `exports` for resolution

Two orthogonal questions people conflate:

1. **How does TS *resolve* a cross-package import?** Via the package's `package.json` `exports` +
   `moduleResolution: "bundler"` / `"nodenext"`. **Not** via `tsconfig` `paths`. Paths aliases duplicate the
   resolution graph, drift from what the bundler/node actually does at runtime, and break when a fourth package
   arrives. Skip them.
2. **How does TS *build* in the right order and stay incremental?** Via **project references** (`composite: true`
   on `shared`, `references: [{ path: "../../packages/shared" }]` on each app, a root solution `tsconfig.json`).
   `tsc -b` then builds `shared` before the apps, caches with `.tsbuildinfo`, and only rebuilds what changed.
   `declarationMap: true` gives cross-package "Go to Definition" into `.ts` source instead of `.d.ts`.

This split — references for build orchestration, `exports` for resolution — is the idiomatic 2026 setup and keeps
runtime resolution and type resolution telling the same story.

---

## Idiomatic Patterns (config snippets)

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'

# One version of each shared third-party dep, defined once.
# Pin to versions you have chosen — these are the current-latest as of 2026-08-06.
catalog:
  '@colyseus/schema': ^4.0.30
  react: ^19.2.8
  react-dom: ^19.2.8
  three: ^0.185.1
  typescript: ^7.0.2
```

### Root `package.json`

```json
{
  "name": "slur",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.20.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "build": "tsc -b && pnpm -r run build",
    "typecheck": "tsc -b",
    "lint": "eslint ."
  }
}
```

### `packages/shared/package.json` (compiled, ESM-only)

```json
{
  "name": "@game/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -b",
    "dev": "tsc -b --watch --preserveWatchOutput"
  },
  "dependencies": {
    "@colyseus/schema": "catalog:"
  },
  "devDependencies": {
    "typescript": "catalog:"
  }
}
```

### `apps/client/package.json` (excerpt)

```json
{
  "name": "@game/client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "typecheck": "tsc -b"
  },
  "dependencies": {
    "@game/shared": "workspace:*",
    "colyseus.js": "^0.16.22",
    "react": "catalog:",
    "react-dom": "catalog:",
    "react-router": "^8.3.0",
    "@react-three/fiber": "^9.7.0",
    "three": "catalog:"
  }
}
```

### `apps/server/package.json` (excerpt)

```json
{
  "name": "@game/server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -b",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@game/shared": "workspace:*",
    "colyseus": "^0.17.10",
    "@colyseus/schema": "catalog:"
  },
  "devDependencies": { "tsx": "^4.23.9" }
}
```

### `tsconfig.base.json` (root — everyone extends)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "verbatimModuleSyntax": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "declaration": true,
    "declarationMap": true
  }
}
```

> `experimentalDecorators` + `useDefineForClassFields: false` live in the **base** so no consumer of the schema
> classes can forget them. The server tsconfig overrides `moduleResolution` to `"nodenext"`.

### `packages/shared/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

### `apps/client/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "noEmit": true, "jsx": "react-jsx", "lib": ["ES2022", "DOM", "DOM.Iterable"] },
  "references": [{ "path": "../../packages/shared" }],
  "include": ["src"]
}
```

### Root solution `tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./apps/client" },
    { "path": "./apps/server" }
  ]
}
```

### `apps/client/vite.config.ts` — the one thing you must add for the shared package

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Consume @game/shared as a live workspace dep, not a pre-bundled dep:
  // Vite pre-bundles node_modules deps once and won't HMR them. Excluding the
  // workspace package makes Vite watch its dist and HMR on tsc rebuilds.
  optimizeDeps: { exclude: ['@game/shared'] },
})
```

---

## Scripts & Dev Workflow (running client + server together)

**Dev = three watchers in parallel:** `shared` (tsc --watch → dist), `server` (tsx watch), `client` (vite).

```
pnpm dev   →   pnpm -r --parallel run dev
```

- `packages/shared` runs `tsc -b --watch --preserveWatchOutput` → re-emits `dist` on any schema/constant change.
- `apps/server` runs `tsx watch src/index.ts` → picks up new `@game/shared/dist` on save, restarts.
- `apps/client` runs `vite` → with `optimizeDeps.exclude`, HMRs when `dist` changes.

`pnpm -r --parallel` is enough; you do not need `concurrently` (it duplicates what `-r --parallel` does) and you do
not need Turborepo. **Filtering** when you want one target:

```
pnpm --filter @game/client dev          # client only
pnpm --filter @game/server... build     # server + everything it depends on (note the trailing ...)
pnpm --filter './apps/*' run build      # by path glob
```

**Ordered build for CI/prod:** `tsc -b` (references guarantee `shared` compiles first), then `pnpm -r run build`
(Vite build for client, tsc for server). `pnpm -r` already runs in **topological order** by workspace dependency,
so `shared` builds before the apps without extra config.

**Is Turborepo worth it here?** No, not yet. Its wins are (a) task-graph parallelism you already get from
`pnpm -r`, (b) local + remote build caching. At three projects with sub-second incremental tsc, the cache rarely
hits and the `turbo.json` + mental model is pure overhead. **Adopt Turbo when:** CI cold builds get slow, you want
remote cache sharing across a team/CI, or the project count grows past ~5–6. It layers on cleanly later — this
layout doesn't fight it.

---

## Best Practices

- **Every package declares every dependency it imports.** If `shared` imports `@colyseus/schema`, it is in
  `shared`'s `dependencies` — never relied upon via hoisting from an app. pnpm's strict symlinked `node_modules`
  enforces this; lean into it rather than fighting it.
- **`catalog:` for anything imported in more than one package.** Single source of version truth, upgrade in one
  place, zero merge conflicts across package.json files.
- **`workspace:*` for internal deps.** On the (hypothetical) publish, pnpm rewrites it to a real range; in-repo it
  hard-guarantees the local package is used.
- **`private: true` everywhere internal.** Belt-and-suspenders against accidental `npm publish`.
- **Project references + `tsc -b` for build; `exports` for resolution.** Keep the two graphs consistent.
- **Keep `shared` small and leaf-like.** Schema classes, constants, shared enums/types, pure helpers. No I/O, no
  Node-only or DOM-only APIs — it is imported by both runtimes.
- **Pin Node engine and `packageManager`** at the root so contributors and CI use the same pnpm/Node.
- **One flat `eslint.config.js` at root** until a second consumer of presets genuinely appears.

## Anti-Patterns & Bad Practices (each with WHY)

- **Speculative packages (`game-core`, `config`) before there's duplication.** WHY: every package is a build edge,
  a resolution hop, and a naming/versioning decision. Splitting before the pain is negative-value abstraction; you
  pay maintenance for a boundary that isn't load-bearing yet.
- **`tsconfig` `paths` aliases for cross-package imports.** WHY: creates a second resolution graph that diverges
  from what Vite/Node actually do at runtime; works in the editor, breaks in the bundle. `exports` is the one
  source of resolution truth.
- **JIT-source-consuming the schema package.** WHY: forces two transpilers (esbuild + tsx) to agree on legacy
  decorator config; a silent mismatch turns `@type()` into a no-op and corrupts the wire format. Compile once.
- **Dual-publishing (CJS+ESM) the internal shared package.** WHY: invites the dual-package hazard (two Schema
  registries) for zero benefit when you control both consumers. ESM-only.
- **Declaring runtime deps in the root `package.json`.** WHY: the root is not a deployable; deps there hoist and
  become phantom deps for packages that didn't declare them. Root holds scripts + devtools only.
- **Reaching for Turborepo on day one.** WHY: caching infra with no cache hits and a task graph pnpm already
  gives you — cost without payoff at this scale.
- **`shared` importing from an app.** WHY: inverts the DAG, creates a cycle, and pnpm can no longer guarantee
  topological script/build order (it warns, or fails with `disallowWorkspaceCycles`).

## Gotchas / Footguns (ESM/CJS, phantom deps, etc.)

1. **Two Reacts / two `three` / two schema versions = runtime death.** R3F and React hooks break instantly if the
   client resolves two React copies; `@colyseus/schema` maintains a global type registry that misbehaves with two
   instances. `catalog:` for `react`, `react-dom`, `three`, `@colyseus/schema` makes this structurally impossible.

2. **Legacy decorators + Vite esbuild.** `@colyseus/schema@4` needs `experimentalDecorators: true` and
   `useDefineForClassFields: false`. Put both in `tsconfig.base.json` so no one forgets. This is the primary reason
   `shared` is **compiled** (tsc honours the flags deterministically) rather than JIT-transpiled by esbuild, whose
   application of these flags to symlinked workspace source is unreliable.

3. **Dual-package hazard.** If one consumer loads the ESM copy of a module and another loads the CJS copy, you get
   *two* module instances → `instanceof` fails, schema type registration collides. Mitigation: `shared` is
   ESM-only; keep the server ESM; let `@colyseus/schema` (dual) resolve exactly one condition per process.

4. **Phantom dependencies.** pnpm's non-flat `node_modules` means a package can only import what it declares.
   Migrating from npm/yarn you'll hit "cannot find module" for deps you were silently borrowing via hoisting — fix
   by declaring them, not by loosening pnpm. This strictness is a feature.

5. **Circular workspace deps.** pnpm can't guarantee topological order across cycles (it checks `dependencies`,
   `optionalDependencies`, `devDependencies`). Keep the graph a DAG pointing at `shared`. Turn on
   `disallowWorkspaceCycles: true` in `pnpm-workspace.yaml` to fail fast instead of getting a warning.

6. **Vite pre-bundling swallows workspace HMR.** Vite optimizes (pre-bundles) node_modules deps once; a symlinked
   workspace package gets frozen and won't hot-reload on `dist` changes. Fix: `optimizeDeps.exclude:
   ['@game/shared']` (shown above).

7. **TypeScript 7 native compiler drops the JS compiler API.** `@colyseus/schema` is compatible with TS 5/6/7, but
   **schema-codegen** (generating C#/Haxe/Lua client decoders) needs the old JS compiler API and therefore
   **TS 5.x or 6.x**. If you only share types across a TS client+server you never need codegen — but if you later
   target a non-TS client, keep a TS 5/6 toolchain around just for codegen.

8. **`tsc -b` acts like `noEmitOnError`.** A composite project emits nothing on type error, so a broken `shared`
   silently starves its consumers of fresh `dist`. In watch mode you'll see the error; in CI, `tsc -b` failing is
   the gate — don't `|| true` past it.

9. **Publishing internal packages you never meant to ship.** `workspace:*` deps and `private: true` both prevent
   accidental publish; don't wire up changesets/CI publish for packages that only ever live in-repo. Adds release
   ceremony for nothing.

## References

- pnpm Workspaces — https://pnpm.io/workspaces
- pnpm-workspace.yaml reference — https://pnpm.io/pnpm-workspace_yaml
- pnpm Catalogs — https://pnpm.io/catalogs
- Turborepo, Internal Packages (JIT vs Compiled vs Publishable) — https://turborepo.dev/docs/core-concepts/internal-packages
- TypeScript Project References — https://www.typescriptlang.org/docs/handbook/project-references.html
- Colyseus, sharing schema types with a TS client — https://docs.colyseus.io/getting-started/typescript
- Colyseus Schema (decorators, tsconfig, module format) — https://github.com/colyseus/schema
- @colyseus/schema on npm (v4.0.30, exports map) — https://www.npmjs.com/package/@colyseus/schema
