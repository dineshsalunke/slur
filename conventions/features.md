# Feature Modules, State Placement and Constant Tiers

> Source: `docs/RFC-349-ARCHITECTURE.md` §3, §4.3 B, §4.5, §6. Owner approved Q1–Q4 and Q8 on 2026-09-29
> (RFC `d15076e`). APIs verified 2026-09-29 in the installed packages: **koota 0.6.6**, **`@colyseus/schema`
> 4.0.30**. This file is the rule. The RFC holds the evidence and the rejected options; you do not need it to
> build.

<!-- This document follows ASD-STE100 (Simplified Technical English). See CONTRIBUTING.md §8. -->

## TL;DR — the rules that matter most

1. **One feature = one folder per end + one registry line per end.** It edits no other file.
2. **Two halves.** The *sim half* (`packages/shared/src/features/<name>/`) holds what `simulate()` runs on
   both ends. The *client half* (`apps/client/app/features/<name>/`) holds traits, systems, views, HUD, audio,
   dials and net handlers.
3. **The contract file is the only public surface.** `<name>.feature.ts` (sim) and `<name>.client.ts`
   (client). Never import another feature's internal files.
4. **Order is declared, never implied.** Each system declares `{ id, phase, before?, after? }`. File order,
   import order and mount order decide nothing.
5. **Rule C — one home per kind of state.** A thing in the race is an entity. A state of that thing is a
   tag. Run-wide state is a world trait. A service is a module singleton. **One run reset** clears it all.
6. **Four constant tiers.** Rules and Track gen are server-owned and lock at GO. Look is client-only. Dev
   overrides one tier above. **A value that `simulate()` reads never has a second client copy.**
7. **Schema fields are composed, not decorated.** Spread order is wire order. Append only. At most 64 fields
   per class; `PlayerState` uses 39. Exception (owner, 2026-09-30): an RFC-349 F-stage feature move may
   move that feature's fields into its spread, once per feature, with owner approval, a two-SDK-client
   decode check and the index test updated in the same commit.

## 1. Folder layout

```
packages/shared/src/features/
├── registry.ts                  SIM_FEATURES — one import + one array entry per feature
└── <name>/
    ├── <name>.feature.ts        contract: defineSimFeature({ … })
    └── …                        sim hooks, rules spec, constants (plain .ts)
apps/client/app/features/
├── client-features.ts           CLIENT_FEATURES (+ DEV_FEATURES behind import.meta.env.DEV)
└── <name>/
    ├── <name>.client.ts         contract: defineClientFeature({ … })
    ├── <name>.traits.ts         the feature's own traits
    └── <component>/             NN-9 folders for each view
apps/client/app/engine/          scheduler glue, registry consumers, FeatureViews, bridge, run reset
```

- The world that no feature owns (track, ships, sky, post) stays under `game/scene/`.
- No `index.ts` (NN-9). The contract file has its own name.
- `.feature.ts` and `.client.ts` are new sub-extensions. F1 adds them to `.ls-lint.yml` (memory
  `lint-footguns.md`).

## 2. The two halves

| Half | Home | Runs on | Holds | May import |
|---|---|---|---|---|
| **Sim** | `packages/shared/src/features/<name>/` | server `RunSim` and the client predictor | Rules spec, ship hooks, run hooks, schema fields, message ids, power entry | `@slur/shared` core only |
| **Client** | `apps/client/app/features/<name>/` | client only | traits, systems, R3F views, HUD pieces, audio, dials, net handlers | its own sim half, `engine/`, core traits |

- The sim half is deterministic. It never touches koota, THREE, the DOM, `Math.random` or wall-clock time.
- The sim half never imports from `apps/`.
- The server has no koota. Only the client half holds traits and systems.

## 3. The contract

Shape, not final API. F1 writes the types.

```ts
export const tugFeature = defineSimFeature( {
    id: 'tug',
    power: { kind: HeldPower.tug, bagWeight: TUG_BAG_WEIGHT },
    rules: defineRules( 'tug', TUG_RULE_SPECS ),
    fields: { player: { tugTimer: 'float32', towTimer: 'float32', tugAnchorZ: 'float32' } },
    ship: { thrust: tugThrust, cap: tugCap, tick: tickTugStatus },
    run: { use: throwTug, tick: tickTugThrows, reset: clearTugThrows },
    messages: [ TUG_MESSAGE ],
} );
```

```ts
export const tugClient = defineClientFeature( {
    sim: tugFeature,
    traits: [ TugRope ],
    systems: [ { id: 'tug-rope', phase: 'react', after: [ 'ship-sync' ], run: tugRopeSystem } ],
    views: { scene: TugLine, pickups: TugPickups },
    hud: { glyph: TUG_GLYPH },
    net: { [ TUG_MESSAGE ]: onTugMessage },
    audio: TUG_SFX,
    dials: TUG_DIALS,
} );
```

Every slot is optional. A feature fills only the slots it needs.

**As built (F1 #385, F2 #390, F4a #395, F4b #397).** The sim half has `id`, `power`, `fields.player`, `ship`,
`run` and `messages` (`packages/shared/src/features/define-sim-feature.ts`). The client half has `id`, `sim`,
`systems`, `views.scene`, `views.pickups`, `hud.glyph`, `hud.overlay` and `net`
(`apps/client/app/engine/define-client-feature.ts`). The other slots in the table (`rules`, `traits`,
`audio`, `dials`) come with their first consumer. Do not add a slot that has no engine consumer.

F2 added these slot rules:

- `run.use` returns `true` when the power fired. The engine then spends the charge. It returns `false`
  when there is no target, and the player keeps the charge.
- `power.bagWeight( cfg )` is a function of the config, so a dial can change the weight.
- `RunContext` gives a run hook the engine services it needs, for example `shieldAbsorbs( v, at )`.
- A `net` handler gets `( payload, net )`. `net.sessionId` is the local player.
- Tug plays its SFX from its `net` handler. There is no `audio` slot yet.

F4a (#395, bolt) added these slot rules:

- `run.strike` is a fixed hook point inside `stepCombat`. It runs after the shield step and before mines,
  portals and pickups. Use it when a run hook must act before those, as bolt does: a bolt clears a
  mine and breaks a block in the same tick. `run.tick` still runs after `stepCombat`.
- `power.bagRest: true` in place of `bagWeight` gives the feature the share that is left after every weighted
  power. It goes first in the bag, so the deal does not change. Exactly one feature has it (bolt). A test in
  `features/registry.test.ts` checks this.
- `RunContext` also gives `resolveMine( event )` (core mine outcome and broadcast), `nextId()` (the run's
  shared projectile id counter) and a mutable `broken` set.
- A feature may own its schema class in a leaf file (`features/bolt/bolt-schema.ts`). `schema.ts` imports it
  and keeps the `RunState` field where it was, so the wire does not change.
- A feature with no player fields annotates its contract as `SimFeature< Record< never, PlayerFieldSpec > >`.
  A bare `SimFeature` widens `PLAYER_FIELDS` to a string index and breaks `SimShipFields`.

F4b (#397, seeker) added these slot rules:

- `run.strike` hooks run in feature id order: bolt, then seeker. `stepCombat` builds the mine target list after
  `strike`.
- The power bag draws every weighted power, core or feature, in `HeldPower` kind order. A new `bagWeight`
  feature does not change the deal of the powers before it.
- Target lock is a neutral leaf, `combat/target-lock.ts` (`lockTarget( …, range, margin, dir )`). A feature
  that needs a lock imports that leaf, not another feature's files.
- `hud.overlay` is a DOM component that takes `{ room }`. `NetHud` renders each one through
  `<FeatureOverlays room={ room } />` inside the HUD layer. Seeker's lock warning uses it.
- `splitPickupLayout` (`game/scene/pickup-layout/`) buckets core pickups only. A feature's pickups filter
  their own anchors in their `views.pickups` component.

**The sim half imports leaf modules only.** `player-fields.ts` (schema) and `sim-hooks.ts` (step) read the
registry when their module loads. A sim half that imports heavy core (`combat-step`, `run/combat`) closes an
import cycle. The cycle throws `Cannot access 'SIM_FEATURES' before initialization` on some entry orders
(memory `feature-registry-import-cycle.md`). Get engine services through `RunContext`, not through an import.
`features/registry.test.ts` imports the registry first to catch the cycle.

| Slot | Engine consumer (one loop over the registry) |
|---|---|
| `ship.input` | `step()` folds the input after the stun gate, in sorted feature order |
| `ship.thrust` / `ship.cap` / `ship.tick` | `step()` sums `thrust`, folds `cap`, calls `tick`, in sorted feature order |
| `ship.clear` | `markDead` and `respawn` call it after the core status clear |
| `run.use` / `run.tick` / `run.reset` | `RunSim` calls `use` by power kind, `tick` every step after `stepCombat`, `reset` on run reset |
| `run.strike` | `stepCombat` calls it after the shield step, before mines, portals and pickups, in feature id order |
| `power` | the power bag puts the one `bagRest` power first, then draws the core and `bagWeight` powers in `HeldPower` kind order |
| `rules` | default config, server clamp and key check for B2 overrides, dev dials (§7) |
| `fields.player` | `PlayerState` composition and `SIM_SHIP_KEYS` / `SIM_FLOAT_KEYS` (§4) |
| `messages` / `net` | the room registers server handlers; the bridge subscribes client handlers |
| `systems` | the frame scheduler (§5) |
| `views.scene` / `views.pickups` | `<FeatureViews slot="…" />` renders each feature's view |
| `hud.glyph` | the power glyph atlas |
| `hud.overlay` | `<FeatureOverlays room={ room } />` in `NetHud` renders each feature's DOM overlay |
| `audio` | room audio binding |
| `dials` | the dev tunables panel |

### Discovery: D1 registry now, D3 codegen later

- One explicit array per end: `SIM_FEATURES` and `CLIENT_FEATURES`. One import and one entry per feature.
- Registry order does **not** decide run order (§5). It decides only schema field order (§4).
- Dev-only features go in a second `DEV_FEATURES` array behind `import.meta.env.DEV`.
- Never `import.meta.glob`: the server and `@slur/shared` have no bundler, so the two ends could find
  different lists.
- Never self-registration (a `register()` call on import): import order would decide.
- When the list passes about 10 features, a node script generates it (D3) and lint fails when it is stale.

### Modules talk through traits and events

- A module reads core traits (`Sim`, `Render`, `LocalPlayer`, tags such as `Dead`) and its own traits.
- A module announces through events and reads other modules' events. It never imports another module's
  files.
- Events use `createEventQueue< T >( cap )` (`game/scene/event-queue.ts`) today. The target is one ring
  buffer per event type with a read cursor per consumer (RFC S9); a feature declares the types it emits.
- Enforcement target (E1): a Biome GritQL plugin fails an import into `features/<a>/` from `features/<b>/`
  unless the path ends in `.feature` or `.client`.

### Commands (Q7, owner 2026-09-29, answer a3, RFC `54ff79b7`)

- Client → server commands use the 0.17 `messages` table with `validate()`.
- Each schema is a hand-written synchronous StandardSchemaV1 object:
  `{ '~standard': { version: 1, vendor: 'slur', validate( v ) } }`. It wraps the existing checks.
- No validator library. Do not add valibot or zod.
- This is S12 work, not F1.

## 4. Schema fields: `schema()` composition

```ts
export const PlayerState = schema(
    { ...CORE_PLAYER_FIELDS, ...playerFieldsOf( SIM_FEATURES ) },
    'PlayerState',
);
```

- `schema( fields, name )` is in `@colyseus/schema/build/annotations.d.ts:108`. Spread order is wire order.
- The same object builds `SIM_SHIP_KEYS` and `SIM_FLOAT_KEYS`. The sim stays flat: `simulate()` reads
  `ship.tugTimer`, not `ship.tug.timer`.
- Types come from `InferSchemaInstanceType`. No module augmentation.
- The client decodes by reflection, so order must be deterministic **on the server only**. It must never
  depend on an import side effect.

Rules:

**Wire order is not append-only across F-stages** (owner, 2026-09-29, D1 = B). When a feature moves its
fields out of core, the fields move to the end, and the indexes after them change. This is safe for one
reason: the client decodes by reflection, so it reads the order from the server. Both ends deploy together.
F2 moved the four tug fields to indexes 35–38, after `progressAt`.

1. Between F-stages, never remove, reorder or insert a field. A new feature appends to the end of the
   registry. An F-stage that moves fields changes the order on purpose and says so in its commit body.
2. Keep a dead field as a plain field. Never `@deprecated()` (memory `deprecated-breaks-reflection-decoding.md`).
3. A golden test (`player-fields.test.ts`) fails when a change moves the index of a field. An F-stage
   updates it in the same commit, and proves the move with two SDK clients (rule 5).
4. **The same test asserts every index is `< 64`.** The library guard is `index > 64`
   (`src/Metadata.ts:73`), so index 64 passes and decodes as a DELETE of field 0, with no error.
5. After a schema change, assert on the **client-decoded** state (as `run-room.test.ts` does).
6. A feature that needs many fields takes one child Schema slot and reads it nested in its own hooks only.

## 5. System order (O1)

- The scheduler is `game/frame/schedule.ts` (`buildSchedule`, S16). Phase priorities are in
  `game/frame/frame-phase.constants.ts` (`FRAME_PHASE`).
- Phases, in order: `input` → `simulate` → `sync` → `react` → `view` → `prerender` → `render` → `overlay` →
  `cleanup`.
- A **system** writes state that other code reads. It is a plain function registered with
  `{ id, phase, before?, after? }`. It never mounts, so a remount cannot reorder it. `before`/`after` may name
  systems in the same phase only.
- The scheduler sorts once at boot: phase, then topological order, then `id`. A cycle, an unknown id or a
  duplicate id throws at boot.
- A **view** animates only its own objects. It stays a component with `useFrame( cb, FRAME_PHASE.view )`.
  Views never read each other, so their order inside `view` does not matter (O5).
- The camera writer is the last system in `sync`. Anything that reads the camera or `Sim` runs in `view` or
  later.
- The sim half uses the same rule. Its phases are fixed hook points in `step()` (thrust, cap, tick). Ties
  break by feature `id`, so both ends compute the same order.
- A feature never calls `gl.render` for the main frame. It may add a post effect in a fixed slot
  (`beforeBloom` · `bloom` · `afterBloom` · `beforeToneMap`), an off-screen pass in `prerender` or an overlay
  in `overlay`.
- Quality is a service. A feature declares a `quality` hook `( profile ) => settings` and turns itself off
  (`visible = false`, the system returns early). It never unmounts on a tier change.

## 6. Rule C — where state lives

| Kind | Home | Read with |
|---|---|---|
| A thing with a position or a lifetime in the race (ship, projectile, seeker, mine, pickup, hazard) | **entity** | `useQuery`, `world.query` |
| A state of that thing (`Dead`, `Stunned`, `Shielded`, `Boosting`, `Spectating`, `Taken`) | **tag on the entity** — `trait()` with no schema | `useHas`, `useTag`, `world.query( A, Not( Dead ) )` |
| Game state for the whole run (phase, spectator target, standings, block world, run config, power slot) | **world trait** — `world.add / get / set / has` | `useTrait( world, T )`, `useTraitEffect( world, T, cb )` |
| A service with its own lifetime (Colyseus room, audio engine, input devices, dev tools, quality store) | **module singleton** (NN-8) | its own API |
| Scratch objects and VFX pools for one component | that component's `.scratch.ts` / `.state.ts` | — |

1. **A state is a tag, never a value branch.** Do not read `sim.dead` or `stunTimer > 0` to decide
   behaviour. Query the tag. The bridge adds and removes tags when the server state changes.
2. **Per-run state is a world trait.** Components subscribe to it. No bare mutable objects
   (`runPhase.value = …`) and no hand-rolled store for race state.
3. **One run reset.** On run end or room leave, one function in `engine/` removes every per-run world trait,
   destroys the run's entities, then calls each feature's `run.reset`. Nothing else holds per-run state. A
   new per-run value is not done until the run reset clears it.
4. **Services stay module singletons**, never tied to a component's mount (NN-8).
5. **Events carry an entity reference, not a session-id string.**
6. **The server keeps plain `simulate()` on `RunSim`, with no koota.** The sim half already runs without an
   ECS, and a leaked koota world id would fail room creation.
7. Lobby, chat, connection status and ship choice sit outside the race loop. They stay module stores.

Mapping of today's state (targets for S4 and S5):

| Today | Target | Stage |
|---|---|---|
| `Sim.dead` (13 reader files), `stunTimer`, `Shield` values | tags `Dead`, `Stunned`, `Shielded` | S4 |
| `localRole.spectating` (`game/spectator.ts`) | tag `Spectating` on the local ship | S4 |
| `runPhase`, `spectatorCam` (`game/spectator.ts`) | world traits `Phase`, `SpectatorTarget` | S5 |
| `standings-store.ts`, `run-view-store.ts` | world traits | S5 |
| `blockWorld` + `confirmedBroken` (`game/block-state.ts`) | world trait `Blocks` holding the `SimWorld`; `simulate()` still takes it as a parameter | S5 |
| pickup `taken` set (`game/pickup-state.ts`) | pickup entities with a `Taken` tag, spawned once per track from the descriptor | S5 |
| `power-select.ts` `selected` | world trait `PowerSlot`, cleared by the run reset | S5 |
| run config | world trait `RunConfig` (`game/ecs/run-config.ts`, landed 41c9a41) | done |

S4 moves readers one at a time. S5 adds the run reset and moves every reset caller
(`clearBlockState`, `clearPickupState`, `resetSpectatorTarget`, `resetSlot`) into it.

## 7. Constant tiers

| Tier | Examples | Owner | Changes when | Lives in |
|---|---|---|---|---|
| **Rules** | sim config, ship classes, pickup and combat numbers | server, per room | locked at GO | the sim half (`defineRules`) |
| **Track gen** | ADR-006 envelope, slalom, pacing | server, per room, in the descriptor | locked at GO | `@slur/shared`, `TrackDescriptorState` |
| **Look** | colours, bloom, materials, nebula | client | any time; never affects the sim | the client half, or a subsystem `look/` module |
| **Dev** | tunables panel | client, dev only | any time; overrides one tier above | the dials slot |

1. **A value that `simulate()` reads is Rules or Track gen.** It lives in a sim half or in `@slur/shared`.
   The client never holds a second copy. The predictor reads the room's config from the `RunConfig` world
   trait, never `DEFAULT_SIM_CONFIG`.
2. **A feature's Rules and Look constants live in its own module.**
3. **A dev dial that changes a Rules value goes through the B2 `overrides` map**, so the server and the
   predictor both see it. A dial never writes Rules into client-only state.
4. **Look placement (A + B).** A Look constant for one component stays colocated in `<name>.constants.ts`
   (NN-9). A Look constant that two or more components read moves to its subsystem's `look/` module. Dials
   read their defaults from there.

### Rules spec (c4)

Each feature declares its Rules once:

```ts
export const TUG_RULES = defineRules( 'tug', {
    pullS: { value: 1.2, min: 0.2, max: 4, step: 0.05 },
} );
```

The one spec gives the default config, the server clamp, the server key check and the dev dial. Never
repeat a Rules min/max in `dev/tuning-schema.ts`.

- In-memory shape for a new feature: nested, `config.tug.pullS` (c2).
- Existing flat readers (`config.tugS`) keep working through a key table from the registry during the
  migration (c3).

### Room config shape (B2) — target for S6

```ts
@type( 'string' ) preset                       // registry id of a named Rules preset
@type( { map: 'float32' } ) overrides          // sparse; key = '<feature id>.<rule>', e.g. 'tug.pullS'
```

- Both ends build the config the same way: registry defaults → preset → overrides.
- The server rejects an unknown key and clamps each value to its spec.
- **The server merges the `Math.fround`-ed value**, because overrides travel as float32. Otherwise the server
  and the predictor differ in the last bits (memory `fround-makes-float-asserts-fail.md`).
- The server rejects writes to `preset` and `overrides` when `phase !== lobby`. Config locks at GO.
- A late joiner gets the config from state, with no extra message.
- The client holds the merged config in the `RunConfig` world trait. Every `simulate()` call reads it.
- Track gen extends `TrackDescriptorState` under the same lock.
- **Scope (Q5, owner 2026-09-29): combat and world rules only.** Ship tuning (`SHIP_CLASSES`) stays fixed
  data (NN-6) and is never a B2 key. Adding it later is additive: new keys in the same map, and the server
  runs `rosterContractFailures()` on the merged table before it accepts a lobby write.
- **Dev dials in a hosted room (Q6, owner 2026-09-29, answer B).** In a dev build, the host's Rules dials
  write the room's B2 override map in the lobby only. Values lock at GO for every racer. The server accepts
  these writes only when it runs in dev mode, so a production room rejects them. Built in S6.

## 8. Open questions — not decided

Do not decide these in code. Ask the owner through the supervisor.

- None. Q5, Q6 and Q7 are answered and folded in (§3 "Commands" and §7).

## 9. Anti-patterns

| Do not | Why |
|---|---|
| Edit a central file (`step.ts`, `run-sim.ts`, `net-canvas.tsx`, `glyph-atlas.ts`, `tuning-schema.ts`) for one feature | That is the cost feature modules remove. Add a slot or an engine consumer instead. |
| Pick a numeric `useFrame` priority for a system | Collisions are silent. Declare `phase` + `before`/`after`. |
| Branch on `.dead` or a timer value | Rule C item 1. Query the tag. |
| Keep per-run state in a module `let` or a bare object | It leaks across runs (`resetSlot()` had no caller). |
| Copy a Rules default into a client constant | The predictor and the server disagree on the next change. |
| Insert a schema field anywhere but the end | It shifts every later index and corrupts reflection decoding. |
| Gate a feature by unmounting it on a quality change | A remount moves its `useFrame` to the end of the band. |

## References

- `docs/RFC-349-ARCHITECTURE.md` — evidence, measurements, rejected options, stage table (§7).
- `conventions/ecs.md` — koota idioms, tags, world traits.
- `conventions/colyseus.md` — schema and messages.
- `conventions/netcode.md` — prediction and the shared `simulate()`.
- `docs/DECISIONS.md` ADR-000 — the load-bearing contract.
