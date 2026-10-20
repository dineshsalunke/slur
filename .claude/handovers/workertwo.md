Agent: workertwo · Lane: room rules config, RFC-349 S6 (#411, ADR-035 for #70) · Updated: 2026-10-20

## Goal
Add a per-room Rules override map (B2) on the room. It is merged the same way on both ends and locked at GO.
A dev host writes it in the lobby. ADR-035 is approved and committed. Build it now.

## Done
- 0beaf14e — ADR-035 in `docs/DECISIONS.md`. The owner approved W1, P1, K1, G1 and M1 (2026-10-20).
- 383ef6b5 — Next step 1 (rules/*, feature rules, `rules` slot, index exports). define-sim-feature.ts and
  index.ts released to the supervisor; workerfour has re-taken index.ts.
- e2a5d0ee — Next steps 2 and 3. `RunSim.setRules( id, payload: unknown )`; a bad payload keeps the map.
  A/B bit-equal 6/6 seeds, control diverges 6/6. Bench: scratchpad `ab/bench.mjs` (lost on clear; rebuild from
  the commit body). Not pushed yet.
- AT A SEAM sent: set-rules belongs in workerfour's `RUN_COMMAND_FORMATS`/`HANDLERS` (3503a33d). Format =
  `parseRuleOverrides`; a bad payload must become null, never `{}`. Waiting on who edits run-commands.ts and
  run-room.ts.

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
- none. Both code commits are on local dev, NOT pushed (push needs all three suites, after step 4).

## Held files (cleared by slur-supervisor)
- Mine: docs/DECISIONS.md; `packages/shared/src/rules/*`; `tug-rules.ts`; `seeker-rules.ts`; `tug.feature.ts`;
  `seeker.feature.ts`; `schema.ts`; `run/run-sim.ts`; `run-sim.test.ts`; `apps/server/package.json`; the new
  `apps/server/src/rooms/room-rules.test.ts`; the new `apps/client/app/net/host-rules/*`;
  `dev/tuning-schema.ts`; `routes/test-level/tuned-sim-config.ts`; `conventions/features.md`.
- Released: `define-sim-feature.ts`, shared `index.ts` (workerfour has them back).
- Supervisor CALL (2026-10-20): `run-commands.ts` and `run-room.ts` pass to me only after workerfour pushes
  its run-room messages table (P4). Then I add the `[SET_RULES_MESSAGE]` entry (format = `parseRuleOverrides`
  → `RuleOverrides | null`, null = drop, never `{}`; design approved) and the `SLUR_DEV_RULES=1` gate in RunRoom.
- `net/attach-room-to-world.ts` stays workerone's.
- Not claimed but needed: `dev/tuning-panel/tuning-panel.tsx` (it reads `'Seeker.flyY'` and `'Pickup.grabR'`
  at lines 143–149; the 8 Tug dials are in the schema but NOT in the panel). `tuning-panel.utils.ts` has
  someone else's uncommitted edits. Claim the panel before renaming dial keys.

## Next
1. Client work that needs neither held-back file (supervisor's call):
   - `dev/tuning-schema.ts:118–129`: build the 10 Rules dials from `RULE_SPECS` (key = rule id, e.g.
     `tug.pullS`; value = `DEFAULT_SIM_CONFIG[ spec.key ]`). Check `NumberPath` in `dev/tuning.ts:19` still
     types the keys (the table is `as const`-ish; a spread from a Map loses literal keys — may need a typed
     builder).
   - `tuned-sim-config.ts`: replace the 10 hand getters with getters built from `RULE_SPECS`
     (`Object.defineProperty` per spec, reading `num( spec.id )`).
   - `tuning-panel.tsx`: claim it first; rename the two keys and add a Rules folder from `RULE_SPECS`.
   - `net/host-rules/*`: host in lobby, dev build only → send `SET_RULES_MESSAGE` with dial values that
     differ from the spec default, on entering the lobby as host and on each Rules dial change. Needs room +
     phase + hostId; find a hook point that is not attach-room-to-world.ts, or seam with workerone.
2. After P4: `run-commands.ts` entry, change `RunSim.setRules` to take `RuleOverrides | null` (update the 8
   run-sim tests: bad-payload test then goes through the format), RunRoom gate, `apps/server/package.json`
   dev script `SLUR_DEV_RULES=1`, room-rules.test.ts with two real SDK clients (write via host, check the
   guest decodes `rules.overrides`, check a guest write and a production write are dropped).
3. Client bridge (ADR item 8: resolveRules from `room.state.rules.overrides` into `RunConfig`) lives in
   attach-room-to-world.ts: coordinate with workerone.
4. `conventions/features.md` §7: as-built shape (no `preset`; spec has no `value`). All three suites, push,
   close #411 with the SHA.

## Open questions
- none

## Lessons → memory
- none
