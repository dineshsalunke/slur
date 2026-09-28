<!-- This document follows ASD-STE100 (Simplified Technical English): short sentences, active voice, one
instruction per sentence. See CONTRIBUTING.md §8. -->

# RFC-349 — Architecture: feature modules, ECS drift, server-owned game config

- **Issue:** #349 · **Status:** DRAFT (not approved) · **Lead:** workerone · **Updated:** 2026-09-28
- **Authors:** §1, §3, §6, §7 workerone · §4 workertwo (merged) · §5 workerthree (pending). One voice.
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
- §5 gives the frame phases that systems declare.

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

→ §5. Headline numbers from workerthree: 46 `useFrame` sites (39 at priority 0, 7 explicit) and 6
`addEffect` users [measured by workerthree, not re-measured here].

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

Rank = cost to dev speed plus cost to look/perf work. §5 problems fold in when that section lands.

| Rank | Problem | Evidence | Cost |
|---|---|---|---|
| 1 | **A feature is spread across central files.** Tug edits 19 central files. Mounts, message handlers, sim hooks, glyphs, dials and SFX are hand-wired lists. | §1.8 | Each new power-up re-edits the same 19 files. Two workers on two features collide in them. Removing a feature is a hunt. |
| 2 | **Config has no single owner, and the predictor hard-codes the default.** | §1.3 | Every sim-dial test on `/test-level` shows reconcile snaps that live play does not have. #70 and #23 cannot ship. A deploy can pair an old tab with a new server [inferred]. |
| 3 | **No declared order.** koota has no scheduler; order is `useFrame` call-site order. | §1.1, §5 | A new system's position is a guess. Order bugs show as one-frame lag. |
| 4 | **State has no placement rule and no reset point.** | §1.2 | Each feature re-decides where state goes. Cross-run leaks are real: `resetSlot()` has no caller. |
| 5 | **Discrete input is fake DOM keys.** | §1.5 | #348 must change key codes in three files. Dev-key listeners also receive the fake keys. |
| 6 | **Value flags instead of tags.** `dead` (13 files), `stunTimer`, `localRole.spectating`. | §1.2 | Breaks `conventions/ecs.md` rule 3: *"Model state transitions by adding/removing components … not by branching on values."* |
| 7 | **Six event queues, three shapes, two overflow rules.** Drain is single-consumer and nothing enforces it. | §4.1 | Each new VFX/SFX copies a queue. A second listener silently misses events. |
| 8 | **Two input clocks.** 30 Hz `setInterval` send next to the 60 Hz sim tick. | §1.5 | A send can land on either side of a tick. NN-13 rejects a second clock when a loop exists. |
| 9 | **Hand-rolled stores and bridge boilerplate.** 18 store copies; 8 bridge maps. | §1.1, §1.2 | Boilerplate per store and per networked kind. |
| 10 | **Flat `game/scene/`.** 95 loose files. | §1.6 | Slow to find the owner of a look. Feature modules (§3) dissolve most of it. |

Not a problem today: the koota 16-world cap (§1.4). It only constrains a server ECS, which §6.1.4 rejects.

## 3. Feature modules (central proposal)

### 3.1 Goal and test

A new feature is **one folder per end plus at most one registry line per end**. It edits no other file.
The test is the tug count in §1.8: 19 central files today, **≤ 2 registry lines** after the pilot. Schema
fields are the one known exception (§3.4).

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
    rules: TUG_RULES,
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
    systems: [ { id: 'tug-rope', phase: 'visual', after: [ 'ship-sync' ], run: tugRopeSystem } ],
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
| `rules` | the tug block in `sim-config.ts` and `tuned-sim-config.ts`; keys become `tug.*` in the B2 overrides map (§4.3 B) |
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

### 3.4 The schema exception

Colyseus 4 schema fields are class decorators. Field order is wire order. The memory
`deprecated-breaks-reflection-decoding.md` records that a shifted field index breaks reflection decoding.
So a feature cannot add fields to `PlayerState` by itself without a rule for order.

Candidate: each feature owns a child `Schema` class (for example `TugState` with `timer`, `anchorZ`), and
`PlayerState` holds one field per feature in registry order. That is one central line per feature. Whether
the installed `@colyseus/schema` 4 can declare fields without decorators is **[unverified]** — workertwo
checks the installed `.d.ts` (§4). Until then, schema is the one accepted central edit.

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

**Recommendation: O1**, with a dev-only print of the resolved schedule. The phase list comes from §5
(workerthree owns it; draft: input → net/predict → sim-sync → visual → pre-render → render →
after-render). Each phase runs from one `useFrame` at that phase's priority, so the 46 call sites shrink to
one per phase. For the sim half, phases are fixed hook points in `step()` (thrust, cap, tick), and the tie
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
| Central files a feature edits | 19 (§1.8) | ≤ 2 registry lines (+ schema, §3.4) | `rg -il tug` outside the two folders |
| `step()` time per tick | [to measure] | no regression beyond noise | in Chrome with a CDP CPU throttle (memory `time-hot-loops-in-chrome-not-tsx.md`) |
| Frame time on `/test-level` | [to measure] | no regression beyond noise | `perf-analysis` skill |
| Determinism | `room-tug.test.ts`, `tug-run.test.ts`, `tug.test.ts` pass | same tests pass unchanged | `pnpm test` |
| Order is declared | — | a test shuffles the registry and gets the same schedule | new unit test |

The owner decides go / no-go on the numbers before any other feature moves.

## 4. Net, input, client state, room config (workertwo)

> **Pending from workertwo:** the net half of the module contract — how a module declares its messages,
> its schema fields (§3.4) and its Rules defaults as a namespace in the B2 overrides map.

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

Folded into §2 (ranks 2, 4, 5, 7, 8).

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

#### C. Discrete input

The action map in §7 S2 is the only proposal so far. [≥5-option weighing: open with workertwo, or left
to #348.]

## 5. Render, frame schedule, quality tiers (workerthree)

> **PENDING** — workerthree sends this section. Agreed content: R1 map of every `useFrame`/`addEffect` ·
> R2 the phase list and the ordering choice for §3.5 · R3 who owns `gl.render` · R4 quality tiers, and
> whether a feature module may register a post effect or a quality hook · R5 perf hooks · R6 problems,
> options, stages. Also: which of the 46 `useFrame` sites are systems and which are views animating
> themselves.
>
> Fact from #345 (measured): any `useFrame` priority > 0 turns off R3F auto-render
> (`@react-three/fiber` `events-*.esm.js:1117`). `PlainRender` (priority 1) or the composer renders.

## 6. State and code organisation inside a module

### 6.1 Entities and state

Where does a piece of client state live: a koota entity, a trait, a world trait, or a module singleton?

Verified this session in the installed koota 0.6.6: **world-level traits** exist — `World.add / get / set /
has` (`koota/dist/types-DONaXEhM.d.ts:441–460`). React hooks accept a world as the target —
`useTrait( target: Entity | World | …, trait )` and `useTraitEffect( target: Entity | World, … )`
(`koota/dist/react.d.ts:26,28`).

| | Option | Correctness | One clock | Re-render cost | Idiom fit |
|---|---|---|---|---|---|
| A | Keep both models; write the rule down only | same as today | no change | no change | low: rank 6 stays |
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
| **F1** | **Engine skeleton.** Registries (D1), `defineSimFeature` / `defineClientFeature`, the O1 scheduler, `FeatureViews`, bridge loop over `net` handlers, `step()` hook loop. Zero features registered; behaviour unchanged. | new `apps/client/app/engine/*`, new `packages/shared/src/features/registry.ts`, `sim/step.ts`, `run/run-sim.ts`, `net/attach-room-to-world.ts`, `game/net-canvas.tsx` | S0, §5 phases |
| **F2** | **Pilot: move tug into two feature folders.** Measure per §3.8. | tug's 11 files (moved) + the 19 central files in §1.8 (tug lines removed) | F1 |
| F3 | Owner go / no-go on the F2 numbers. | — | F2 |
| F4… | One feature per stage: bolt, seeker, mine, boost, shield, portal. | that feature's files + the lines it leaves in central files | F3 |
| S4 | Tags `Dead`, `Stunned`, `Shielded`, `Spectating`. Readers switch one at a time. | `game/ecs/traits.ts`, `net/attach-room-to-world.ts`, `game/spectator.ts`, the 13 `.dead` readers | S0 |
| S5 | World traits `Phase`, `SpectatorTarget`, `Standings`, `Blocks`, `PowerSlot` + the one run reset. | `game/spectator.ts`, `game/block-state.ts`, `game/pickup-state.ts`, `game/input/power-select.ts`, `game/net/standings-store.ts`, `game/net/run-view-store.ts`, `net/attach-room-to-world.ts`, `net/prediction.ts` | S0 |
| S6 | Room config (B2). ADR for #70. Rules defaults merged from every sim feature's `rules`. Lock at GO. | `packages/shared/src/schema.ts`, `sim-config.ts`, `run/run-sim.ts`, `apps/server/src/rooms/run-room.ts`, `docs/DECISIONS.md` | S1, F1, ADR |
| S7 | Generic bridge helper `mirrorCollection( schemaMap, spawn, patch )` replaces the 8 maps. | `net/attach-room-to-world.ts` | S4 |
| S8 | Input send on the sim tick (flush after `predictor.record`). Delete the `setInterval`. | `net/attach-room-to-world.ts`, `game/ecs/net-systems.ts` | §5 phases |
| S9 | Event queues move to A3 (world-trait rings, declared per feature). | S3 helper and its consumers | S3, S5, F1 |
| S10 | Rename scratch-only `.state.ts` files (e.g. `tug-line.state.ts` → `.scratch.ts`) with an ls-lint rule. | `tug-line.state.ts` and importers, `.ls-lint.yml` | — |
| S11 | Group the world that no feature owns in `game/scene/` (`track/`, `ships/`, `sky/`, `post/`), one per commit. | `game/scene/**` | a window with no held `game/scene/` files |

Order: S1, S2, S3 and S10 can start now. F1 waits for S0 and the §5 phase list. §5 stages merge in when
that section lands.

## 8. Open questions

1. Owner: accept feature modules with the two-half split (§3.2) and the tug pilot (§3.8)?
2. Owner: accept D1 now, D3 later (§3.6)? It means one registry line per feature per end until codegen.
3. Owner: accept O1 ordering (§3.5)?
4. Owner: accept rule C (§6.1) and room config B2 with the four tiers (§4.3 B, §6.2)?
5. Owner (#70 ADR): does room config cover combat only, or ship tuning too?
6. May dev dials override Rules values in a hosted room, or only on `/test-level`?
7. workertwo: can the installed `@colyseus/schema` 4 declare a feature's fields without a central edit
   (§3.4)?
8. workerthree: the phase list (§3.5, §5), and whether a feature may register a post effect or quality hook.
