---
name: feature-registry-import-cycle
description: A sim feature half that value-imports heavy core modules crashes with a TDZ error on some entry orders
metadata:
  node_type: memory
  type: project
  originSessionId: 577d58ec-4a20-4ffa-b324-3926e925bdda
  modified: 2026-09-29T12:16:20.852Z
---

`SIM_FEATURES` (`packages/shared/src/features/registry.ts`) is read at module-eval time by
`player-fields.ts` (to build `PlayerState`) and `features/sim-hooks.ts` (hook arrays for `step.ts`). If a
feature's sim half value-imports a heavy core module (`combat/combat-step` → `mine` → `sim/step`, or
`run/combat` → `schema`), the graph closes a cycle. Some entry orders then throw
`ReferenceError: Cannot access 'SIM_FEATURES' before initialization`, while `dist/index.js` still loads by
luck of order (measured 2026-09-29, F2 #390).

**Why:** ESM evaluates a cycle depth-first; the registry is still in TDZ when the core module reads it.

**How to apply:** A sim half value-imports leaf modules only (constants, sim-config, space, seeker,
ship-classes). Engine services come through `RunContext` (e.g. `shieldAbsorbs`), and the engine does
generic work itself (`run.use` returns fired → engine calls `spendPower`). Check with a loop that
`import()`s each dist entry in its own `node` process. Type side: annotate the feature
(`SimFeature< typeof FIELDS >`) or TS reports a circular type through `PLAYER_FIELDS` → `SimShip`.
Related: [[schema-fields-cap-at-64]], [[deprecated-breaks-reflection-decoding]].
