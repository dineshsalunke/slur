# Code review — `packages/shared` (sim, track, procgen, pacing, combat, ships) + build

Agent: workertwo · Date: 2026-09-26 · Scope: `packages/shared/src/**` except `schema.ts`; root
`package.json`, `tsconfig*.json`, `pnpm-workspace.yaml`, `packages/shared/{package,tsconfig*}.json`.

Totals: **P0 1 · P1 5 · P2 9**.

Method: read the yardstick docs (CLAUDE.md NN 1–15, `conventions/{ecs,netcode,monorepo}.md`,
`.claude/rules/{track-space,monorepo}.md`, GDD §0, ADR-000/006/007/013). Read every non-test source file
in `sim/`, `sim/groove/`, `combat/`, `race/`, `constants.ts`, `ship-classes.ts`, `sim-config.ts`; skimmed
`pacing/` and `sim/score/` for determinism and roster reads. "Verified" = reproduced in node against
`dist` or read at the line this session. "Inferred" = reasoning, not run.

Clean results (verified): no `Math.random`, `Date`, `performance`, `Intl` or `localeCompare` in any
non-test shared file. No import cycles in `src` (DFS over relative imports). No runtime mutation of
`SECTIONS`, `DEFAULT_TUNING`, `TRACK_CONTRACT`, `SHIP_CLASSES` or `DEFAULT_SIM_CONFIG` anywhere in apps or
shared.

---

## P0

### P0-1 · `isShipId` accepts prototype keys; one lobby message crashes the room

- `packages/shared/src/ship-classes.ts:126-127`
  ```ts
  export function isShipId( id: unknown ): id is ShipId {
      return typeof id === 'string' && id in SHIPS;
  ```
- `in` walks the prototype chain. `'constructor'`, `'toString'`, `'__proto__'` and `'hasOwnProperty'`
  all pass. `shipOf()` then returns a function (`SHIPS['toString']`), so `?? SHIPS[DEFAULT_SHIP]` never
  fires, and `classOfShip()` reads `SHIP_CLASSES[undefined].tuning`.
- Server gate: `apps/server/src/rooms/run-room.ts:99` — `if ( … ! isShipId( shipId ) ) return;` then
  `p.shipId = shipId`. Every tick then calls `tuningForShip( player.shipId )`
  (`apps/server/src/rooms/room-bounce.ts:29`).
- Rule: CLAUDE.md NN 1 — *"Server is authoritative"*; `conventions/netcode.md` Core Model — the server
  must validate client input. Own judgment: a validator that lets a crash through.
- Fix: `Object.hasOwn( SHIPS, id )`. Same for `shipOf`: `Object.hasOwn( SHIPS, id ) ? SHIPS[ id ] :
  SHIPS[ DEFAULT_SHIP ]`. Add a test for the four keys.
- **Verified** in node against `dist`: all four keys return `true` and `tuningForShip()` throws
  *"Cannot read properties of undefined (reading 'tuning')"*. The server crash or room teardown is
  **inferred** (not run against a live room).

---

## P1

### P1-1 · Track materialization reads the ship roster (production generator included)

The contract says the generator never reads the roster:

> `docs/GDD.md` §0 — *"The generator reads `TRACK_CONTRACT` … and **never the ship roster**"* and
> *"If clearance tracked the live roster, adding/resizing a ship would silently mutate every existing
> seed's track."* (ADR-013.)

Sites (all verified at the line):

| Site | Code | Used by |
|---|---|---|
| `sim/fracture-shadow.ts:6-9` | `FRACTURE_SHADOW_Z = … * Math.max( ...Object.values( SHIP_CLASSES ).map( ( c ) => c.tuning.smashKeep ) )` | **groove** (`sim/groove/islands.ts:42,92`) — the server default gen |
| `sim/merge-blocks.ts:8` | `MERGE_POCKET_Z = 2 * Math.max( ...Object.values( SHIP_CLASSES ).map( ( c ) => c.tuning.halfL ) )` | weave (`closePair`, `abutAcrossBoundary`) |
| `sim/pickup-place.ts:16-19` | `WIDEST_HALF_W` / `LONGEST_HALF_L` from `ALL_CLASS_TUNINGS` → `PICKUP_COLUMN_HALF`, `PICKUP_OVERRUN` | every gen's pickup anchors |
| `pacing/grid.ts:34` | `PACING_HULL_L = SHIP_CLASSES.freighter.tuning.halfL` | analysis only (lower cost) |

- Cost: changing one ship's `smashKeep`, `halfL` or `halfW` moves smash blocks on every groove seed,
  merges on every weave seed, and pickups on all seeds. No test fires (see P1-3).
- Fix: add the numbers to `TRACK_CONTRACT` (e.g. `smashKeep`, `maxHalfL`, `maxHalfW`) and read them.
  Extend `rosterContractFailures` to assert the roster fits them, as it does for width.

### P1-2 · `**` (pow) in weave materialization breaks the no-transcendentals invariant

- `packages/shared/src/sim/block-depth.ts:19` and `:45`
  ```ts
  const t = ( u < 0 ? 0 : u > 1 ? 1 : u ) ** bias;
  const w = BLOCK_WIDTH_MIN + ( top - BLOCK_WIDTH_MIN ) * r() ** bias;
  ```
  `bias` is non-integer (`BLOCK_DEPTH_BIAS_REST 2.2`, `…_PEAK 0.6`, `BLOCK_WIDTH_BIAS_* 1.1 / 0.6`).
- Rule: `docs/DECISIONS.md` ADR-000 invariant 4 — *"identical materialization + identical `simulate()`
  across both JS engines — integer/IEEE-754 basic ops only, no transcendentals in the shared path."*
- `pow` is not correctly rounded in the spec. V8 (server) and JavaScriptCore / SpiderMonkey (a Safari or
  Firefox client) may differ in the last bit. A 1-ulp difference can flip a threshold in `closePair` or
  `keepsClearance`, and then the client collides with a block the server does not have.
- Reach: weave only (`blockZSpan`, `carveRun`, `gapBlocks`). Weave runs when `SLUR_TRACK_GEN=weave` and on
  `/test-level`; the room default is groove.
- Fix: replace with a pure-arithmetic curve (e.g. a quantised lookup table, or a rational ease such as
  `u / ( u + k * ( 1 - u ) )`). Add a lint check that bans `**` / `Math.pow` / `Math.sin|cos|exp|log`
  under `packages/shared/src/sim`.
- **Verified** the invariant breach at the line. A real cross-engine divergence is **inferred**.

### P1-3 · The production generator (groove) has no frozen-geometry test

- `sim/track-contract.test.ts` pins the motif library (`:55`) and the weave racing line (`:71`). Nothing
  pins groove geometry. `groove.test.ts:197` checks same-seed-twice equality only — that passes after a
  reshape.
- Server default: `apps/server/src/rooms/run-room.ts:83` — `isTrackGen( gen ) ? gen : 'groove'`.
- Rule: GDD §0 — *"Changing a `TRACK_CONTRACT` number is a deliberate, one-time reshape of every existing
  seed. It is fenced by a frozen-geometry test."* Groove is unfenced, so P1-1 moves real tracks silently.
- Fix: add a digest test over `buildGroove( seed ).segments` + `anchors` for three seeds. Do the same for
  weave blocks (only its line is pinned today).
- **Verified** by reading both test files.

### P1-4 · Weave `segmentAt` is rebuilt on every call, inside the per-tick sim

- `packages/shared/src/sim/track.ts:181-186` — `segmentAt` builds segment `i` and both neighbours
  (`merged( i - 1 )`, `merged( i + 1 )`) each call. No cache. `simulate()` calls `segmentAtZ` two or
  three times per ship per tick (`step.ts:109-110`, `:283`); `lineOfSight` walks up to 30 segments per
  seeker lock (`combat/seeker.ts:112-113`); client prediction replays these per pending input.
- Measured (node, `dist`, seed 20260921): weave **18.3 µs** per `segmentAtZ`; score and groove **0.1 µs**
  (they freeze into an array via `segmentsTrack`). Weave `resolveTrack` already costs 21 ms.
- Rule: own judgment (perf); the memory `procgen-segmentat-is-uncached` records the 100× test slowdown.
- Fix: make `makeProcgenTrack` materialize-once like the other two gens —
  `segmentsTrack( Array.from( { length }, ( _, i ) => segmentAt( i ) ), length )` — which ADR-006 already
  names: *"materialize-once (ADR-004 finite tracks) replaces the O(1) per-segment closure."*

### P1-5 · `simulate()` takes a `SimConfig` it never reads

- `packages/shared/src/sim/step.ts:292` — `_cfg: SimConfig = DEFAULT_SIM_CONFIG,`
- Every production caller passes one: server `room-bounce.ts:32` passes `world.config`; client
  `prediction.ts:50`, `net-systems.ts:49`, `systems.ts:18`, `deck-flight.ts:21` pass `DEFAULT_SIM_CONFIG`.
  The server's per-room config therefore never reaches flight. If it ever does, client prediction
  (hard-wired to the default) mispredicts.
- Rule: `conventions/netcode.md` anti-pattern — *"Different sim code / different `dt` on client vs
  server … guarantees constant misprediction."* Own judgment: a dead parameter that invites that bug.
- Fix: remove the parameter and the argument at all six call sites, or thread one config from room state
  to both ends. Removing it is the smaller change today.
- **Verified** (grep of all call sites).

---

## P2

### P2-1 · Dead or test-only exports

Defined, never used anywhere (not even tests) — **verified**:
- `pacing/pockets.ts:267` `groupPockets`
- `sim/groove/line.ts:126` `grooveLineX`
- `race/director.ts:5` `type Phase`

Used only by tests (production has no caller) — **verified**:
- `sim/fracture-shadow.ts:72` `sealShadowed`, `:57` `shadowHazard`, `FRACTURE_SHADOW_SEGMENTS` — the
  post-hoc demotion was dropped (memory `fractured-blocks-rarely-have-a-clear-lane`); only
  `FRACTURE_SHADOW_Z` is live.
- `combat/pickups.ts:21` `pickupLayout`; `constants.ts:104` `jumpReach`; `sim/clearance.ts:86`
  `openCenterX`; `sim/weave.ts:40` `weaveLineLanes`; `sim/groove/open-space.ts` `openSpace`,
  `openSpaceFailures`; `sim/score/motifs.ts` `motifDigest`; `sim/score/notes.ts` `formatNotes`;
  `pacing/ngrams.ts` `countGrams`, `topGrams`; `constants.ts` `SCORE_ADHERENCE_FLOOR`,
  `SCORE_ACCENT_ADHERENCE`.

Fix: delete the three dead ones. Move the test-only helpers beside their tests, or keep them and accept
they ship. The scan found 243 exports with no consumer outside their own file (tests excepted) —
drop `export` when next touched.

### P2-2 · The trackless `simulate()` path has side walls the real track lacks

- `sim/step.ts:68-95` — `resolveFlatFloor` → `clampToEdges` stops the ship at `HALF_WIDTH - halfW`. The
  track path never clamps; GDD §5 table: *"no side wall: a ship that strafes past the deck edge falls"*.
- Only analysis calls the trackless path (`sim/score/note-move.ts:53`, `sim/score/motifs.ts:113`,
  `pacing/jump-window.ts:109`). Those measure a ship that cannot fall off the side.
- Verified: a fighter at x 40 strafing right on groove seed 1 dies at x 90.2 within 2 s. Impact on motif
  results **inferred** small (motifs stay inside `MOTIF_MAX_EXTENT`).
- Fix: pass a flat full-width `Track` to those callers and delete `resolveFlatFloor` / `clampToEdges` /
  the optional `track?`.

### P2-3 · Post-respawn invulnerability is effectively dead

- `sim/step.ts:279-281` clears `invulnTimer` on the first tick clear of every block. ADR-016 guarantees a
  respawn point is block-clear (`respawnPoint`), so `invulnTime: 1.5` (`constants.ts:92`) is spent on
  tick one. `docs/DECISIONS.md:916` already says *"invuln is not needed for that case"*.
- Fix: decide with the owner; if kept, rename to what it is (a one-tick overlap grace). The wire field is
  workerone's (`schema.ts:32`). **Inferred** from code + ADR; not flown.

### P2-4 · Seeker trail is hidden module state outside `SeekerState`

- `combat/seeker-trail.ts:14` — `const trails = new WeakMap< object, Trail >();` keyed by the seeker
  object. The homing path (`seeker.ts:182`, `trailX`) depends on it. It is not in the seeker's state, so
  a replaced or re-decoded seeker object silently loses its trail, and a client cannot reproduce it.
- Rule: `conventions/ecs.md` — *"Entities live in a plain store; behaviour lives in systems."* Own
  judgment for the sim.
- Fix: keep the trail on a server-side per-seeker record next to `SeekerState`, passed in explicitly.

### P2-5 · Two defaults for the track generator

- `sim/track-provider.ts:15` — `procgenDescriptor( seed, gen: TrackGen = 'weave' )`; server
  `run-room.ts:83` defaults to `'groove'`. `/pacing` (`analyze-worker.ts:18` calls
  `procgenDescriptor( seed )`) therefore measures weave while rooms race groove.
- Fix: one `DEFAULT_TRACK_GEN` in `space.ts`, used by both.

### P2-6 · `pnpm typecheck` does not typecheck shared tests

- `packages/shared/tsconfig.json` — `"exclude": [ "src/**/*.test.ts" ]`; `package.json` —
  `"typecheck": "tsc -b"`. Tests are type-checked only inside `pnpm test`
  (`tsc -p tsconfig.test.json`).
- Fix: `"typecheck": "tsc -b && tsc -p tsconfig.test.json --noEmit"`.

### P2-7 · `createFixedStep` has no unit test

- `sim/fixed-step.ts:3-16` is the one clock both ends use (`run-room.ts:66`, `net-loop.tsx:3`). No test
  file references it (grep). Worth pinning: remainder carry, the `maxSteps` clamp (`:13` `acc = 0`), and
  the returned alpha.

### P2-8 · `CELL` used as a runtime unit

- `constants.ts:112` `START_STAGGER = CELL` → `race/director.ts:27` `x = index * START_STAGGER`. With
  `maxClients = 12` this spans x 0…44, all on the right half of the deck.
- Rule: CLAUDE.md NN 11 — *"`CELL = 4u` is an AUTHORING SNAP GRID ONLY. Not a runtime unit."*
- Fix: a named `START_STAGGER_U` in u, and centre the grid (`( index - ( n - 1 ) / 2 ) * stagger`).

### P2-9 · Sim modules import from the analysis package

- `sim/score/emit.ts:2`, `notes.ts:8`, `motifs.ts:2-3`, `note-move.ts:2` import from `pacing/`.
  `SCORE_REGISTER_CRUISE` is just `TRACK_CONTRACT.registerCruise` (`pacing/score.ts:10`). The barrel
  (`index.ts`) also ships all of `pacing/` (~2.5k lines of analysis) in the runtime package.
- Rule: `conventions/monorepo.md` — *"Keep `shared` small and leaf-like."*
- Fix: read `TRACK_CONTRACT` directly in `sim/`; consider a `@slur/shared/pacing` subpath export.

---

## Not covered

- `schema.ts` (workerone's lane).
- `pacing/` and `sim/score/` were skimmed for determinism and roster reads only, not line-by-line for
  logic bugs (`arms.ts`, `route-graph.ts`, `pockets.ts`, `reference-path.ts`, `compose.ts`, `emit.ts`
  bodies).
- No cross-engine run (Safari/Firefox vs Node) for P1-2.

## Top 5

1. **P0-1** — `Object.hasOwn` in `isShipId` / `shipOf`; a client can crash the room today.
2. **P1-1** — move roster-derived numbers (`FRACTURE_SHADOW_Z`, `MERGE_POCKET_Z`, pickup margins) into
   `TRACK_CONTRACT`.
3. **P1-3** — pin groove geometry + anchors in a frozen-digest test, so 1 and 2 cannot recur silently.
4. **P1-2** — remove `**` from `block-depth.ts` and lint-ban transcendentals under `sim/`.
5. **P1-4** — materialize weave once (`segmentsTrack`), removing 18 µs per `segmentAtZ` from the tick.
