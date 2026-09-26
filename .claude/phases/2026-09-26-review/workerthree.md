# Code review — client scene, part 1 (workerthree)

Agent: workerthree · Date: 2026-09-26 · Read-only review.

**Scope:** `apps/client/app/game/scene/` files that sort from `accent.ts` to `mine-throw.ts` (all non-test
`.ts`/`.tsx`, 55 files, 5,224 lines). Test files were not reviewed.

**Yardstick:** CLAUDE.md NN 1–15, `conventions/r3f.md`, `conventions/ecs.md`, `.claude/rules/r3f-rendering.md`,
`.claude/rules/ecs-koota.md`, `.claude/rules/react-house-style.md`.

**Totals:** P0 0 · P1 3 · P2 9

"Verified" means I read the line and the code it depends on in this session. "Inferred" means the mechanism
is verified but its effect was not measured.

---

## P1

### P1-1 · `toneMapped: false` came back in two combat materials

- `mine-bodies.tsx:37`
  ```ts
  function glowMaterial(): THREE.MeshBasicMaterial {
      return new THREE.MeshBasicMaterial( {
          ...
          toneMapped: false,
  ```
- `mine-shock.tsx:32`
  ```ts
  material: new THREE.MeshBasicMaterial( {
      ...
      toneMapped: false,
  ```
- **Rule:** `.claude/rules/r3f-rendering.md`: *"Every material is tone mapped — `toneMapped={false}` is banned.
  Removed project-wide 2026-09-22."* Also `conventions/r3f.md`: *"it exempts that one surface from the curve
  every other surface pays, so the frame mixes two colour responses."*
- **History:** both lines came in with `71b64c4` (2026-09-25, #261), three days after the ban. The two mine
  glow materials (core and decal) and the shock ring are the only surfaces in scope that skip the Neutral curve.
- **Fix:** delete both `toneMapped: false` lines. Then check that the per-instance colour clears bloom:
  core is `HOT × MINE_CORE_INTENSITY (5) × glow`, the decal is `accent × 2.2 × glow`, the ring is `accent × 5`.
  Raise the intensity constants if a surface stops blooming.
- **Status:** verified (grep finds no other `toneMapped` under `game/`).

### P1-2 · Exhaust and engine light saturate at 55 u/s, not at the ship's cruise speed

- `exhaust-drive.ts:13` and `:22`
  ```ts
  if ( sim ) return sim.dead ? DRIVE_EXTINGUISHED : clamp01( sim.vz / DEFAULT_TUNING.maxCruise );
  ...
  return clamp01( ( last.z - prev.z ) / span / DEFAULT_TUNING.maxCruise );
  ```
- `packages/shared/src/constants.ts:74` sets `DEFAULT_TUNING.maxCruise: 55`. The ship classes in
  `packages/shared/src/ship-classes.ts` use 84, 96, 112, 90 and 124. The only ship with exhaust ports,
  `split-crown`, is a freighter (`ship-classes.ts:119`), and freighter `maxCruise` is 124 (`:99`).
- **Effect:** `throttle` reaches 1 at 55 u/s, which is 44% of the freighter's top speed. Above that, the plume
  length, spread and glow (`exhaust-field.tsx:54-58`) and the engine light (`engine-light.tsx:37`) stop
  responding to speed.
- **Rule:** own judgment (bug). NN-6 also applies: *"Ship stats are data (`ShipClass` config)"* — the drive
  reads a global default and not the ship's class.
- **Fix:** divide by `tuningForShip( net.shipId ).maxCruise`. Both callers already have the entity; read
  `Net.shipId` inside `exhaustDrive`.
- **Status:** mechanism verified; visual effect inferred (not captured).

### P1-3 · Asteroid bands rebuild and allocate every placement each time the camera crosses a spacing line

- `asteroid-band.tsx:56-75`
  ```ts
  const i0 = Math.floor( ( z - BACK ) / band.spacing );
  ...
  if ( i0 === span.current.i0 && i1 === span.current.i1 ) return;
  ...
  for ( const p of asteroidField( band, i0 * band.spacing, i1 * band.spacing ) ) {
  ```
- `asteroid-field.ts:61-73` returns a new array of new objects. Each object holds two new tuples
  (`stretch` is shared, `rotation` is `[ ... ]` at `:56`). Then it calls `.sort()`.
- **Numbers (inferred from constants):** `AHEAD = 900`, `BACK = 240` (`track-instancing.ts:3-4`). The flank band
  (spacing 12) rebuilds 190 placements every 12 u. At 124 u/s that is about 10 rebuilds a second. Over all three
  bands this is about 11,000 short-lived objects a second, plus a full rewrite of every instance matrix and
  spin value when only one slot entered and one slot left.
- **Rule:** `.claude/rules/r3f-rendering.md`: *"`useFrame` is the hot path. No `setState`, no allocation
  (`new Vector3()`, array literals, inline closures)."*
- **Fix:** write placements straight into the instance buffers from a slot loop with a scratch placement
  object (no array, no sort — the draw order does not need z-order). Or keep a ring buffer and only fill the
  slots that entered.
- **Status:** allocation verified; GC cost inferred (not profiled).

---

## P2

### P2-1 · Per-frame closures and array literals in `useFrame`

The rule is the same as P1-3. Each site allocates on every frame, not only on an event.

| Site | Code |
|------|------|
| `block-debris.tsx:243-244` | `drainMends( ( id ) => mend( debris, id ) ); drainBreaks( ( e ) => spawn( debris, e, now ) );` |
| `hit-spark.tsx:147` | `drainHits( ( e ) => spawnBurst( pool, e.x, e.y, e.z ) );` |
| `mine-shock.tsx:69` | `drainMineShocks( ( e ) => spawn( rings, e ) );` |
| `mine-shots.ts:54`, `:59` | `world.query( NetMine ).readEach( ( [ m ] ) => emitMineShot( sink, m, m, now ) );` (called each frame from `collect`) |
| `mine-bodies.tsx:126` | `for ( const m of [ body, core, decal ] ) {` |

- **Fix:** build each sink once (`useMemo` or module scope) and pass per-frame values through a scratch
  object, or let the drain functions return the queue for a plain `for` loop. Replace the array literal with
  three calls to a small `commit( mesh, n )` helper (`meteor-strikes.tsx:222` already has one).
- **Status:** verified. Cost is small (inferred: V8 may not elide a closure that escapes into another module).

### P2-2 · Idle VFX pools re-upload full instance buffers every frame

Each of these sets `needsUpdate = true` on the whole buffer every frame, even when nothing is alive. Some also
rewrite every dead slot.

| Site | What happens when idle |
|------|------------------------|
| `bolt-embers.ts:62-88` | Writes all 384 matrices (dead slots get scale 0) and uploads matrix + colour buffers. |
| `block-debris.tsx:203-213`, `:246-250` | Writes `_zero` into 12 slots × 18 cell meshes, uploads 18 matrix buffers and the glow attribute. |
| `explosions.tsx:149-150` | Uploads 240 matrices + colours; `count` stays at `MAX`, so 240 parked boxes are drawn. |
| `hit-spark.tsx:127-128` | Same: 200 matrices + colours uploaded and drawn. |

- **Rule:** own judgment (perf). `asteroid-band.tsx:82-83` already shows the fix with `addUpdateRange`.
- **Fix:** track a live count or high-water mark (as `meteor-chunks.tsx:139` does with `top`), set
  `mesh.count` to it, and skip `needsUpdate` when nothing changed.
- **Status:** verified; cost inferred (a few tens of KB a frame).

### P2-3 · `explosions.tsx` and `hit-spark.tsx` are the same pool twice

- `explosions.tsx:41-93` and `hit-spark.tsx:38-84`: `makePool`, `spawnBurst`, `park` and `initPool` match
  line for line, apart from the tint fields. The `advance*` loops differ only in how they place and colour
  one shard.
- **Fix:** move the pool (spawn, integrate, park) to one module; keep each component's placement/colour step.
- **Status:** verified.

### P2-4 · `inited` guard does not re-initialise a new mesh

- `explosions.tsx:158-166` and `hit-spark.tsx:134-142`
  ```ts
  if ( mesh && ! inited.current ) {
      initPool( mesh );
      inited.current = true;
  }
  ```
- If R3F ever gives the ref a different `InstancedMesh` (for example, `args` changes), the new mesh keeps
  identity matrices and no colour attribute, and shows up to `MAX` white unit boxes at the origin until each
  slot is used. Today nothing changes those `args`, so this is latent.
- **Fix:** key the guard on the mesh (`if ( mesh && mesh !== initedMesh )`), or drop the guard, because
  `initPool` is idempotent.
- **Status:** inferred (no current trigger).

### P2-5 · Dead code: legacy environment chain and unused accent controls

- `environment.tsx` (`Environment`), `gradient-dome.tsx` (`GradientDome`) and `env-config.ts` import only
  each other. No route, scene or test renders `<Environment>`. `GameEnvironment` + `DeepSpaceSky` replaced them.
  `env-config.ts` also exports `ENV_VARIANTS`, `GRID_VOID`, `BloomConfig`, all unused.
- `accent.ts:3-13`, `:45-61`: `ACCENT_TRIALS`, `ACCENT_SHIFT_LIMIT_DEG`, `accentHex`, `accentShiftDeg`,
  `setAccentShiftDeg` and `setAccentAnchor` have no caller in `apps/` or `packages/`. Without a setter,
  `refresh()` and the `derived` list behind `accentDerived` never run after module load.
- `debris-physics.ts:183` `lowestHullY` is used only by a test.
- **Rule:** own judgment (dead code).
- **Fix:** delete the three environment files. Delete the unused accent exports, or wire them to the tuning
  panel if the accent trial is still wanted (ask the owner). Move `lowestHullY` into the test.
- **Status:** verified by grep over `apps/client/app` and `packages/`.

### P2-6 · One component per file: `explosions.tsx` exports `ExplosionField`

- `explosions.tsx:153` `export function ExplosionField() {`
- **Rule:** `.claude/rules/react-house-style.md`: *"One component per file, name matching the file."*
- **Fix:** rename the file to `explosion-field.tsx` (it is imported only by `world-scene.tsx:7`).
- **Status:** verified. Every other `.tsx` in scope matches its file name.

### P2-7 · `exhaust-field.tsx` does geometry setup inside the dispose effect

- `exhaust-field.tsx:83-89`
  ```ts
  useEffect( () => {
      geometry.setAttribute( 'aDrive', drive );
      return () => {
  ```
- `setAttribute` does not synchronise with anything outside React. It is construction, and it belongs where
  the geometry is built.
- **Rule:** NN-8: *"derive during render … `useEffect` is an escape hatch."*
- **Fix:** build `drive` inside the geometry `useMemo` and set the attribute there (as `mine-bodies.tsx:44-46`
  and `meteor-chunks.tsx:99-105` do). Keep the effect for dispose only.
- **Status:** verified.

### P2-8 · Three `trackGround` instances per track, each with its own uncached segment builds

- `block-debris.tsx:220`, `meteor-chunks.tsx:111`, `meteor-strikes.tsx:237` each call
  `trackGround( track, blockWorld.broken )`.
- `debris-ground.ts:67-77` gives each instance its own 64-entry cache over `track.segmentAt()`, which rebuilds
  the segment on every call (`packages/shared/src/sim/track.ts:167`, `mergedSegment` → `buildSegment`). When
  the cache fills it is cleared whole (`:73`), so all three rebuild their working set at the same z.
- **Fix:** memoise one ground per `track` (a `WeakMap< Track, DebrisGround >` in `debris-ground.ts`) and evict
  the oldest entry, not the whole map.
- **Status:** verified; cost inferred.

### P2-9 · Duplicate pickup builders

- `bolt-pickups.tsx:15-30` and `mine-pickups.tsx:9-24` are the same function with three different geometry
  factories.
- **Fix:** one `pickupBody( shell, glyph, core )` helper in `combat-look.ts`; each component passes its three
  geometry builders.
- **Status:** verified.

---

## Checked with no finding

- **NN-4 / NN-10 re-renders and subscriptions:** no component in scope holds `useState`, `useQuery` or a
  Colyseus listen. The one store hook is `useRebuildToken()` in `BlockDebris` (a leaf). `useFrame` bodies
  never call `setState`.
- **GPU dispose:** every geometry or material built with `new` or a builder has a dispose path
  (`useEffect` cleanup or the React 19 ref cleanup in `block-debris.tsx:230-237`). Module singletons
  (`block-burst.tsx:22`, `finish-outline.tsx:6`, `meteor-assets.ts:177-188`) live for the page.
- **Timers:** no `setInterval` or `setTimeout` in scope.
- **Fragments:** no `<>` shorthand.
- **Comments:** only the allowed `useEffect` lines.

## Scope not covered

None. Test files (`*.test.ts`) were not reviewed.

## Top 5

1. **P1-1** — remove the two `toneMapped: false` lines (`mine-bodies.tsx:37`, `mine-shock.tsx:32`) and recheck bloom.
2. **P1-2** — normalise `exhaustDrive` by the ship's own `maxCruise`, not `DEFAULT_TUNING` (55 u/s).
3. **P1-3** — stop the per-crossing allocation and full rewrite in `AsteroidBand`.
4. **P2-5** — delete the dead `environment.tsx` / `gradient-dome.tsx` / `env-config.ts` chain and the unused accent setters.
5. **P2-2** — trim idle VFX uploads (embers, debris, explosions, sparks) with a live high-water mark.
