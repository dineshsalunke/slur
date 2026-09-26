# Code review — client scene part 2 (workerfour)

Date: 2026-09-26 · HEAD at review start: `59529e8`
Scope: `apps/client/app/game/scene/` files `monolith-config.ts` … `world-scene.tsx` (non-test).
Yardstick: CLAUDE.md NN 1-15, `conventions/r3f.md`, `conventions/ecs.md`, `.claude/rules/r3f-rendering.md`,
`.claude/rules/ecs-koota.md`, `.claude/rules/react-house-style.md`.

**Totals: P0 0 · P1 3 · P2 10**

## Coverage

- Read in full: every `.tsx` in scope, and `monolith-*.ts`, `nebula-baker.ts`, `nebula-env-shell.ts`,
  `nebula-noise-volume.ts`, `nebula-planets.ts`, `nebula-probe.ts`, `pickup-*.ts`, `rail-glow.ts`,
  `rear-view-*.ts`, `seam-inserts.ts`, `sealed-block-variation.ts`, `seeker-look.ts`, `seeker-trail.ts`,
  `ship-materials.ts`, `ship-visuals.ts`, `sky-config.ts`, `track-geometry.ts`, `track-instancing.ts`,
  `track-materials.ts`, `track-openings.ts`, `track-rails.ts`, `wall-breakup.ts`, `use-rail-mask.ts`.
- Read in part: `sealed-block-shader.ts` (uniforms + `patchSealedBlock`), `track-texture.ts` (lines 780-852:
  build, cache, dispose only).
- Not reviewed: GLSL bodies in `nebula-shaders.ts` and `nebula-noise.ts`, `sealed-block-geometry.ts`,
  the paint code in `track-texture.ts` (bake-time, lines 1-780), and all `*.test.ts`.
- I checked for per-frame allocation, React re-renders, subscriptions, disposal, one component per file,
  `useEffect` use and dead code. I found no `setState`, no timers and no `new THREE.*` inside a `useFrame`.

## Findings

### P1-1 · A Colyseus subscription is tied to a component's mount

- **Where:** `pickup-field.tsx:14-30`
  ```ts
  useEffect( () => {
      ...
      const $ = getStateCallbacks( room );
      const offAdd = $( room.state ).pickupTaken.onAdd( onTaken );
  ```
- **Rule:** CLAUDE.md NN-8: *"keep long-lived resources (sockets, subscriptions, the Colyseus room, timers)
  OUTSIDE React on module singletons — never tied to a component's mount/unmount."*
- **Why it costs:** a remount of `PickupField` drops and re-adds the listeners and clears `taken`, and
  the correct state then depends on `onAdd` replaying existing entries. The rest of the room→client
  binding already lives outside React. `net/attach-room-to-world.ts:223` writes block breaks into the
  module-level `blockWorld` (`$( room.state ).blockBroken.onAdd( … confirmBreak … )`).
- **Fix:** move the three `pickupTaken` listeners into `attach-room-to-world.ts` and have them write a
  module-level set (the same shape as `blockWorld.broken`). `PickupField` then reads `set.has( id )`
  and holds no effect.
- **Status:** verified at the lines. That remounts actually happen during a race is inferred.

### P1-2 · GPU resources that React did not create are never disposed

- **Rule:** `.claude/rules/r3f-rendering.md`: *"Dispose what React didn't create. Pooled/shared geometries
  and materials are yours."*
- **Mechanism (verified in the installed fiber 9.7.0, `events-156d8d12.esm.js:15231-15237`):** on unmount
  R3F calls `dispose` only on the instance object, and *"Never dispose of primitives"*. A geometry passed
  as a `geometry={…}` prop and an object mounted by `<primitive>` are therefore never freed.
  `InstancedMesh.dispose()` does not free its geometry or material.
- **Sites:**
  - `track-blocks.tsx:165-172`: `geometry` (sealed block + its two `InstancedBufferAttribute`s), `cells`
    and `fractured.geometry` are built in `useMemo` and passed as props at `:233` and `:249`. Nothing
    disposes them. The sibling files `track-floor.tsx:135`, `track-rail.tsx:76`, `track-seams.tsx:18`
    and `track-rim.tsx:146` all do. **Verified.**
  - `rear-view-pass.tsx:31`: `const surface = useMemo( () => rearViewSurface( target.texture ), [ target ] );`
    It is mounted by `<primitive object={ surface } attach="material" />` (`rear-view-panel.tsx:19`). A new
    `ShaderMaterial` is made every time `target` changes (a DPR change or a `RearView.scale` rebuild) and on
    every mirror toggle. The old one is never disposed. **Verified.**
  - `ship-model.tsx:222-229`: `<Clone deep="materialsOnly">` clones the GLTF materials per ship. I found no
    disposal on unmount. `ShipModel` remounts on every class change (`key={ shipId }` in `ship-view.tsx:18`).
    **Inferred:** I did not read drei `Clone` to confirm how it mounts the cloned materials.
- **Fix:** add a dispose effect for each site, in the same form as `track-floor.tsx:135-141`.

### P1-3 · The nebula noise volume blocks the main thread for ~335 ms on every mount

- **Where:** `nebula-baker.ts:75`
  ```ts
  private readonly noise = createNoiseVolume();
  ```
  `nebula-noise-volume.ts:50-62` runs `fbm` 64³ × 4 channels (~1 M calls) on the CPU. Each `valueNoise`
  call also allocates two closures (`:26-28`).
- **Measured:** `createNoiseVolume()` took 343.7 / 334.1 / 334.7 ms in node on this machine (three runs).
  It runs when `NebulaSky` mounts (`nebula-sky.tsx:6`, `useMemo( () => new NebulaBaker() )`), which is
  when the room scene first renders. `dispose()` frees it, so every remount builds it again.
- **Rule:** own judgment (a frame hitch of ~20 frames at 60 fps). The output has no inputs, so it is the
  same volume every time.
- **Fix:** build the `Uint8Array` once at module scope and keep it across bakers, so that only the
  `Data3DTexture` is per baker. Alternatively, bake it offline to a file, or generate it in a shader pass.
  Also hoist the `at`/`lerp` closures out of `valueNoise`.
- **Status:** the cost was measured in node, not in the browser.

### P2-1 · Per-frame `Color.set( string )` parses a colour string

- **Mechanism (verified, `three/src/math/Color.js:303`, `:374`):** `setStyle` runs `RegExp.exec`, which
  allocates a match array on every call.
- **Sites:**
  - `ship-model.tsx:209`: `hull.color.set( base );` — once per hull material, per ship, per frame.
  - `ship-shadow.tsx:86`: `uniforms.uColor.value.set( col( 'Shadow.color' ) );` — once per ship per frame.
  - `rail-glow.ts:68`: `u.uRailColor.value.set( col( 'RailLight.color' ) )…` — called from
    `track-floor.tsx:144` and three `MonolithGroup`s (`monolith-group.tsx:80`), 4× per frame.
- **Rule:** `conventions/r3f.md` TL;DR 2: *"`useFrame` is the hot path. No … allocations."*
- **Fix:** cache the last string and only call `set` when it changes. This repo already does it in
  `near-fill.tsx:23-27` and `rock-field.tsx:71-75`.

### P2-2 · Per-frame string and closure allocation

- `nebula-baker.ts:38`: ``return num( `Sky.${ key }` );`` builds 26 template strings per frame
  (`readInto` walks `SKY_BAKE_KEYS` (9) and `SKY_LOOK_KEYS` (17) from `update`, which runs every frame).
  Fix: precompute the `Sky.*` key arrays at module scope, as `nebula-env-shell.ts:9-16` does.
- `projectile-field.tsx:35` and `seeker-field.tsx:14`: the `readEach( ( [ … ] ) => … )` callback is a new
  closure on every `collect`, which runs every frame. Fix: hoist the callback, with the render time and the
  sink in module-scope variables.
- **Rule:** `conventions/r3f.md`: *"Zero allocation per frame … inline arrow closures all create garbage."*

### P2-3 · Duplicated `isDead`

- `ship-model.tsx:169-174` and `ship-shadow.tsx:41-46` are the same function, byte for byte.
- **Fix:** move it to one helper (for example next to the `Interp`/`Sim` traits) and import it in both.
- **Rule:** own judgment.

### P2-4 · The rail mask is built twice, and the rail runs three times

- `track-floor.tsx:113`: `buildRailMask( buildRailRuns( track, segments ), segments )` makes one float
  `DataTexture`.
- `use-rail-mask.ts:9-12` plus `monoliths.tsx:21-26` make a second, identical one from the same data.
- `track-rail.tsx:65` walks `buildRailRuns` a third time.
- **Fix:** build the runs and the mask once per track (a module cache keyed by track, or one owner that
  passes them down) and share the texture.
- **Rule:** own judgment (a duplicate GPU texture plus two extra whole-track walks at mount).

### P2-5 · A file name does not match its component

- `ship.tsx:7`: `export function Ships(…)`.
- **Rule:** `.claude/rules/react-house-style.md`: *"One component per file, name matching the file."*
- **Fix:** rename the file to `ships.tsx`.

### P2-6 · Component modules used as utility hubs

- `segmentCount` lives in `track-floor.tsx:84` and is imported by `track-rail.tsx`, `track-rim.tsx`,
  `track-seams.tsx` and `use-rail-mask.ts`.
- `splitPickupLayout` and `PickupLayouts` live in `seeker-pickups.tsx:16-29` but are used by
  `pickup-field.tsx`. `buildSeekerBody` (`:48`) is used by `seeker-bodies.tsx`.
- `sampleAt` lives in `projectile-field.tsx:11` and is imported by `seeker-field.tsx:5`.
- **Rule:** allowed by the house style (helpers may share a component file). Flagged on own judgment: each
  one couples a sibling component to a module it does not render.
- **Fix:** move them to plain modules (`track-instancing.ts`, a `pickup-layout.ts`, a `proj-sample.ts`).

### P2-7 · Dead code

| Site | What | Evidence |
|------|------|----------|
| `monolith-field.ts:36` | `pillarField` | Only `monolith-field.test.ts` calls it. |
| `sealed-block-variation.ts:31` | `sealedBlockPerimeter` | Test-only. |
| `track-floor.tsx:77` | `buildSpanGeometry` | Only `track-texture.test.ts` and `track-rail.test.ts` call it. |
| `track-materials.ts:69-70` | `ENVIRONMENTAL_MARIGOLD_FRACTION`, `ENVIRONMENTAL_MARIGOLD_INTENSITY` | No readers anywhere. |
| `sealed-block-variation.ts:11,20` | `SealedBlockWear.strength` | Never read (`grep '\.strength'` hits only `track-texture.ts` scratch strokes). |
| `track-blocks.tsx:181-182` | `uSealedBevel`, `uSealedSeamWidth` written every frame | Constants already set in `sealedBlockUniforms()` (`sealed-block-shader.ts:31-32`). |

- **Fix:** delete them. Move the test-only helpers into the tests that use them.
- **Cross-scope note (workerthree's `accent.ts`):** `setAccentShiftDeg` and `setAccentAnchor` have no
  callers outside `accent.ts`, so the live-accent machinery that `accentDerived` feeds never changes.
  Inferred from grep.

### P2-8 · Module caches that never shrink

- `track-blocks.tsx:46`: `const variations = new Map< number, SealedVariation >();` holds one entry per
  distinct block. It is never cleared when the track changes, so it grows across rooms in one tab.
- `monolith-geometry.ts:156`: the geometry cache is keyed by tuning dimensions and is never disposed, so it
  grows while dimensions are tuned in dev.
- **Fix:** key `variations` by track, or clear it when `TrackBlocks` unmounts. Dispose and clear the
  geometry cache on a rebuild, as `track-texture.ts:801-810` does for surface maps.
- **Rule:** own judgment. The size is inferred, not measured.

### P2-9 · TrackBlocks rebuilds weave segments every frame

- `track-blocks.tsx:217`: `for ( let i = i0; i <= i1; i++ ) emitSegment( e, track.segmentAt( i ) );`
  spans `(BACK + AHEAD) / SEG_LEN` = 1140 / 20 = 57 segments per frame.
- On a `weave` track, `segmentAt` is uncached and calls `merged()` 3× per segment
  (`packages/shared/src/sim/track.ts:182-186`). `groove` and `score` tracks are precomputed
  (`groove-track.ts:107-109`), and `groove` is the server default.
- **Fix:** memoise segments per track on the client side (render only, not the sim `Track`).
- **Status:** only matters on weave rooms. The cost is inferred, not measured.

### P2-10 · RearViewPass reads a tuning value during render

- `rear-view-pass.tsx:25`: `const scale = num( 'RearView.scale' );` runs in the render body and only
  updates because `useRebuildToken()` forces a re-render (`RearView.scale` has `rebuild: true`).
- This works, but a tuning read in render depends on that flag. If the flag is ever flipped to
  `rebuild: false`, the panel silently stops following the value.
- **Fix:** none required now. If touched, read it in `useFrame`, or pass it through the rebuild token
  explicitly.
- **Rule:** own judgment. Lowest priority.

## Top 5

1. **P1-2**: dispose the TrackBlocks geometries and the rear-view `ShaderMaterial`. These are verified leaks
   on every room change or mirror toggle.
2. **P1-1**: move the `pickupTaken` listeners out of `PickupField`'s `useEffect` into
   `attach-room-to-world.ts` (NN-8).
3. **P1-3**: build the nebula noise volume once. It is a ~335 ms main-thread stall on every scene mount.
4. **P2-1**: cache the colour strings before `Color.set` in `ship-model`, `ship-shadow` and `rail-glow`.
   These are per-frame regex allocations that scale with ship count.
5. **P2-4**: build the rail mask once and share it. That removes a duplicate float texture and two
   whole-track walks.
