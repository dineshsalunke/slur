---
paths:
  - "apps/client/app/features/**/*.{ts,tsx}"
  - "apps/client/app/engine/**/*.{ts,tsx}"
  - "packages/shared/src/features/**/*.ts"
  - "packages/shared/src/schema.ts"
  - "packages/shared/src/sim-config.ts"
  - "packages/shared/src/sim/step.ts"
  - "packages/shared/src/run/run-sim.ts"
  - "apps/client/app/dev/tuning-schema.ts"
  - "apps/client/app/net/attach-room-to-world.ts"
---

# Feature modules, rule C, constant tiers (RFC-349)

Full rule: `conventions/features.md`. Owner-approved 2026-09-29.

- **One feature = one folder per end + one registry line per end.** Sim half:
  `packages/shared/src/features/<name>/<name>.feature.ts`. Client half:
  `apps/client/app/features/<name>/<name>.client.ts`. Never edit a central file for one feature.
- **The contract file is the only public surface.** Never import another feature's internal files.
  Modules talk through traits and events.
- **The sim half is deterministic.** No koota, THREE, DOM, `Math.random` or wall-clock time. It never
  imports from `apps/`.
- **Discovery is an explicit registry array per end (D1).** No `import.meta.glob`, no
  self-registration.
- **Order is declared.** A system registers `{ id, phase, before?, after? }` with the scheduler. No
  numeric priority, no import or mount order. Sim hooks tie-break by feature `id`.
- **Schema fields are composed with `schema()`.** Spread order is wire order. Append only; never
  reorder, insert or `@deprecated()`. A test asserts every field index is unchanged and `< 64`.
- **Rules and Track gen are server-owned and lock at GO. Look is client-only. Dev overrides one tier
  above.** A value `simulate()` reads never has a second client copy. A Rules dial goes through the
  B2 `overrides` map. One `defineRules` spec per feature gives defaults, clamp, key check and dial.
- **B2 room config:** `preset` string + sparse `overrides` float32 map keyed `<feature>.<rule>`. The
  server rejects unknown keys, clamps, merges the `Math.fround`-ed value and rejects writes after lobby.
- **Answered:** Q5 (B2 covers combat and world rules only), Q6 (dev dials write B2 overrides in the
  lobby of a dev-mode server only) and Q7 (commands use the `messages` table with hand-written
  StandardSchemaV1 validators, no library; S12).
