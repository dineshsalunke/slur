Agent: workertwo · Lane: room rules config, RFC-349 S6 (#411, ADR-035 for #70) · Updated: 2026-10-20

## Goal
Add a per-room Rules override map (B2) on the room. It is merged the same way on both ends and locked at GO.
A dev host writes it in the lobby. ADR-035 is approved and committed. Build it now.

## Done
- 0beaf14e — ADR-035 in `docs/DECISIONS.md`. The owner approved W1, P1, K1, G1 and M1 (2026-10-20).

## State
- No code written yet. The conventions cards are loaded (general and typescript; there is no `@colyseus/schema` card).
- `RunSim` takes its config once in the constructor (`run/run-sim.ts:78`). `RunRoom` passes none.
  `world.config` and `featureCtx.config` capture the same object.
- `fixedStep` steps only countdown and racing (verified), so the lobby reads no config.
- `RunState` has 14 fields; `rules` will be the 15th, after `raceCap`.
- Dial ranges (`apps/client/app/dev/tuning-schema.ts:118–129`): Seeker.flyY 0.5–7 step 0.1;
  Pickup.grabR 0–10 step 0.1; Tug.throwMinS and throwMaxS 0–1.5 step 0.01; Tug.pullS (tugS) and towS
  0.2–5 step 0.05; Tug.range 20–400 step 5; blockMin 0–800 step 5; blockMax 20–1000 step 5;
  latchSlack 1–3 step 0.05.
- Message names are camel strings (`START_MESSAGE = 'start'` in `race/director.ts:7`).
- Shared tests use `node:test` plus `assert/strict` (see `features/registry.test.ts`).
- Memory `colyseus-validate-kicks-on-issues.md`: a `messages` table validator must never return issues.
  Normalise a bad set-rules payload to a no-op value, and let the handler ignore it.

## Build design (from the ADR; not reviewed by anyone yet)
- `rules/define-rules.ts`: `RuleSpec { key, min, max, step }`, where `key` is a numeric `SimConfig` key.
  `defineRules( ns, specs )` returns `RuleEntry[]` with `id = 'ns.rule'`. **Departure from ADR item 2:** no
  `value` in the spec. The default is `DEFAULT_SIM_CONFIG[ key ]`, so there is one source. Say so in the
  commit body and in features.md.
- `rules/core-rules.ts`: `pickup.grabR`. `features/tug/tug-rules.ts`: 8 keys. `features/seeker/seeker-rules.ts`:
  `flyY`.
- `rules/resolve-rules.ts`: `RULE_SPECS` (a Map from core rules plus `SIM_FEATURES.flatMap( f => f.rules )`;
  it throws on a duplicate id or key). Also `resolveRules( iterable )`, which returns `{ ...DEFAULT_SIM_CONFIG }`
  with the overrides applied, and `parseRuleOverrides( unknown )`, which returns a Map of
  `fround( clamp )` values, or `null` when the payload is bad.
- `rules/rules-schema.ts`: `RulesState { @type( { map: 'float32' } ) overrides }` and
  `SET_RULES_MESSAGE = 'setRules'`.
- `define-sim-feature.ts`: a `rules?: readonly RuleEntry[]` slot on the spec and on the feature.
- `RunSim`: `this.config = options.config ?? { ...DEFAULT_SIM_CONFIG }`. At `startRace`, when there is no
  `options.config`, run `Object.assign( this.config, resolveRules( state.rules.overrides ) )`. It mutates in
  place, so the world and the context see it. `/test-level` passes live getters, so skip the assign there.
  `setRules( sessionId, map )` applies only for the host in the lobby: clear the map, then set it.

## Uncommitted
- none

## Held files (cleared by slur-supervisor)
- docs/DECISIONS.md; every new `packages/shared/src/rules/*` file and test; `features/tug/tug-rules.ts`;
  `features/seeker/seeker-rules.ts`; `tug.feature.ts`; `seeker.feature.ts`; `schema.ts`; `run/run-sim.ts`;
  `run-sim.test.ts`; `apps/server/package.json`; the new `apps/server/src/rooms/room-rules.test.ts`; the new
  `apps/client/app/net/host-rules/*`; `dev/tuning-schema.ts`; `routes/test-level/tuned-sim-config.ts`;
  `conventions/features.md`.
- `features/define-sim-feature.ts` and `packages/shared/src/index.ts`, unedited. workerfour re-claims them
  after me, so tell slur-supervisor when they land.
- Not yet: `run-room.ts` (after workerfour's messages-table step) and `net/attach-room-to-world.ts`
  (workerone holds it for S4).

## Next
1. Write `rules/*`, the two feature rules files, the `rules` slot and the index exports, plus
   `resolve-rules.test.ts`. Run the shared suite. Commit, then tell the supervisor that
   define-sim-feature.ts and index.ts have landed.
2. `schema.ts` (`rules` field) and `run-sim.ts` (build at GO, `setRules`), plus tests.
3. Bit-equality A/B (6 seeds × 3600 ticks, with a negative control).
4. Then `apps/server/package.json`, `run-room.ts`, room-rules.test.ts (two SDK clients), the client
   files, and features.md. Run all three suites, push, then close #411 with the SHA.

## Open questions
- none

## Lessons → memory
- none
