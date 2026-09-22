# The leva reversal, and the lighting-scoped knob set

**Date:** 2026-09-22 · **Issue:** #200 · **Branch:** `feat/leva-panel`, stacked on `art/clear-tunables`.

## The reversal

[[2026-09-22-tuning-panel-and-punch]] recorded a CLAUDE.md #13 weighing that rejected leva:

> **leva** | The r3f-community default. New dependency past the catalog + `minimumReleaseAge` gate,
> pulls zustand, and its React-state model re-renders subscribers. Would still need custom wiring for
> the texture rebuild.

That table is not edited here — it was a real decision, made with the information available that
session, and silently rewriting it would desync anyone who read it before today. This note records
the reversal instead: **the owner decided today, 2026-09-22, to install leva** as the panel's engine,
after [[2026-09-22-lighting-strip]] deleted the hand-rolled one entirely (commit 3fd4a97, "art: delete
the tunables system and inline its defaults as constants") ahead of the HDRI lighting rebuild in
#196.

### Which objections held up, now that leva is actually installed (0.10.1)

- **"Pulls zustand."** True, and it still does — `leva`'s runtime deps include zustand, plus
  `@stitches/react`, `@radix-ui/react-portal`, `@radix-ui/react-tooltip`, `react-colorful`,
  `@use-gesture/react`, `react-dropzone`, `colord`, `dequal`, `merge-value`, `v8n`. This is the one
  objection that is simply a fact about the package, not a risk that evaporates on inspection.
- **"Past the catalog + `minimumReleaseAge` gate."** Overstated. leva 0.10.1 was published
  2025-10-31 — old enough that `pnpm install` succeeded with no `minimumReleaseAgeExclude` entry
  needed. Verified, not assumed: `pnpm install` ran clean against the catalog addition.
- **"Its React-state model re-renders subscribers."** Overstated as a blocker, not as a fact. leva's
  default `useControls` return value does re-render the calling component on every drag (verified by
  reading `useControls`'s compiled source, `dist/leva.cjs.dev.js`: a schema key gets pushed onto
  `renderPaths` — and thus subscribed via `useValuesForPath` — whenever `!transient`, and `transient`
  defaults to falsy even when `onChange` is present). But leva ships the fix for exactly this:
  `transient: true` on a control excludes its path from `renderPaths` entirely, and
  `useValuesForPath`'s zustand selector then returns a shallow-equal `{}` every drag, so the
  panel-declaring component never re-renders. Confirmed at the type level too —
  `SchemaToValues<Schema, IncludeTransient>` in `types/public.d.ts` erases a transient control from
  the hook's return type unless the caller opts in. This session used every control as
  `{ onChange, transient: true }` and never reads the hook's return value at all; the module-level
  store in `dev/tuning.ts` is the actual read surface for game code, which was always going to be
  necessary for the DOM-import isolation described below.
- **"Would still need custom wiring for the texture rebuild."** True, and expected — leva doesn't
  know about `track-texture.ts`'s module-level canvas cache. `dev/tuning-rebuild.ts` is the same
  `rebuildToken`/`subscribeRebuild`/`useRebuildToken` shape the hand-rolled panel used, now driven by
  leva's `onChange` instead of a `<input>` handler. No smaller than before; not larger either.

### The bug class that isn't inherited

[[2026-09-22-tuning-panel-and-punch]] also describes the Chrome-form-restore bug: on reload, Chrome
restored stale `<input type="range">`/`<select>` values and fired `change` events into them before
hydration settled, and the old store persisted those bogus values to `localStorage`. This design does
not carry that risk forward, for a reason simpler than a `fromUser` guard: **there is no persistence
layer.** `dev/tuning.ts`'s module-level `numbers`/`colors` records always start from
`NUMBER_TUNABLES`/`COLOR_TUNABLES` in `dev/tuning-schema.ts` on every page load — the same constants
this branch's parent commit (3fd4a97) inlined into source. A reload always lands on the committed
defaults; nothing in this design reads `localStorage` at all, so there is no persisted store for a
restored DOM value to corrupt. If cross-reload persistence is wanted later, it is a deliberate
follow-up, not a default — and it would need to re-examine this bug class from scratch.

## The mechanism decision (CLAUDE.md #13)

Same two problems as before: reach game state from a leva control with zero per-frame React
re-renders, and force a canvas-texture rebuild when a texture-feeding value changes.

| Candidate | Weighed |
|---|---|
| **`useControls`'s returned values, read directly in scene components** | The obvious leva idiom. Re-renders every component that reads the returned object on every drag (CLAUDE.md #4's exact objection) — no different from the danger the original weighing table named, and it would put leva imports and re-render risk into `game/scene/*` files. |
| **`useControls` + a `get(path)` closure from the hook's own return tuple** | leva returns a `get` accessor from `useControls`, but it is only valid inside the component that called the hook — doesn't help `track-floor.tsx`/`track-rail.tsx`/etc. reading materials in their own `useFrame`s without each mounting a leva hook of their own. |
| **`store.get(path)` on the exported `levaStore` singleton, read directly in scene code** | Works with zero subscription (`Store.get` is a plain synchronous read, verified in `dist/declarations/src/types/internal.d.ts`) — but importing anything from `'leva'`, including just the store, in a file the production bundle always loads (`track-texture.ts`, `track-materials.ts`, every `track-*.tsx`) pulls leva's whole dependency graph into the shipped bundle. Verified by trying it first and grepping the built output for the leaked package names before discarding this option. |
| **A parallel module-singleton store (`dev/tuning.ts`), written by leva's `onChange`, read by plain functions** ✅ | `dev/tuning.ts` holds `numbers`/`colors` records seeded from `dev/tuning-schema.ts`'s defaults, exactly mirroring the deleted `dev/tunables.ts`'s shape (CLAUDE.md #8: a module singleton, not tied to any component). `num()`/`col()` are plain function calls — legal inside `useFrame` with no subscription. Only `dev/tuning-panel.tsx` (DEV-only, dynamically imported) imports `'leva'`; every consumer in `game/scene`/`game/camera` imports only `dev/tuning.ts`, which has zero leva dependency. This is what keeps leva's dependency graph out of the always-loaded bundle. |
| **URL search params + a RR8 loader** | Still one reload per tweak, as the original table found. Not reconsidered — nothing about installing leva changes this trade-off. |
| **`window.__slur` console handle only** | Same problem the original table found: no UI, and unreliable module-instance probing through devtools. Not reconsidered. |

Chosen: the parallel-store pattern, with leva purely as the DOM control surface writing into it via
`onChange`. This is more indirection than "just call `useControls` and use its values," but it is the
only option verified to keep leva's dependency graph — zustand, stitches, the radix packages,
react-colorful — out of the bundle every player loads.

## The DEV-only bundle boundary

`routes/test-level/test-level-canvas.tsx` gates the panel with
`import.meta.env.DEV ? lazy( () => import( '../../dev/tuning-panel' ) ) : null`, rendered through
`<Suspense fallback={null}>` as a sibling of `<Canvas>` — outside it, same as the deleted panel.

This needed checking, not assuming: a **static** top-level `import { TuningPanel } from …` (what the
old hand-rolled panel used, harmless there because it had zero external dependencies) would still put
`'leva'` in the module graph Rollup analyzes, and whether it survives into the shipped bundle depends
on tree-shaking correctly proving the import is unreachable. `import.meta.env.DEV` is inlined to the
literal `false` at build time, and Rollup's dead-code elimination discards the whole
`false ? lazy(...) : null` branch — including the `import()` call — before chunk generation, so no
separate chunk is even emitted for it.

**Verified against the actual build, not assumed:** `pnpm build`, then
`grep -rl "leva\|zustand\|stitches\|react-colorful\|@use-gesture\|@radix-ui" apps/client/build/client/assets/*.js`.
Two false positives turned up and were checked by hand — `leva` as a substring of `starElevationDeg`
in `systems-*.js`, and `zustand` inside `@react-three/drei`'s own bundled `package.json`
peerDependencies string in `ship-visuals-*.js` (drei lists zustand as an optional peer; the string is
metadata, not an import). Neither is our code. No file in the built output contains `LevaPanel`,
`useControls`, `leva__root`, or any of leva's real runtime deps as an actual reference.

## The knob set

Scope is the lighting rebuild (#196), not a full reinstatement of the ~40 knobs the old panel had.
Four leva folders, each a `plain useControls('FolderName', schema)` call in `dev/tuning-panel.tsx`:

- **Deck** — metalness, roughness, envMapIntensity, normalScale, plate size + color (rebuild), seam
  emissive.
- **Rail** — the same five material knobs, plus rail-strip emissive and gap-rim emissive.
- **Monolith** — metalness, roughness, envMapIntensity, plate size + color (rebuild), seam emissive.
- **Groove** — the shared texture-authoring params all three plates draw from: width, wall tilt,
  bevel share, metalness, roughness, darkening, cavity mask. All seven are `rebuild: true` — they feed
  the canvas texture, not just a material uniform.

### Left out, and why

- **Camera** (`cam.back`, `cam.fov`, …). Framing and feel, not surface response to light. Nothing
  about the HDRI rebuild touches the camera rig.
- **Blocks** (`block.bevel`, `block.seamWidth`, `block.seam`, `block.wear`, `block.roughness`).
  Procedural-block cosmetic detail, a separate concern from how deck/rail/monolith plates read under
  new light. Re-add against the same `NUMBER_TUNABLES`/`dev/tuning-panel.tsx` pattern if the rebuild
  needs to see them.
- **Level** (`level.blockDensity`, `level.gapChance`). Track generation, unrelated to lighting;
  `test-level-canvas.tsx` keeps these as the plain constants 3fd4a97 already inlined.
- **Render** (`perf.dpr`). Stays `TARGET_DPR` in `dev/render-scale.tsx`, untouched by this branch —
  a perf dial, not a lighting one.

If the rebuild turns out to need any of these, they follow the same shape: an entry in
`dev/tuning-schema.ts`, a control in the matching `useControls` folder in `dev/tuning-panel.tsx`, and
a `num()`/`col()` read at the consuming call site.

## Verified this session

- `pnpm install` succeeded with leva `^0.10.1` added to the pnpm catalog and referenced as `catalog:`
  from `apps/client/package.json` — no `minimumReleaseAgeExclude` entry needed.
- `pnpm typecheck`, `pnpm test` (95 shared, 4 server, 141 client), and `pnpm lint` are all clean.
- `pnpm build` succeeds; the grep above confirms leva's dependency graph is absent from
  `apps/client/build/client/assets/*.js`.
- The transient-control mechanism was verified by reading leva 0.10.1's compiled source
  (`dist/leva.cjs.dev.js`) and declaration files directly, per CLAUDE.md #12 — not recalled from
  training-data leva idiom.

## Still open

- **No live `/test-level` playtest this session.** The browser automation tool needed for it was not
  connected in this environment. `pnpm dev` (via `PORT=2568 pnpm dev` in this worktree, matching
  `apps/client/.env`'s `VITE_SERVER_PORT=2568`) starts clean and the route renders in principle, but
  nobody has dragged a slider and watched a pixel move yet. Per CONTRIBUTING §4, this is a
  rendering/feel surface gated by human playtest — do that before trusting the knob set blind.
- **`.claude/phases/INDEX.md` is not present on this branch.** [[2026-09-22-lighting-strip]] notes it
  landed on `dev` in PR #197 after `art/clear-lighting-stack` (and therefore this branch, cut from
  `art/clear-tunables` off it) was already forked. No index row was added here; add one when this
  branch rebases past #197 or merges into a tree that has it.
- **Blocks/Level/Camera knobs are not reinstated.** See "Left out, and why" above — deliberate scope,
  not an oversight, but flag it if the lighting rebuild turns out to need them.
- **`ART_MATERIALS.md` §7** still owes the decisions-and-departures entries
  [[2026-09-22-tuning-panel-and-punch]] flagged as outstanding before this branch existed. Unrelated to
  leva; not touched here.

## Related

- [[2026-09-22-tuning-panel-and-punch]] — the original ≥5-option weighing that rejected leva, and the
  Chrome-form-restore bug this design does not inherit.
- [[2026-09-22-lighting-strip]] — the lighting-stack clearing and the follow-on decision to delete the
  tunables system entirely, which this branch's parent commit (3fd4a97) carried out.
