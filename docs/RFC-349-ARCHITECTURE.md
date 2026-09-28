<!-- This document follows ASD-STE100 (Simplified Technical English): short sentences, active voice, one
instruction per sentence. See CONTRIBUTING.md §8. -->

# RFC-349 — Architecture: feature modules, ECS drift, server-owned game config

- **Issue:** #349 · **Status:** DRAFT (not approved) · **Lead:** workerone · **Updated:** 2026-09-28
- **Authors:** §1, §3, §6, §7 workerone · §4 workertwo (incl. the net half §4.4–4.5) · §5 workerthree.
  All merged. One voice.
- **Scope:** this RFC proposes. It changes no source. Each stage in §7 needs its own issue and owner approval.
- **Owner direction (2026-09-28, via the supervisor):** organise code as **feature modules**. A feature
  folder exports its traits, systems and views by a convention, and the engine wires them. The goal is to
  *"scale by adding a folder, not by editing central files."*

## 0. Summary

Today one feature is spread across the code base. The tug power-up has 11 files of its own, but it also
edits **19 central files** (§1.8). Every new power-up pays that cost again.

The central proposal (§3) is a **feature module**: one folder per feature on each end. A **shared half**
holds what `simulate()` runs on the server and the client. A **client half** holds traits, systems, views,
audio, HUD and dials. Each system declares its phase and its order. The engine sorts and runs them. Modules
talk through traits and events, never through each other's internals. The pilot is tug.

The rest of the RFC supports that shape:

- §6.1 sets one rule for where state lives inside a module (entity, tag, world trait or service).
- §4.3 B gives server-owned room config. Each module declares its own Rules defaults.
- §4.3 A gives one event mechanism for module-to-module talk.
- §3.4 and §4.5 give the net half: schema fields by `schema()` composition, messages by the Colyseus 0.17
  table, Rules by one `defineRules` spec. The limit is 64 fields per Schema class; `PlayerState` uses 39.
- §5 gives the nine frame phases that systems declare, one render owner, and quality as a service. Frame
  order today is mount time, so it changes with spawn time and quality tier.

## 1. Current map (measured 2026-09-28)

Measured at `6118831` (workerone) and `4b58658` (workertwo). No source changed between them. All counts
exclude `*.test.*`. Path root is `apps/client/app/` unless stated.

### 1.1 koota world

- One world per page: `game/ecs/world.ts:3` — *"`export const world = createWorld();`"*
- 16 traits in `game/ecs/traits.ts` (63 lines). One file holds the traits of every feature.
- koota 0.6.6 has **no scheduler**. Its export list (`koota/dist/index.d.ts:89`) has `createWorld`,
  `trait`, `relation`, `createQuery`, `createActions` and no system or schedule API. Order today comes from
  `useFrame` call sites (§5).
- Spawn sites (`rg "\.spawn\("`):

| Entity kind | Where | Traits |
|---|---|---|
| Local ship | `net/attach-room-to-world.ts:118` | `Render, Hover, Attitude, Net, Sim, Prev, LocalPlayer, Held, Shield` |
| Remote ship | `net/attach-room-to-world.ts:119` | `Render, Hover, Attitude, Net, Remote, Interp, Shield` |
| Projectile | `net/attach-room-to-world.ts:199` | `ProjInterp, NetProjectile` |
| Seeker | `net/attach-room-to-world.ts:220` | `ProjInterp, NetSeeker, SeekerTrail` |
| Mine | `net/attach-room-to-world.ts:241` | `NetMine` |
| Landing ship | `routes/home/landing-rig/landing-rig.tsx:22` | `Sim, LocalPlayer, Render, Net` |
| Beat-deck ship | `routes/beat-deck/deck-ship.tsx:17` | — |

- 33 files query the world. 36 files import `ecs/traits`.
- Systems: `game/ecs/systems.ts` (2) and `game/ecs/net-systems.ts` (4). `useFrame` callbacks call them.
- The bridge `net/attach-room-to-world.ts` (337 lines) mirrors Colyseus state into the client. A
  `useEffect` starts it (`game/net-canvas.tsx:68`). It keeps **8 hand-written maps** for 4 networked kinds
  (lines 139–146). It writes to koota entities, to `blockWorld` (`:261`, `:276`), to the pickup set
  (`:272`), to event queues (`:258` `burstMine`, `:259` `pushTug`, `:279` `pushHit`) and to bare flag
  objects (`:149` — *"`runPhase.value = v`"*, `:159` — *"`localRole.spectating = p.spectating`"*).

### 1.2 State outside koota

| Kind | Count | Examples |
|---|---|---|
| `*.state.ts` / `*-state.ts` files | 20 | table below |
| Hand-rolled stores (`useSyncExternalStore`) | 18 files | `lobby/lobby-store.ts`, `net/chat-store.ts`, `game/net/standings-store.ts` |
| Files with module-level `let` | 35 (72 lines) | `game/camera/chase.ts`, `game/input/power-select.ts:12`, `net/client.ts` |
| Event queues | 6, in 3 shapes | §4.1 |
| Bare mutable objects | 3 | `game/spectator.ts:3,5,7` — `localRole`, `spectatorCam`, `runPhase` |

The 20 state files hold five kinds of thing (workertwo):

| Kind | Files |
|---|---|
| Game state that the sim reads | `game/block-state.ts:3` — *"`export const blockWorld = createSimWorld()`"*; `game/pickup-state.ts:1` — *"`const taken = new Set< string >();`"* |
| Input state | `game/input/touch-state.ts`, `touch-dpad.state.ts`, `touch-stick.state.ts` |
| UI stores | `quality/quality.state.ts`, `flight-recorder.state.ts`, `track-editor.state.ts` |
| VFX event lists | `block-burst.state.ts`, `meteor-chunks.state.ts`, `meteor-scorch.state.ts` |
| Scratch objects, not state | `tug-line.state.ts:5–17` (13 THREE scratch objects) |
| Per-component values | `game-audio.state.ts`, `ship-model.state.ts`, `track-blocks.state.ts`, `power-arc.state.ts` and 4 more |

Reader counts (files): `blockWorld` 11 · hit queue 8 · `localRole` 6 · mine-shock queue 4 · `currentInput`
4 · pickup set 3. Value reads that act as state flags: `.dead` in 13 files, `stunTimer` in 3.

Reset points, callers outside tests: `clearBlockState()`/`clearPickupState()` only in the bridge cleanup
(`attach-room-to-world.ts:322–323`); `resetSpectatorTarget()` in `game/net-loop/net-loop.utils.ts:32`;
`resetSlot()` (`game/input/power-select.ts:54`) has **no caller**, so the power slot carries over between runs.

### 1.3 Config and constants

| Home | Size | Reaches the server? | Reaches the predictor? |
|---|---|---|---|
| `packages/shared/src/constants.ts` | 305 lines, 81 exports | yes | yes |
| `packages/shared/src/sim-config.ts` — `DEFAULT_SIM_CONFIG` | 205 lines | yes, as the `RunSim` default | yes, hard-coded |
| `SHIP_CLASSES` via `tuningForShip( id )` | code registry | yes | yes; not synced (#23) |
| `TrackDescriptorState` (`packages/shared/src/schema.ts:110–118`) | `seed, tier, length, blockDensity, gapChance, levelId, gen` | yes | yes, synced |
| Client `*.constants.ts` | 73 files | no | no |
| Client look modules (`*-look.ts`, `*-config.ts`, `nebula-presets.ts`) | 11 files | no | no |
| Dev tunables `dev/tuning-schema.ts` | 192 entries, 39 reader files, `localStorage` | loopback only | **no** |
| Server env `SLUR_TRACK_GEN` | 1 value | yes | through the descriptor |

- Live rooms pass no config: `apps/server/src/rooms/run-room.ts:77` —
  *"`this.sim = new RunSim( descriptor, { broadcast: …, onMeta: … } );`"*. `RunSim` falls back:
  `packages/shared/src/run/run-sim.ts:77` — *"`this.config = options.config ?? DEFAULT_SIM_CONFIG;`"*.
- The client hard-codes the default in four places: `net/prediction.ts:52`, `game/ecs/systems.ts:16`,
  `game/ecs/net-systems.ts:49`, `routes/beat-deck/deck-flight.ts:21`.
- `/test-level` passes tuned config to its loopback server only (`routes/test-level/test-level-room.ts:40`
  — *"`config: tunedSimConfig(),`"*). The predictor and the server disagree on every moved sim dial.

### 1.4 Server

- The server uses **no koota**. `rg "koota|createWorld" apps/server/src packages/shared/src` finds
  nothing. CLAUDE.md: *"koota ECS (client-only; the server runs the plain shared `simulate()`)"*.
- koota 0.6.6 allows 16 live worlds per process (`koota/dist/chunk-ZWIGMIL4.js:34` — *"`var WORLD_ID_BITS
  = 4;`"*, `:74`; throws at `:81–82`; ids reused at `:73`). `apps/server/src/limits.ts:1` — *"`export const
  MAX_ROOMS = 12;`"*.
- The server runs on tsx/Node. It has no bundler, so **Vite-only features such as `import.meta.glob` do
  not exist there**. `@slur/shared` is `tsc`-compiled (NN-5), so it has none either.

### 1.5 Input

- `game/input/current-input.ts:7` merges three module sources: *"`const SOURCES = [ keyboardInput,
  touchInput, gamepadInput ]`"*.
- Discrete actions (fire, cycle, drop, mute) are **DOM key events**. Gamepad maps buttons to key codes
  (`gamepad.ts:16–25`); `synth-key.ts:2` dispatches a fake `keydown`. The touch d-pad does the same
  (`touch-dpad.constants.ts:7–8`).
- Input sends run on a second clock: `attach-room-to-world.ts:54` `INPUT_SEND_MS = 1000 / 30`, sent from a
  `setInterval` at `:293–295`. `seq` goes up once per sim tick (`current-input.ts:17`).

### 1.6 File layout

- 506 non-test source files under `apps/client/app/`.
- `game/scene/` holds **95 loose files** next to **47 component folders**.
- Vite 8.2.1 supports `import.meta.glob` with `eager`, `import` and `query` options
  (`vite/types/importGlob.d.ts:5–35`). The client does not use it today (`rg "import.meta.glob"` finds
  nothing).

### 1.7 Frame schedule

→ §5. Headline numbers from workerthree: 46 `useFrame` sites (39 at priority 0) and 8
`addEffect`/`addAfterEffect` calls in 7 files [measured by workerthree, not re-measured here].

### 1.8 Feature footprint: tug

Measured with `rg -il tug` over `apps/` and `packages/`, tests excluded.

**Tug's own files (11):** `game/scene/tug-events.ts`, `game/scene/tug-line/` (4 files),
`game/scene/tug-pickups/` (2 files), and in `packages/shared/src/`: `combat/tug.ts`,
`combat/tug-constants.ts`, `run/tug-run.ts`, `sim/tug-status.ts`.

**Central files that tug edits (19):**

| Central file | What tug adds there |
|---|---|
| `packages/shared/src/sim/step.ts:422–423` | *"`boostThrust( … ) + tugThrust( … )`"*, *"`tugCap( s, t, boostCap( … ), cfg )`"* — a hand-wired sim hook |
| `packages/shared/src/sim/types.ts` | 8 mentions: ship fields and config types |
| `packages/shared/src/schema.ts:51,54` | *"`@type( 'float32' ) tugTimer`"*, *"`tugAnchorZ`"* |
| `packages/shared/src/sim-config.ts` | 46 mentions: tug config defaults |
| `packages/shared/src/run/run-sim.ts:66,120,234,269` | *"`private readonly tugThrows: TugThrow[] = [];`"* and its plumbing |
| `packages/shared/src/run/combat.ts` | 5 mentions: use dispatch |
| `packages/shared/src/combat/power-bag.ts`, `combat/constants.ts`, `index.ts` | power enum, bag weight, exports |
| `net/attach-room-to-world.ts:259` | *"`room.onMessage( TUG_MESSAGE, pushTug )`"* |
| `game/net-canvas.tsx:86` | *"`<TugLine />`"* — a hand-written mount |
| `game/scene/pickup-field.tsx:26` | *"`<TugPickups layout={ layout.tugs } … />`"* — a hand-written mount |
| `game/scene/seeker-pickups/seeker-pickups.utils.ts:26,34` | a `case HeldPower.tug` and a `tugs: []` layout slot |
| `game/scene/seeker-pickups/seeker-pickups.tsx:12` | `tugs: Anchor[]` in a shared type |
| `game/scene/power-arc/glyph-atlas.ts:102` | *"`[ HeldPower.tug ]: [`"* — the HUD glyph |
| `audio/bind-room-audio.ts` | 8 mentions: SFX wiring |
| `dev/tuning-schema.ts` | 8 dials |
| `routes/test-level/tuned-sim-config.ts` | 15 mentions: dial → config getters |
| `routes/test-level/pickup-grants/pickup-grants.constants.ts` | a test-level grant entry |

So a feature touches **30 files, 19 of them shared with every other feature**. This is the number the
pilot (§7 F2) must bring down.

## 2. Problems, ranked

Rank = cost to dev speed plus cost to look/perf work. §5.6 problems are folded in.

| Rank | Problem | Evidence | Cost |
|---|---|---|---|
| 1 | **A feature is spread across central files.** Tug edits 19 central files. Mounts, message handlers, sim hooks, glyphs, dials and SFX are hand-wired lists. | §1.8 | Each new power-up re-edits the same 19 files. Two workers on two features collide in them. Removing a feature is a hunt. |
| 2 | **Config has no single owner, and the predictor hard-codes the default.** | §1.3 | Every sim-dial test on `/test-level` shows reconcile snaps that live play does not have. #70 and #23 cannot ship. A deploy can pair an old tab with a new server [inferred]. |
| 3 | **No declared order; frame order is mount time.** koota has no scheduler. R3F sorts `useFrame` by priority, then by subscribe time (a layout effect), not JSX order. Priorities are magic numbers, copied (`0.25` ×3, `0.5`, `1`, `2`, `−1` in 7 files). | §1.1, §5.1, §5.2 hazards 1–4 | Sky, fill light and rocks lag the camera by one frame. Order changes with ship spawn time and quality tier. A new system's position is a guess. |
| 4 | **`PlayerState` is at 39 of 64 schema fields.** The cap is hard: `Metadata.ts:73` throws at boot. | §3.4, §4.4 fact 3 | 25 slots for every future feature. Tug alone uses 3. A 66th field stops the server at boot. A 65th field (index 64) passes the guard and silently corrupts the wire: it decodes as a DELETE of field 0 (§3.4). |
| 5 | **State has no placement rule and no reset point.** | §1.2 | Each feature re-decides where state goes. Cross-run leaks are real: `resetSlot()` has no caller. |
| 6 | **Render and quality act by mount.** Three `gl.render` owners chosen by `QualityGate` mounts. Quality knobs act at three times; the build-time ones ignore a mid-race step-down. `/test-level` never steps down (`game-shell.tsx:11`). | §5.3, §5.4 | Removing one render owner blacks the canvas (#345). A step-down leaves sky and track textures at the old tier. The owner's test route does not show step-down. |
| 7 | **Discrete input is fake DOM keys.** | §1.5 | #348 must change key codes in three files. Dev-key listeners also receive the fake keys. |
| 8 | **Value flags instead of tags.** `dead` (13 files), `stunTimer`, `localRole.spectating`. | §1.2 | Breaks `conventions/ecs.md` rule 3: *"Model state transitions by adding/removing components … not by branching on values."* |
| 9 | **Six event queues, three shapes, two overflow rules.** Drain is single-consumer and nothing enforces it. | §4.1 | Each new VFX/SFX copies a queue. A second listener silently misses events. |
| 10 | **Two input clocks.** 30 Hz `setInterval` send next to the 60 Hz sim tick. | §1.5, §5.2 hazard 6 | A send can land on either side of a tick. NN-13 rejects a second clock when a loop exists. |
| 11 | **Messages are hand-wired and unvalidated.** 22 `*_MESSAGE` constants in 8 shared files; 8 `onMessage` calls in `run-room.ts:88–101`; no payload check. | §4.4 facts 5–6 | Each message edits 3 files. A bad payload reaches the sim. |
| 12 | **Hand-rolled stores and bridge boilerplate.** 18 store copies; 8 bridge maps. | §1.1, §1.2 | Boilerplate per store and per networked kind. |
| 13 | **Flat `game/scene/`.** 95 loose files. | §1.6 | Slow to find the owner of a look. Feature modules (§3) dissolve most of it. |
| 14 | **Per-frame waste.** 6 components copy dials into their materials every frame. About 25 koota queries per frame copy their result. | §5.1, §5.6 | Low. App frame code is 0.08 ms of 1.60 ms at 1× (§5.1). GC pauses [unmeasured]. |

The frame schedule (rank 3) is a correctness and dev-speed problem, not a CPU problem. The CPU lever is
three.js per-object work: draw calls and passes (§5.1).

Not a problem today: the koota 16-world cap (§1.4). It only constrains a server ECS, which §6.1.4 rejects.

## 3. Feature modules (central proposal)

### 3.1 Goal and test

A new feature is **one folder per end plus at most one registry line per end**. It edits no other file.
The test is the tug count in §1.8: 19 central files today, **≤ 2 registry lines** after the pilot. Schema
fields need no exception (§3.4). They share a hard cap of 64 fields per class instead.

### 3.2 Two halves per feature

ADR-000 splits every gameplay feature in two. The split follows the one shared `simulate()`.

| Half | Home | Runs on | Holds | May import |
|---|---|---|---|---|
| **Sim half** | `packages/shared/src/features/<name>/` | server `RunSim` and client predictor | Rules defaults, sim hooks, run hooks (use, tick), schema fields, message ids | `@slur/shared` core only |
| **Client half** | `apps/client/app/features/<name>/` | client only | traits, systems, R3F views, HUD pieces, audio, dials, net-message handlers | its own sim half, the engine, core traits |

- The sim half must stay deterministic. It runs in a fixed order that both ends compute the same way
  (§3.5). It never touches koota, THREE or the DOM.
- The server has no koota (§1.4). The client half is the only place that holds traits and systems.

### 3.3 The module contract

The contract file is `<name>.feature.ts` (sim half) and `<name>.client.ts` (client half). NN-9 forbids
`index.ts`, so the contract file has its own name. Sketch (shape, not final API):

```ts
// packages/shared/src/features/tug/tug.feature.ts
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
// apps/client/app/features/tug/tug.client.ts
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

What each slot replaces in §1.8:

| Slot | Replaces |
|---|---|
| `ship.thrust / cap / tick` | the hand-wired sum in `step.ts:422–423` |
| `rules` | the tug block in `sim-config.ts`, `tuned-sim-config.ts` and the 8 `Tug.*` dials in `tuning-schema.ts:118–125`; one spec (§4.5 c4); keys become `tug.*` in the B2 overrides map (§4.3 B) |
| `fields.player` | the tug lines in `schema.ts:51,53,54` and in `SIM_SHIP_KEYS` / `SIM_FLOAT_KEYS` (`sim/types.ts:83`) (§3.4) |
| `run.use / tick / reset` | `run-sim.ts` `tugThrows` plumbing and the dispatch in `run/combat.ts` |
| `power` | `power-bag.ts` and the enum entry |
| `views.scene`, `views.pickups` | the mounts in `net-canvas.tsx:86` and `pickup-field.tsx:26` |
| `hud.glyph` | `glyph-atlas.ts:102` |
| `net` | `attach-room-to-world.ts:259` |
| `audio` | the tug lines in `bind-room-audio.ts` |
| `dials` | the tug entries in `tuning-schema.ts` |

The engine side is a small, fixed set of consumers. Each loops over the registry once:

- `step()` sums `ship.thrust` and folds `ship.cap` over all sim features, in sorted order.
- `RunSim` calls `run.use` by power kind and `run.tick` / `run.reset` for every feature.
- `<FeatureViews slot="scene" />` and `<FeatureViews slot="pickups" />` render every feature's view.
- The bridge subscribes every `net` handler.
- The scheduler runs every `systems` entry by phase (§3.5).
- The dev panel builds its schema from every `dials` entry.

### 3.4 Schema fields: composed, not decorated

Field order is wire order. The memory `deprecated-breaks-reflection-decoding.md` records that a shifted
field index breaks reflection decoding. So a feature needs a fixed rule for where its fields go.

The installed `@colyseus/schema` 4.0.30 can declare fields without decorators (workertwo, §4.4 facts 1–2):

- `schema( fields, name )` (`annotations.d.ts:108`) builds a class from a plain object. Spread order is wire
  order (`Metadata.ts:202–206`).
- The client decodes by reflection (`net/matchmaking.ts:65,70,75`). So the order must be deterministic **on
  the server only**.

**Proposal (b5, §4.5):** `PlayerState = schema( { ...CORE_PLAYER_FIELDS, ...tug.fields.player, … },
'PlayerState' )`, with the spread list built from the D1 registry in array order. The same object builds
`SIM_SHIP_KEYS` and `SIM_FLOAT_KEYS`, so the sim stays flat (`simulate()` still reads `ship.tugTimer`). Types
come from `InferSchemaInstanceType`, with no module augmentation. So **schema is not a central edit**.

Rejected: a child Schema per feature (b2/b3). It costs one slot per feature, but `simulate()` would read
`ship.tug.timer`, and `copySimShip` / `froundSimShip` would need a deep copy.

Rules for every change:

1. Never remove or reorder a field. A new feature appends to the end of the registry.
2. A registry test fails if a change moves the index of an existing field.
3. Assert on the **client-decoded** state after every schema change, as `run-room.test.ts` does for the rack.

**Cap.** A Schema class holds at most 64 fields. `@colyseus/schema/src/Metadata.ts:73–74` — *"`if (index >
64) { throw new Error(… "Schema instances may only have up to 64 fields.") }`"*. `PlayerState` has **39**
(verified this session: `@type(` count per class in `packages/shared/src/schema.ts`). So 25 slots remain for
every future feature. The library guard is off by one: `index > 64` lets index 64 through. The encoder
writes `(index | operation) & 255` (`encoder/EncodeOperation.ts:74`), and `DELETE = 64`
(`encoding/spec.ts:10`). So a field at index 64 decodes as a DELETE of field 0, with no error. The usable
cap is 64 (indexes 0–63). Our field-index test (rule 2) must assert `index < 64` itself. Feature modules
make adding fields cheap, so the cap becomes a real limit (§2 rank 4).
If a feature needs many fields, it takes one child Schema slot and accepts the nested read in its own
hooks only.

### 3.5 System order is declared, never implied

Every system declares `{ id, phase, before?, after? }`. The engine sorts at boot. File order and import
order never decide anything. The sim half's hooks use the same rule, so both ends compute the same order
from the same declarations.

| | Option | Correctness | Clocks | Idiom fit | Cost |
|---|---|---|---|---|---|
| **O1** | **Phase + `before`/`after`, topo-sorted at boot; ties break by `id`; a cycle throws** | explicit and stable | one per phase | Bevy's `.before/.after` + `SystemSet` | one sort at boot |
| O2 | Numeric priority per system | collisions are silent; a new system must know every number | one | today's `useFrame` priority | none |
| O3 | Registry or import order | implied order; the owner rejects it | one | low | none |
| O4 | One central schedule list that names every system | explicit | one | medium | a central edit per feature — fails §3.1 |
| O5 | Phase only; systems inside a phase must not depend on each other | clean when true; unenforced | one | medium | none until a hidden dependency appears |
| O6 | Derive order from declared trait reads/writes | strongest | one | Bevy ambiguity checks | heavy to build |

**Recommendation: O1 for systems, O5 for views**, with a dev-only print of the resolved schedule. §5.2
confirms this and also weighs O7 (the `directed` package) and O8 (a phase constants file, the first stage).
The phase list is in §5.2: `input` → `simulate` → `sync` → `react` → `view` → `prerender` → `render` →
`overlay` → `cleanup`. Each phase runs its systems from one `useFrame` at that phase's priority. Views keep
their own `useFrame` in phase `view`; they write only their own objects, so their order does not matter. For the sim half, phases are fixed hook points in `step()` (thrust, cap, tick), and the tie
break by `id` makes the order identical on both ends.

### 3.6 Discovery

How does the engine find the modules?

| | Option | Greppable | Load order | Tree-shaking | Dev-only modules | Works on server/shared |
|---|---|---|---|---|---|---|
| **D1** | **Explicit registry array per end** (`sim-features.ts`, `client-features.ts`) | yes: one import per feature | irrelevant (O1 sorts) | remove the line | a second `DEV_FEATURES` array behind `import.meta.env.DEV` | **yes** |
| D2 | `import.meta.glob( './features/*/*.client.ts', { eager: true } )` | weak: no importer names the feature | irrelevant (O1 sorts) | all matches load | a separate glob pattern | **no** (§1.4) |
| D3 | Codegen: a node script scans the folders and writes the D1 registry; lint fails when it is stale | yes (the generated file) | irrelevant | as D1 | as D1 | yes |
| D4 | Self-registration: a module calls `register()` when imported | weak | **import order decides**; owner rejects | poor | side-effect imports | yes |
| D5 | Plugin builder: `app.add( tugFeature )`, plugins may add sub-plugins | yes | as D1 | as D1 | as D1 | yes; this is D1 with a builder API |
| D6 | One pnpm package per feature | yes | irrelevant | best | per-package | yes; 3 build targets each — too heavy |

**Recommendation: D1 now, D3 later.** D2 fails the determinism test: the client would discover by glob
while the server and shared discover by list, and the two lists could differ. D1 keeps both ends on the
same list with one line per feature. When the list passes about 10 features, D3 generates it and a lint
check keeps it fresh. That reaches "add a folder, edit nothing".

### 3.7 Modules talk through traits and events

- A module reads core traits (`Sim`, `Render`, `LocalPlayer`, tags such as `Dead`) and its own traits.
- A module announces through events (§4.3 A) and reads other modules' events. It never imports another
  module's files.
- The contract file is the only public surface. Enforcement options:

| | Option | Notes |
|---|---|---|
| **E1** | **Biome GritQL plugin: an import into `features/<a>/` from `features/<b>/` must end in `.feature` or `.client`** | Biome plugins already run in `pnpm lint` (issue #283). Probe with a temp file under the override includes (memory `biome-stdin-skips-grit-plugins.md`). |
| E2 | TypeScript project references per feature | strong, but many `tsconfig` files |
| E3 | pnpm package per feature with `exports` | as D6 — too heavy |
| E4 | Review rule only | no enforcement |
| E5 | `dependency-cruiser` | not installed; a new tool |

**Recommendation: E1**, plus a rule that the sim half may not import from `apps/`.

### 3.8 Pilot: tug

Tug is a good pilot. It has both halves, a message, a sim hook, a run hook, two views, a glyph, SFX and
dials — every slot in §3.3.

Measure before and after:

| Measure | Before | Target | How |
|---|---|---|---|
| Central files a feature edits | 19 (§1.8) | ≤ 2 registry lines | `rg -il tug` outside the two folders |
| Wire order | — | existing field indexes unchanged; client-decoded state matches | registry index test + `run-room.test.ts` |
| `step()` time per tick | [to measure] | no regression beyond noise | in Chrome with a CDP CPU throttle (memory `time-hot-loops-in-chrome-not-tsx.md`) |
| Frame time on `/test-level` | [to measure] | no regression beyond noise | `perf-analysis` skill |
| Determinism | `room-tug.test.ts`, `tug-run.test.ts`, `tug.test.ts` pass | same tests pass unchanged | `pnpm test` |
| Order is declared | — | a test shuffles the registry and gets the same schedule | new unit test |

The owner decides go / no-go on the numbers before any other feature moves.

## 4. Net, input, client state, room config (workertwo)

Measured on `dev` at `4b58658` (§4.1–4.3) and `a25b332` (§4.4–4.5). Installed versions, read from the
`package.json` files: `@colyseus/schema` **4.0.30**, `@colyseus/core` **0.17.47**.

### 4.1 Event queues (measured)

| Shape | Files | Overflow rule |
|---|---|---|
| `pushX` / `drainX` functions | `game/scene/hit-events.ts`, `mine-shock-events.ts`, `tug-events.ts` | `hit-events.ts:8,12` — `MAX_QUEUED = 32`, then `queue.shift()`: drops the **oldest** |
| Exported `pending` array | `block-burst.state.ts:3`, `meteor-chunks.state.ts:3`, `meteor-scorch.state.ts:3` | `block-burst.utils.ts:9` — `if ( pending.length < SLOTS ) pending.push(…)`: drops the **newest** |
| Direct write into shared state | `blockWorld.portals` (`attach-room-to-world.ts:261`), `confirmBreak` (`:276`), `markPickup` (`:272`) | none. This is state, not events. |

Each queue has one consumer, for example `hit-spark.tsx:25` — *"`drainHits( onHit )`"*. A drain empties
the queue. A second reader would see nothing.

Power-ups do not use the input stream. They are separate messages: `game/net-canvas.tsx:58` —
*"`room.send( USE_POWERUP_MESSAGE, { slot, dir, seq: lastInputSeq() } )`"*.

### 4.2 Problems

Folded into §2 (ranks 2, 4, 5, 7, 9, 10, 11).

### 4.3 Options

Criteria: correctness · one clock vs many · re-render cost · idiom fit · reuses the existing loop.

#### A. Event queues — the module-to-module channel

| # | Option | Correctness | Clocks | Re-renders | Idiom fit | Existing loop |
|---|---|---|---|---|---|---|
| A1 | One typed helper `createEventQueue<T>( cap, overflow )`. All 6 queues use it. | Good. Fixes the overflow split. Still single-consumer. | one | none | good: keeps today's shape | yes |
| A2 | koota event entities; a cleanup system destroys them at frame end | Good. Many consumers in one frame. | one, if §5 fixes the cleanup phase | none | good: ECS-native | yes; needs §5 |
| A3 | World trait with one ring buffer per kind and a read cursor per consumer | Best. Many consumers, bounded, no allocation. | one | none | medium: custom cursor code | yes |
| A4 | Synchronous callback bus from `onMessage` | Risky. Handlers run inside Colyseus decode. | many | none | low | no |
| A5 | Derive events from a per-tick state diff | Good for state-backed events (breaks, pickups). Cannot carry transient hits. | one | none | medium | yes |
| A6 | koota change observers (`world.onAdd` / `onChange`) | Good | runs at write time, not frame time | none | good | partly |

**Recommendation: A1 now, then A3.** Feature modules need many consumers per event (a tug hit feeds the
rope view, the SFX and the HUD). A3 gives that. A module declares the event types it emits in its contract;
the engine creates one ring per type. Break and pickup events use A5, because they are state (§6.1).

#### B. Room config (#70, #23): three tiers, locked at GO

- **Rules**: `SimConfig` plus ship tuning. `simulate()` reads them, so both ends must match. Sync and lock at GO.
- **Track gen**: already synced in `TrackDescriptorState`. Extend it under the same lock.
- **Look**: client-only. It never affects the sim.

| # | Option | Correctness | Late join | Mid-round later (#70) | Wire cost | Idiom fit |
|---|---|---|---|---|---|---|
| B1 | One schema field per tunable on a `RulesState` | good; floats go through `fround` (`SIM_FLOAT_KEYS`) | free | hard: schema grows per dial | deltas | Colyseus-native; schema churn |
| **B2** | **Preset id + sparse override map** (`@type('string') preset`, `@type({ map: 'float32' }) overrides`), merged over the defaults on both ends | good, if keys are validated | free | easy: store the merged config per tick in the replay buffer | small | good: same shape as `tunedSimConfig()` |
| B3 | Preset id only, registry in `@slur/shared` | good | free | poor | minimal | good |
| B4 | JSON string + version hash | good if parse and `fround` match | free | medium | whole blob per change | low |
| B5 | One-shot message at join and at GO | risky: reconnects need a resend | manual | medium | small | low |
| B6 | HTTP fetch in the route loader before join | risky: races with GO | manual | poor | small | medium |

**Recommendation: B2.** With feature modules, the defaults are the merge of every sim feature's `rules`,
under its `id` namespace (`tug.pullS`). A new feature adds config without touching `sim-config.ts`. The
server rejects writes to `preset`/`overrides` when `phase !== lobby`. The client holds the merged config as
a `RunConfig` world trait, and every `simulate()` call reads it. That removes rank 2. The #70 ADR still
decides the scope (combat only, or ship tuning too).

Each feature declares its Rules with one `defineRules` spec (§4.5 c4). The spec drives the defaults, the
server clamp and key check for B2 overrides, and the dev dials. Override values travel as float32. The
server must merge the **fround-ed** value too, or the server and the predictor differ in the last bits
(memory `fround-makes-float-asserts-fail.md`).

#### C. Discrete input

Today gamepad and touch send fake DOM `keydown`s (`game/input/synth-key.ts:2`), and `power-select.ts:65–78`
reads `e.code`.

| # | Option | Correctness | Clocks | Re-renders | Idiom | Existing loop |
|---|---|---|---|---|---|---|
| C1 | Keep synthetic DOM keys. | Dev keys also see fake keys. | DOM events | none | low | no |
| **C2** | **Module action map:** `type Action = 'fireForward' \| 'fireBack' \| 'next' \| 'previous' \| 'drop' \| 'mute'`, one binding table per device (`{ keyboard: { KeyE: 'fireForward' }, pad: { 2: 'fireForward' } }`). Sources call `press( action )`. One consumer runs the power actions. | Good. One table drives remapping and on-screen hints. | event time | none | good | keyboard: DOM; pad: its `addEffect` |
| C3 | Action edges as bits in `PlayerInput` (sequence-numbered). Drop `USE_POWERUP_MESSAGE`. | Best: the server applies the action at the exact tick. Today the message carries only `seq: lastInputSeq()` (`net-canvas.tsx:58`). | one: the sim tick | none | good (netcode) | yes |
| C4 | A koota input entity with per-frame action tags (§6.1). Systems query them. | Good | frame | none | good if tags are adopted | yes |
| C5 | A third-party input-mapping library. | unknown | its own | unknown | new dependency | no |
| C6 | Each device calls the power actions directly (no map). | OK | mixed | none | low: binding logic repeated 3 times | no |

**Recommendation: C2 now** (§7 S2). It is the base for #348 (Blur controls), which today must rebind keys
in three places. **C3 later**, under a netcode ADR.

### 4.4 The net half of a feature module: facts (measured)

1. **The client decodes by reflection.** `net/matchmaking.ts:65,70,75` joins with `joinOrCreate< RunState >`
   / `create< RunState >` / `joinById< RunState >`. It passes only the type argument, no root Schema class.
   So the client takes field order from the server handshake. Field order must be deterministic **on the
   server only**, and it must never depend on import side effects.
2. **Dynamic declaration exists.** `@colyseus/schema/build/annotations.d.ts:76` — *"`export declare function
   defineTypes(target: typeof Schema, fields: Definition, options?: TypeOptions): typeof Schema;`"* and
   `:108` `schema( fieldsAndMethods, name?, inherits? )`. Both are exported from `build/index.d.ts:20`.
   `defineTypes` calls `type()` for each field in turn (`build/index.mjs:3589–3593`), and the index is the
   next free one (`src/Metadata.ts:202–206`). **Call order = wire order.**
3. **At most 64 fields per Schema class** (`src/Metadata.ts:73–74`). The guard is `index > 64`, so index 64
   passes but collides with the DELETE bit (§3.4). Fields today: `PlayerState` 39,
   `RunState` 14, `Portal` 10, `Seeker` 9, `TrackDescriptorState` 8, `Projectile` 6, `Mine` 5 (re-counted by
   workerone this session).
4. **The sim reads feature fields flat off the ship.** Tug writes `tugTimer`, `towTimer`, `tugAnchorZ` on
   `PlayerState` (`schema.ts:51,53,54`), and `simulate()` reads the same names on `SimShip`. Prediction
   copies and rounds by key list: `packages/shared/src/sim/types.ts:83` `SIM_SHIP_KEYS`, plus
   `SIM_FLOAT_KEYS` (a test asserts it matches the float32 fields, `sim/fround.test.ts:27`).
5. **Colyseus 0.17 has a declarative message table.** `@colyseus/core/build/Room.d.ts:174` —
   *"`messages?: Messages<any>;`"*, and `:51` `validate( format: StandardSchemaV1, handler )`. We do not use
   it: the server registers 8 handlers by hand (`apps/server/src/rooms/run-room.ts:88–101`). `validate()`
   needs a Standard Schema library. No workspace `package.json` lists `zod` or `valibot`; valibot 1.4.2 is
   present only as a transitive package.
6. **Message names are spread over 8 shared files.** 22 `*_MESSAGE =` constants
   (`rg "_MESSAGE = " packages/shared/src`), for example `combat/constants.ts` (9) and
   `combat/tug-constants.ts:1`. The client binds 7 of them in one function
   (`attach-room-to-world.ts:258–288`).
7. **Tug config is flat and duplicated.** `sim-config.ts` holds 64 flat fields, including `tugS` and
   `towS`. Only `run/tug-run.ts` reads `config.tug*` / `config.tow*` (5 reads). `dev/tuning-schema.ts`
   repeats 8 `Tug.*` dials with their own min/max (`:118–125`).

### 4.5 The net half of a feature module: options

Criteria: correctness (wire order, determinism) · central files per new feature · type safety · idiom fit
(Colyseus 0.17, schema 4) · migration cost.

#### a. Messages and handlers

| # | Option | Correctness | Central edits per feature | Types | Idiom | Migration |
|---|---|---|---|---|---|---|
| a1 | Today: constants in shared; `onMessage` in `run-room.ts` and `attach-room-to-world.ts`. | OK | 3 files | manual | Colyseus classic | none |
| a2 | The feature exports `messages: { 'tug/pull': { server?, client? } }`. The engine loops the registry and calls `room.onMessage` on both ends. Names are namespaced by feature id. | OK. The registry build catches name clashes. | 0 | from the feature's types | good | medium: move 22 constants |
| a3 | The feature exports a table that the engine spreads into the 0.17 `messages = { … }` (`Room.d.ts:174`), with `validate( schema, handler )`. | Best on the server: payloads are validated. | 0 | inferred from the validator | best (installed API) | needs a direct Standard Schema dependency; client side as a2 |
| a4 | One envelope message `'f'` carrying `{ m: id, p }`, with our own dispatch. | OK | 0 | manual | low: hides message types from Colyseus tools | medium |
| a5 | Transient events move into state (a `MapSchema` of events per feature, with a TTL). | Good for late joiners. | 0 | schema | medium: more bytes, stale-event cleanup | high |
| a6 | Features emit typed events through the existing `ctx.broadcast` (`run/combat.ts`). One generic transport maps event → message. The client registry maps message → feature handler. | OK | 0 | event union type | good: reuses the `RunSim` seam; the loopback room gets it free | low–medium |

**Recommendation: a6 for server → client events, a3 for client → server commands** once the owner approves
a validator dependency (§8 Q7). a2 is the fallback without a validator.

#### b. Schema fields

| # | Option | Wire order | Central edits | Types | 64-field cap | Fits the flat `SimShip`? |
|---|---|---|---|---|---|---|
| b1 | Today: every field in `schema.ts`. | static, safe | 1 file | decorators | shared by all | yes |
| b2 | Child Schema per feature (`TugPlayer`); one static `@type( TugPlayer ) tug` line in `schema.ts`. | static, safe | 1 line | decorators | 1 slot per feature | **no**: `ship.tug.timer`; deep copy in `copySimShip` / `froundSimShip` |
| b3 | The registry attaches child Schemas at boot: `defineTypes( PlayerState, { [ f.id ]: f.PlayerSchema } )`. | safe **only if** it runs before the first `new PlayerState()` | 0 | module augmentation | 1 slot per feature | no, as b2 |
| b4 | The registry adds **flat** fields: `defineTypes( PlayerState, f.playerFields )`, and builds the key lists. | as b3 | 0 | module augmentation | shared | yes |
| **b5** | **Compose:** `schema( { ...core, ...tug.fields, … }, 'PlayerState' )`. Spread order = wire order. | safe; order is one visible expression | 0–1 (the spread list comes from the registry) | **inferred** (`InferSchemaInstanceType`) | shared | yes; key lists from the same object |
| b6 | A generic map per ship: `@type( { map: 'float32' } ) feat`, keyed `'tug.timer'`. | safe | 0 | lost (strings) | none | poor: map lookups in the hot sim; float32 only; a string key per entry on the wire |

**Recommendation: b5** (§3.4). Room-level collections (mines, seekers, portals) are already child Schemas,
so b5 fits `RunState` too. b3 and b4 work, but they depend on boot-order side effects and type augmentation.

#### c. Rules defaults as a namespace in the B2 overrides map

| # | Option | Determinism | Central edits | One spec for defaults, validation and dials? | Migration |
|---|---|---|---|---|---|
| c1 | Today: flat `SimConfig` with prefixed names (`tugS`, `towS`); dials repeated in `tuning-schema.ts`. | OK | 2–3 files | no: defaults and dials drift | none |
| c2 | Nested `SimConfig = { tug: TugRules, … }` composed from the registry. The override key `'tug.pullS'` is a path. | OK | 0 | only with c4 | medium: every `config.x` reader moves (tug: 5 reads) |
| c3 | Flat in memory, namespaced on the wire only: `'tug.pullS'` ↔ `config.tugPullS` through a key table from the registry. | OK | 0 | only with c4 | low: no reader changes; two names per value |
| **c4** | **One rules spec per feature:** `defineRules( 'tug', { pullS: { value, min, max, step } } )`. The engine builds the default config, the server clamp and key check for B2, and the dev dials. | best: the server rejects unknown keys and clamps | 0 | **yes** | medium: removes the 8 duplicated `Tug.*` dials |
| c5 | One override map per feature in the schema: `@type( { map: 'float32' } ) tug`. | OK | 0 with b5 | only with c4 | medium: more fields; the GO lock checks each |
| c6 | Named presets only (`'standard-v3'`), no per-key overrides. | best | 0 | n/a | low, but #70 loses per-key tuning between rounds |

**Recommendation: c4 as the spec, c2 as the in-memory shape for new features, c3 as a bridge** so existing
flat readers work during the migration. The server rejects override writes when `phase !== lobby`.

## 5. Render, frame schedule, quality tiers (workerthree)

Measured 2026-09-28 at `07e6c95`. R3F facts come from the installed `@react-three/fiber` 9.7.0,
`dist/events-156d8d12.esm.js` (workerone re-checked lines 1129, 16171 and 16188 this session). The full
per-site table (265 lines) is in workerthree's scratchpad `useframe-inventory.md`. This section keeps the
facts that drive a decision.

### 5.1 Current map

**How R3F orders a frame** (verified):

| Step | Source | Behaviour |
|---|---|---|
| 1 | `loop()` `:16188` — *"`flushGlobalEffects('before', timestamp)`"* | `addEffect` callbacks, in `Set` insertion order |
| 2 | `update()` `:16165–16168` | `useFrame` subscribers in array order |
| 3 | `update()` `:16171` — *"`if (!state.internal.priority && state.gl.render) state.gl.render(...)`"* | auto-render, only when no subscriber has priority > 0 |
| 4 | `loop()` `:16204` | `addAfterEffect` callbacks |

The subscriber array is sorted by priority on each subscribe — `:1129` *"`internal.subscribers.sort((a, b)
=> a.priority - b.priority)`"*. The sort is stable, so equal priorities keep **subscribe order**. A
subscribe happens in a layout effect — `:1229` *"`useIsomorphicLayoutEffect(() => subscribe(ref,
renderPriority, store), …)`"*. So priority-0 order is **the time a component mounted**, not its JSX
position. A component that mounts later (a ship that spawns, a `QualityGate` that flips) goes to the end of
its priority band.

**Inventory.** 46 `useFrame` sites and 8 `addEffect`/`addAfterEffect` calls in 7 files.

| Priority | Sites |
|---|---|
| −1 | `game/scene/nebula-sky.tsx:11` (sky bake + uniforms) |
| 0 | 39 sites, one of them explicit (`dev/frame-tap.tsx:9`) |
| 0.25 `AFTER_RENDER_SYNC` | `engine-light.tsx:15`, `exhaust-field.tsx:40`, `boost-streaks.tsx:33`. The constant is defined 3 times: `engine-light.constants.ts:1`, `exhaust-field.constants.ts:7`, `boost-streaks.constants.ts:6` |
| 0.5 `PASS_PRIORITY` | `rear-view-pass.tsx:27`, a full scene render into an FBO (`:34–37`) |
| 1 | `plain-render.tsx:5` **or** the `EffectComposer` internal pass (`@react-three/postprocessing` default `renderPriority = 1`) |
| 2 `HUD_PRIORITY` | drei `<Hud>` for the rear panel (`rear-view-pass.tsx:41`) |
| before | `net/loopback-room/loopback-room.ts:108` (loopback sim tick), `game/input/gamepad.ts:87`, HUD DOM writers `game/hud/flight-readout.tsx:23`, `race-deadline.tsx:12`, `idle-warning.tsx:12`, `game/overlays/threat-hud/threat-hud.tsx:13`, `dev/frame-meter.ts:17` |
| after | `dev/frame-meter.ts:21` |

Other per-frame hooks: drei `PerformanceMonitor` has its own `useFrame`
(`drei/core/PerformanceMonitor.js:38`). `nebula-baker.ts:165` sets `background.onBeforeRender`. The input
send is a 30 Hz `setInterval` (`net/attach-room-to-world.ts:293`).

**System or view.** A *system* writes state that other code reads (ECS, camera, renderer, audio, a queue,
a shared material, `scene.environment`). A *view* animates only its own objects from state.

| Class | Count | Sites |
|---|---|---|
| System | 13 `useFrame` + 3 `addEffect` | `NetLoop`, `DeckLoop`, `LandingRig` (camera + `Sim`/`Render` writers, one per route) · `SceneEnvironment` · `RenderScale` · `RockField` (shared material) · `NebulaSky` · `RearViewPass` · `SceneEffects`/`PlainRender` · `GameAudio`, `RemoteEngineAudio` · `TestLevelDev` · addEffect: loopback tick, gamepad, frame meter |
| Dial-sync | 6 | `KeyLight`, `TrackSeams`, `TrackRail`, `TrackRim`, `TrackFloor`, `MonolithGroup` (×N). Each copies tuning into its own material every frame |
| View | 27 | the rest, plus the 4 HUD DOM writers |

**Cost** (CDP Profiler, `/test-level`, driving, 1280×720, DPR 1, Vite dev build; rAF callback time, median):

| Tier / CPU throttle | Total | three.js | app `useFrame` code | shared sim | koota |
|---|---|---|---|---|---|
| high, 1× | 1.60 ms | 1.05 | 0.08 | 0.07 | ~0.05 |
| low, 6× | 5.70 ms | 2.98 | 0.55 | 0.17 | 0.26 |
| high, 6× | 10.10 ms | 6.54 | 0.61 | 0.23 | 0.33 |

Draw calls per frame: low 47, medium 125, high 125. `bindFramebuffer` per frame: 0, 26, 36. The rear view
and the post passes cause most of the gap [inferred; not bisected]. GPU time per tier [unmeasured].
Production build [unmeasured].

**Reading:** app frame code costs less than a tenth of three.js. The schedule is a correctness and
dev-speed problem, not a CPU problem.

### 5.2 Frame schedule

#### Order hazards today (read from source)

1. **Camera readers run before the camera writer.** `NetLoop` writes the camera at
   `game/net-loop/net-loop.tsx:35` — *"`updateNetCamera( state.camera as PerspectiveCamera, world, delta,
   room, phase, cut )`"*. It mounts in `{ children }` after `<Ships />` (`game/scene/world-scene.tsx:34–35`).
   `SkyFollow`, `NearFill`, `AsteroidBand`, `MeteorScorch`, `MeteorChunks` and `BlockDebris` mount earlier
   in the same band, so they read last frame's camera: a one-frame lag between them and the ship.
2. **`Sim` readers run before the `Sim` writer.** `TrackBlocks` (`track-blocks.tsx:100`) and `MeteorStrikes`
   (`meteor-strikes.tsx:79`) read `queryFirst( LocalPlayer, Sim )` before `netFlightSystem`
   (`net-loop.tsx:26`) runs.
3. **Ship views depend on spawn time.** `Ships` (`ships.tsx:7`) mounts one `ShipView` per `Render` entity.
   A ship that spawns after `NetLoop` subscribed goes to the end of band 0 [inferred from `:1229`; spawn
   timing not traced]. So ship views read fresh or stale `Render` by arrival time.
4. **A quality change reorders the frame.** `QualityGate` unmounts and remounts its children, which
   re-subscribe at the end of the band. After a step-down, `RockField` runs after `NetLoop` [inferred].
5. **The HUD shows last frame.** The 4 HUD DOM writers are `addEffect` (step 1), so they run before
   `NetLoop`.
6. **Two input clocks.** The 30 Hz send is not tied to the 60 Hz fixed step (§2 rank 10).

The one fix in place: `AFTER_RENDER_SYNC = 0.25` pushes 3 views past `NetLoop`. The name is wrong (they run
before render), and the value is copied 3 times.

#### The phases

| # | Phase | Runs | Examples today |
|---|---|---|---|
| 1 | `input` | sample devices into the action map (§4.3 C) | `gamepad.ts:87` poll |
| 2 | `simulate` | loopback host tick; fixed-step predict; **input send after `predictor.record`** (§7 S8) | `loopback-room.ts:108`, `netFlightSystem` |
| 3 | `sync` | render interpolation, remote interp, hover, death VFX, **camera last** | rest of `NetLoop`, `DeckLoop`, `LandingRig` |
| 4 | `react` | systems that react to this frame's state: event drain, audio, shared-material and `scene.environment` writes, dial sync | `GameAudio`, `SceneEnvironment`, `RockField`, the 6 dial-sync sites |
| 5 | `view` | every view; no order inside the phase | 27 views |
| 6 | `prerender` | off-screen passes that read the final scene | `NebulaSky` bake, `RearViewPass` |
| 7 | `render` | exactly one main render | composer or `PlainRender` |
| 8 | `overlay` | layers on top of the main render | drei `Hud` |
| 9 | `cleanup` | end of frame: event cleanup (§4.3 A2/A3), HUD DOM writes, frame meter | `frame-meter.ts:21` |

Event cleanup (§4.3 A2/A3) runs in `cleanup`. The input send (§7 S8) runs in `simulate`, once per fixed
step, after `predictor.record`.

#### Options — how a system gets its place

Criteria: correctness · one clock · re-render cost · idiom fit · reuses the existing loop · order is
declared (owner rule).

| # | Option | Correct | One clock | Idiom | Declared | Notes |
|---|---|---|---|---|---|---|
| **O1** | **Phase + `before`/`after`, topo-sort at boot, tie-break by system id.** One `useFrame` per phase runs the sorted list | yes | yes: R3F loop | good: Bevy-plugin shape (§3) | yes | ~80 lines. A cycle fails at boot and names the cycle |
| O2 | Numeric priority per system | until two teams pick the same number | yes | medium: today's `0.25`/`0.5` | magic numbers | 3 copies of `0.25` already |
| O3 | Registration or import order | no: today's bug class | yes | low | **no** | the owner rejects it |
| O4 | One central ordered list of every system | yes | yes | low: every feature edits one file | yes | merge conflicts between workers |
| **O5** | Phase only, no order inside a phase | only if no two members share data | yes | good | partly | right for **views**; wrong for `sync` (camera must be last) |
| O6 | Order derived from declared trait reads/writes | if every access is declared | yes | high in theory | implicit | camera, audio and renderer are not traits; most machinery for the least gain |
| O7 | `directed` (npm 0.1.6): a DAG scheduler with `before`/`after`/tags, by the koota author | yes | yes | good | yes | pre-1.0; last publish 2025-02-28 (npm, verified by workerthree). Its React hook `useSchedule` registers on mount, which brings back mount-time order |
| **O8** | Keep `useFrame` per component; one priority constants file per phase | phase order only | yes | good: smallest change | partly | the cheap first stage, not the end state |

**Recommendation: O1 for systems, O5 for views, O8 as the first stage.**

- A **system** declares `{ phase, before?, after? }` in its feature module. The engine sorts once at boot:
  phase, then topological order, then system id. One `useFrame` per phase runs that phase's list. A system is
  a plain function over `( world, frame )`. It never mounts, so a remount cannot reorder it.
- A **view** stays a component with `useFrame( cb, PHASE.view )`. Views never read each other.
- **Not O7:** a pre-1.0 dependency for ~80 lines is poor value. Its API shape is a good model, and it stays
  the fallback if our scheduler grows tags.
- **Not O6:** it is O1 with more to declare. It can come later as a dev-only check that a declared order
  does not contradict trait access.

In dev, the engine prints the resolved order, one line per system.

### 5.3 Render pipeline: who owns `gl.render`

Today three code paths call `gl.render` in a frame: `RearViewPass` (`rear-view-pass.tsx:36`), the composer
or `PlainRender` (`plain-render.tsx:5`), and drei `Hud`. `QualityGate feature="post"` picks the composer or
`PlainRender` by mount (`world-scene.tsx:36`). A `useFrame` priority > 0 turns off auto-render, so removing
the composer without `PlainRender` gives a black canvas (#345; memory
`removing-the-composer-blacks-the-canvas.md`).

| # | Option | Notes |
|---|---|---|
| P1 | Keep today: render by mount, gated by `QualityGate` | a remount reorders the frame (hazard 4); two components compete for one job |
| **P2** | **One render system in phase `render`.** It owns the composer and calls `composer.render()` or `gl.render()` by the current tier | one owner; a tier change is a branch, not a remount |
| P3 | R3F auto-render; composer only when post is on | auto-render stops when any priority > 0 exists; fragile |
| P4 | Each feature renders its own pass | many owners; no single pass order |
| P5 | A render graph (named passes with inputs and outputs) | right at 10+ passes; we have 4 |

**Recommendation: P2.** A feature module may register:

- **a post effect**, as `{ effect, slot }` in a fixed slot list: `beforeBloom` · `bloom` · `afterBloom` ·
  `beforeToneMap`. Today: `BoostBlur` before bloom, `Bloom`, `ToneMapping` last. The render system builds the
  chain once and rebuilds it on a tier change.
- **an off-screen pass**, as a system in `prerender` (rear view, sky bake).
- **an overlay**, as a system in `overlay` (the rear panel).

A feature never calls `gl.render` for the main frame.

### 5.4 Quality tiers

`quality/quality.constants.ts` `PROFILES` has 10 knobs. They act at three different times:

| When | Knobs | Where | Problem |
|---|---|---|---|
| Mount (a `QualityGate`) | `post`, `rocks`, `rearView` | `world-scene.tsx:36`, `game-environment.tsx:13`, `rear-view.tsx:12` | a remount reorders the frame (hazard 4) |
| Every frame (`qualityProfile()`) | `dprCap`, `msaa`, `skyMotion` | `dev/render-scale.utils.ts:8`, `scene-effects/scene-effects.utils.ts:8`, `nebula-baker.ts:202` | none |
| Build time only | `skyFace`, `noiseSize`, `surfaceRes` | `nebula-baker.ts:80`, `nebula-noise-volume.ts:52`, `track-texture.ts:15` | a mid-race step-down does not change them |

Step-down: `QualityStepDown` = drei `PerformanceMonitor` → `stepDownQuality`
(`game/quality-step-down/quality-step-down.tsx:6`). Only `game/game-shell.tsx:11` mounts it, so
`/test-level` never steps down.

| # | Option | Notes |
|---|---|---|
| Q1 | Keep today | three timings, one of them silent |
| **Q2** | **Quality is a service (§6.1 rule C, item 5). A feature module declares a `quality` hook: `( profile ) => settings`. One `react`-phase system applies a tier change once, on the frame it happens** | one place per change; no remount |
| Q3 | Tier as a world trait; views subscribe with `useTrait` | one re-render per tier change (rare), but keeps mount-time gating |
| Q4 | Per-feature budget (ms or draws) and an auto-tuner | needs GPU timing we do not have [unmeasured] |
| Q5 | Only a reload applies a tier | simple; bad mid-race |

**Recommendation: Q2.** A gated feature does not unmount. Its systems and views stay registered, and its
hook turns it off (`visible = false`; the system returns early). A build-time knob rebuilds its resource on
a tier change, or the profile marks it `reload-only` and the UI says so (§8 Q9). `QualityStepDown` moves to
the shared canvas shell, so `/test-level` and the game behave the same.

### 5.5 Perf hooks

The scheduler gives per-system timing. In dev it wraps each system in `performance.now()` and keeps a
rolling median per system and per phase. `dev/frame-meter.ts` reads it. The wrap is dev-only, so production
pays nothing. GPU time per phase needs `EXT_disjoint_timer_query_webgl2` [not on every device;
unmeasured]. Until then the `perf-analysis` skill's readPixels-synced median stays the GPU number.

### 5.6 Problems and stages

Problems are ranked in §2 (ranks 3, 6, 10, 14). Two details not in §2:

- Per-frame allocation: about 25 koota `query`/`queryFirst` calls per frame (koota 0.6.6 copies the result);
  `track-blocks/track-blocks.utils.ts:49` makes one object per sealed block per frame;
  `game/ecs/net-systems.ts:41` spreads the input each step.
- Dial-sync: the 6 components write even when nothing changed.

Stages are S14–S21 in §7.

## 6. State and code organisation inside a module

### 6.1 Entities and state

Where does a piece of client state live: a koota entity, a trait, a world trait, or a module singleton?

Verified this session in the installed koota 0.6.6: **world-level traits** exist — `World.add / get / set /
has` (`koota/dist/types-DONaXEhM.d.ts:441–460`). React hooks accept a world as the target —
`useTrait( target: Entity | World | …, trait )` and `useTraitEffect( target: Entity | World, … )`
(`koota/dist/react.d.ts:26,28`).

| | Option | Correctness | One clock | Re-render cost | Idiom fit |
|---|---|---|---|---|---|
| A | Keep both models; write the rule down only | same as today | no change | no change | low: rank 8 stays |
| B | Everything into koota, including room, audio and input devices | risk: services with lifetimes become traits | yes | low | low: NN-8 keeps services on module singletons |
| **C** | **Split by kind:** per-thing data → entities and tags; per-run state → world traits; services → module singletons | good: one home per kind; one reset | yes | low | high: `ecs.md` rules 1, 3, 5 and NN-8 |
| D | zustand for global state, koota for entities | good | two subscription systems | low | medium: duplicates world traits |
| E | Read Colyseus state directly in systems | risk: render couples to the wire schema | yes | low | low: breaks `ecs.md` rule 5 |
| F | Swap to miniplex | no gain | — | — | low |

**Recommendation: C.** The rule:

1. A thing with a position or a lifetime in the race (ship, projectile, seeker, mine, pickup, hazard) is an
   **entity**.
2. A state of that thing is a **tag or trait on it**, never a value branch: `Dead`, `Stunned`,
   `Spectating`, `Shielded`, `Boosting`. The bridge adds and removes them.
3. Game state for the whole run (phase, spectator target, standings, the block world, the run config) is a
   **world trait**. Components subscribe with `useTrait( world, T )` or `useTraitEffect`.
4. **One run reset.** On run end or room leave, one function removes per-run world traits and destroys the
   run's entities, then calls each feature's `run.reset`. Nothing else holds per-run state.
5. A service with its own lifetime (Colyseus room, audio engine, input devices, dev tools, quality store)
   stays a **module singleton** (NN-8).
6. Scratch objects and VFX pools for one component stay in that component's files. They are not state.
7. Events carry an entity reference, not a session-id string.
8. The server keeps plain `simulate()` on `RunSim`, no koota. The 16-world cap is not the reason (12 rooms
   fit). The reasons: the sim half already runs without an ECS, CLAUDE.md fixes it, and a leaked world id
   would fail room creation.

Mapping of today's state:

| Today | Target |
|---|---|
| `Sim.dead`, `stunTimer`, `Shield` values | tags `Dead`, `Stunned`, `Shielded` |
| `localRole.spectating` (`spectator.ts:3`) | tag `Spectating` on the local ship |
| `runPhase`, `spectatorCam` (`spectator.ts:5,7`) | world traits `Phase`, `SpectatorTarget` |
| `standings-store.ts`, `run-view-store.ts` | world traits |
| `blockWorld` + `confirmedBroken` (`block-state.ts`) | world trait `Blocks` holding the `SimWorld`; `simulate()` still takes it as a parameter |
| pickup `taken` set | pickup entities with a `Taken` tag, spawned once per track from the descriptor |
| `power-select.ts` `selected` | world trait `PowerSlot`; the run reset clears it (fixes `resetSlot()`) |
| `lobby-store`, `chat-store`, `connection-status`, `ship-choice` | stay module stores (outside the race loop) |
| audio, input devices, dev panels, quality | stay module singletons |

### 6.2 Constant tiers

| Tier | Examples | Owner | Changes when |
|---|---|---|---|
| **Rules** | sim config, ship classes, pickup and combat numbers | server, per room (§4.3 B) | locked at GO |
| **Track gen** | ADR-006 envelope, slalom, pacing | server, per room, in the descriptor | locked at GO |
| **Look** | colours, bloom, materials, nebula | client | any time; never affects the sim |
| **Dev** | tunables panel | client, dev only | any time; overrides one tier above |

A value that `simulate()` reads is Rules or Track gen and lives in a sim half. The client never holds a
second copy. A feature's Rules and Look constants live **in its own module**. A dev dial that overrides a
Rules value goes through the B2 `overrides` map, so the server and the predictor both see it.

Look constants that no feature owns (track, sky, post):

| | Option | Notes |
|---|---|---|
| A | Keep today: colocated `*.constants.ts` and `*-look.ts` | fine for one-component values |
| B | One `look/` module per subsystem | one place per look review |
| C | One global `look.ts` | merge conflicts between workers |
| D | Look values in the dev tunables schema only | the panel becomes the source of truth |
| E | JSON data files loaded at boot | adds a fetch; no types without codegen |

**Recommendation: A + B.** A constant for one component stays colocated (NN-9). A constant read by two or
more components moves to its subsystem's `look/` module. Dials read their defaults from there.

### 6.3 Folder layout

- Features: `apps/client/app/features/<name>/` and `packages/shared/src/features/<name>/`. Inside a
  feature, NN-9 folders hold each component.
- Engine: `apps/client/app/engine/` (scheduler, registry, `FeatureViews`, bridge, run reset).
- The world that no feature owns stays under `game/scene/`, grouped as `track/`, `ships/`, `sky/`, `post/`.
- ls-lint needs rules for the new sub-extensions `.feature.ts` and `.client.ts` (memory
  `ls-lint-skips-unlisted-sub-extensions.md`). Moves use node `fs` (memory `bulk-move-without-git-mv.md`).
  Import fixes use `ast-grep` or ts-morph (NN-15).

## 7. Staged migration

Each stage merges alone. No stage blocks a feature lane. "Needs" lists hard dependencies only.

| Stage | Change | Files | Needs |
|---|---|---|---|
| S0 | Write the module contract (§3), rule C (§6.1) and the tiers (§6.2) into the conventions. No code. | `conventions/ecs.md`, new `conventions/features.md`, `.claude/rules/*`, `CLAUDE.md` | owner approval |
| S1 | One config source on the client. The predictor and client systems read the room's config. Fixes `/test-level` mispredicts. | `net/prediction.ts`, `game/ecs/systems.ts`, `game/ecs/net-systems.ts`, `routes/beat-deck/deck-flight.ts`, `routes/test-level/test-level-room.ts`, `net/run-room-like.ts` | — |
| S2 | Input action map (`fireForward`, `fireBack`, `next`, `previous`, `drop`, `mute`). Delete `synthKey`. Base for #348. | `game/input/power-select.ts`, `gamepad.ts`, `synth-key.ts`, `touch-dpad.constants.ts`, `game/net-canvas.tsx`, `audio/game-audio/game-audio.tsx` | — |
| S3 | Event-queue helper (A1). Move the 6 queues onto it. One overflow rule. | `hit-events.ts`, `mine-shock-events.ts`, `tug-events.ts`, `block-burst/*`, `meteor-chunks/*`, `meteor-scorch/*`, new helper | — |
| **F1** | **Engine skeleton.** Registries (D1), `defineSimFeature` / `defineClientFeature`, feature systems fed to the S16 scheduler, `FeatureViews`, bridge loop over `net` handlers, `step()` hook loop. `PlayerState` built with `schema()` from core fields + registry (b5); `SIM_SHIP_KEYS` / `SIM_FLOAT_KEYS` from the same object; a field-index test. Zero features registered; behaviour and wire order unchanged. | new `apps/client/app/engine/*`, new `packages/shared/src/features/registry.ts`, `schema.ts`, `sim/types.ts`, `sim/step.ts`, `run/run-sim.ts`, `net/attach-room-to-world.ts`, `game/net-canvas.tsx` | S0, S16 |
| **F2** | **Pilot: move tug into two feature folders.** Measure per §3.8. | tug's 11 files (moved) + the 19 central files in §1.8 (tug lines removed) | F1 |
| F3 | Owner go / no-go on the F2 numbers. | — | F2 |
| F4… | One feature per stage: bolt, seeker, mine, boost, shield, portal. | that feature's files + the lines it leaves in central files | F3 |
| S4 | Tags `Dead`, `Stunned`, `Shielded`, `Spectating`. Readers switch one at a time. | `game/ecs/traits.ts`, `net/attach-room-to-world.ts`, `game/spectator.ts`, the 13 `.dead` readers | S0 |
| S5 | World traits `Phase`, `SpectatorTarget`, `Standings`, `Blocks`, `PowerSlot` + the one run reset. | `game/spectator.ts`, `game/block-state.ts`, `game/pickup-state.ts`, `game/input/power-select.ts`, `game/net/standings-store.ts`, `game/net/run-view-store.ts`, `net/attach-room-to-world.ts`, `net/prediction.ts` | S0 |
| S6 | Room config (B2). ADR for #70. `defineRules` specs (c4) give defaults, server clamp, key check and dials; c3 bridges flat readers; the server merges fround-ed values. Lock at GO. | `packages/shared/src/schema.ts`, `sim-config.ts`, `run/run-sim.ts`, `apps/server/src/rooms/run-room.ts`, `dev/tuning-schema.ts`, `docs/DECISIONS.md` | S1, F1, ADR |
| S7 | Generic bridge helper `mirrorCollection( schemaMap, spawn, patch )` replaces the 8 maps. | `net/attach-room-to-world.ts` | S4 |
| S8 | Input send on the sim tick: a `simulate`-phase system flushes after `predictor.record`. Delete the `setInterval`. | `net/attach-room-to-world.ts`, `game/ecs/net-systems.ts` | S16 |
| S9 | Event queues move to A3 (world-trait rings, declared per feature). Cursors reset in `cleanup`. | S3 helper and its consumers | S3, S5, F1, S16 |
| S10 | Rename scratch-only `.state.ts` files (e.g. `tug-line.state.ts` → `.scratch.ts`) with an ls-lint rule. | `tug-line.state.ts` and importers, `.ls-lint.yml` | — |
| S11 | Group the world that no feature owns in `game/scene/` (`track/`, `ships/`, `sky/`, `post/`), one per commit. | `game/scene/**` | a window with no held `game/scene/` files |
| S12 | Messages: server → client events through `ctx.broadcast` (a6); client → server commands through the 0.17 `messages` table with `validate()` (a3). | `apps/server/src/rooms/run-room.ts`, `run/combat.ts`, `net/attach-room-to-world.ts`, the 8 files with `*_MESSAGE` constants | F1, validator approval (§8 Q7) |
| S13 | Action edges in `PlayerInput` (C3). Drop `USE_POWERUP_MESSAGE`. | `schema.ts` input, `net/prediction.ts`, `run/combat.ts`, `game/net-canvas.tsx` | S2, S8, netcode ADR |

Frame schedule, render and quality stages (§5, workerthree):

| Stage | Change | Files | Needs |
|---|---|---|---|
| S14 | One phase constants file (O8). Replace `AFTER_RENDER_SYNC` ×3, `PASS_PRIORITY`, `HUD_PRIORITY`, `PLAIN_RENDER_PRIORITY`, `−1`. No behaviour change. | new `game/frame/frame-phase.constants.ts`; `engine-light/*`, `exhaust-field/*`, `boost-streaks/*`, `rear-view-pass/*`, `plain-render/*`, `nebula-sky.tsx` | — |
| S15 | Fix hazards 1–2: camera and `Sim` readers take `PHASE.view` (after `sync`). | `sky-follow.tsx`, `near-fill/*`, `asteroid-band/*`, `meteor-scorch/*`, `meteor-chunks/*`, `block-debris/*`, `track-blocks/*`, `meteor-strikes/*`, ship views | S14 |
| S16 | Scheduler (O1). Split `NetLoop`/`DeckLoop`/`LandingRig` into `simulate` + `sync` systems. Dev order print and per-system timing (§5.5). | new `game/frame/schedule.ts`; `game/net-loop/*`, `routes/beat-deck/deck-loop/*`, `routes/home/landing-rig/*`, `dev/frame-meter.ts` | S14 |
| S17 | Move gamepad, loopback tick and HUD DOM writers from `addEffect` into `input` / `simulate` / `cleanup`. | `game/input/gamepad.ts`, `net/loopback-room/loopback-room.ts`, 4 HUD files | S16 |
| S18 | Render system (P2) with the post-effect slot list. | `game/scene/scene-effects/*`, `plain-render/*`, `world-scene.tsx`, `landing-scene.tsx` | S16 |
| S19 | Quality hooks (Q2). Remove `QualityGate` remounts. Rebuild build-time knobs on a tier change. Step-down in the shared shell. | `quality/*`, `game-environment.tsx`, `rear-view.tsx`, `nebula-baker.ts`, `track-texture.ts`, `nebula-noise-volume.ts`, `game/game-shell.tsx` | S18, §8 Q9 |
| S20 | One dial-sync system (`react` phase) that writes only on a tuning change. | the 6 dial-sync files, `dev/tuning.ts` | S16 |
| S21 | Hoist koota queries with `createQuery` (`koota/dist/index.d.ts:28`). Measure the gain first (§8 Q10). | the ~25 query sites | S16 |

Order: S1, S2, S3, S10 and S14 can start now. S16 (scheduler) unblocks F1, S8, S9 and S17–S21. F1 also
waits for S0.

## 8. Open questions

1. Owner: accept feature modules with the two-half split (§3.2) and the tug pilot (§3.8)?
2. Owner: accept D1 now, D3 later (§3.6)? It means one registry line per feature per end until codegen.
3. Owner: accept O1 ordering (§3.5)?
4. Owner: accept rule C (§6.1) and room config B2 with the four tiers (§4.3 B, §6.2)?
5. Owner (#70 ADR): does room config cover combat only, or ship tuning too?
6. May dev dials override Rules values in a hosted room, or only on `/test-level`?
7. Owner: approve a direct Standard Schema dependency (valibot or zod) for validated commands (a3, §4.5)?
   Without it, commands use a2 and stay unvalidated. (The former Q7, schema without a central edit, is
   answered: yes, by `schema()` composition, §3.4.)
8. Owner: accept the frame plan (§5)? It has nine fixed phases, O1 ordering for systems and phase-only
   ordering for views, and one render system (P2) with a fixed list of post-effect slots. It also makes
   quality a service with per-feature hooks (Q2).
9. Owner: may a tier change rebuild the sky cube and track textures mid-race (one hitch), or should those
   knobs be `reload-only` (§5.4)?
10. Measure before S21: does `createQuery` remove the per-call copy in koota 0.6.6, or only the hash lookup?
