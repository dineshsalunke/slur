# 2026-09-21 — the test level, and one scene for both canvases

Branch `feat/test-level`. Issue **#192**. Written to be read cold.

The four art items in `.claude/backlog.md` — scene lighting, track art, vehicle art, block art — had no
surface to work on. `/art-lab`, `/art-gallery` and the `/iso-*` routes went in #184. What remained was
`/env-lab`, which renders a scrolling grid plane and not the real track, and a hosted `/game/:roomId` room,
which needs a server, a host and a start-race on every iteration.

## 1. The decision, and the rule it reopens

`/test-level` is a local flyable mirror of the game scene. It has no netcode.

CLAUDE.md said: *"`/solo` was removed (`52f5a04`) and stays removed."* That rule is now narrower. Read the
removal commit: *"Removes the temporary local /solo prototype (game-canvas/game-loop/route) now that env-lab
is the dev-render harness."* The deleted `game-canvas.tsx` rendered `<Track />` (the grid plane) and
`<Scenery count={50} />`. It had no real track, no environment and no lighting.

`/solo` died of **drift**, not of being local. It was a second scene that fell behind the first one.

So the rule keeps its force and changes its wording: **a duplicate scene stays removed; a local mount of the
real scene is allowed.** The owner amends CLAUDE.md.

## 2. How drift is made structurally impossible

`WorldScene` (`app/game/scene/world-scene.tsx`) holds the room-independent half of the scene:

```
Environment · SceneLighting · ExplosionField · HitSpark · TrackView · FinishGate · Ships
{ children }
EffectComposer > TunedBloom
```

`NetCanvas` and `TestLevelCanvas` both mount **the same component**. Neither owns a copy. A visual change
lands in both or in neither.

The room-coupled parts pass as `children`: `NetLoop`, `PickupField`, `ProjectileField`, `GameAudio` and
`RemoteEngineAudio` for the net canvas; `LocalShip` and `LocalLoop` for the test level. `children` renders
before `EffectComposer`, so both canvases keep one child order and one post chain. A `children` slot was
chosen over exporting the composer separately for that reason.

Rejected: a test route that mounts the same leaf components itself (two mount lists, the `/solo` failure
slowed but not removed), and a local stand-in for the Colyseus room (zero divergence, but the stand-in must
satisfy the room's whole surface).

## 3. The dead system that was already wrong

`flightSystem` was exported from `app/game/ecs/systems.ts` and imported by nobody. It was the `/solo`
leftover, and it was stale:

```ts
simulate( s, input, dt, DEFAULT_TUNING );
```

No `track` argument, so no collision, and `DEFAULT_TUNING` instead of the per-ship tuning the five-class
roster needs. It is replaced by `localFlightSystem( world, dt, track )`, which queries `Sim, Prev, Net,
LocalPlayer` and calls `simulate( s, input, dt, tuningForShip( net.shipId ), track )` — the same call
`netFlightSystem` makes, without the predictor.

## 4. The level

A fixed procgen descriptor, resolved at module scope in `test-level-canvas.tsx`:

```
{ kind: 'procgen', seed: 20260921, tier: 0, length: 40 }
```

`ProcgenDescriptor.length` **is** wired — `makeProcgenTrack` reads `const length = d.length || TRACK_SEGMENTS`
(`sim/track.ts:337`). `tier` is read nowhere. The backlog's "length/tier reserved UNWIRED" was half stale.

40 segments × `SEG_LEN` 20 = **finishZ 800**, about 11 seconds of flight. Measured content at that seed:
**67 blocks · 2 gap segments · 8 plain segments · 12 pickup anchors**. The plain segments give clean deck for
the lighting and material work; the blocks, gaps and finish gate cover the rest of the art items.

The authored `TrackDescriptor` branch stays unbuilt. `track-provider.ts:10` still throws
`'authored provider not built (ADR-002+)'`. Hand-placing a block belongs to **#24**, not here.

Pickups and projectiles are left out. Both take `room`, and no art item covers them.

## 5. Why the track is a module constant

`TestLevelCanvas` holds **zero hooks**. The descriptor and the resolved track are module constants, so the
Canvas never re-renders. That is issue **#166** — *bloom + React 19 ref crashes every dev lab on any Canvas
re-render* — designed around rather than hit.

`route.tsx` also holds zero hooks, which `scripts/check-canvas-isolation.mjs` requires of any route entry
module that renders a Canvas. The guard now reports `TestLevelCanvas` among its known wrappers.

Every effect sits in one leaf, `LocalShip`: the keyboard attach, the ECS spawn, and the 1-5 class swap. The
swap writes `Net.shipId` directly instead of sending `SET_CLASS_MESSAGE`, because there is no server.
`LocalShip` also clears `localRole.spectating`, which is a module singleton and can carry `true` in from a
client-side navigation out of a game room.

`ShipView` already tolerated a missing `Net` trait (`net?.shipId ?? DEFAULT_SHIP`), but the ship is spawned
with `Net` anyway, because `tuningForShip` and `updateChaseCamera` both read `shipId`.

## 6. The debug panel was already there

`app/dev/debug-panel.tsx` covers bloom, deck roughness and metalness, rail emitter, marigold reference and
boundary, cold key, ambient, and the chase camera, with a copy-to-source button. It was already mounted in
`NetCanvas` under `import.meta.env.DEV`. The test level mounts it too. Nothing was built.

## 7. Verification

`pnpm typecheck` green. `pnpm lint` green — canvas-isolation reports 5 clean route entries, comment ratchet
reports 8 changed files and no comment lines gained. `pnpm test` green: 93 client, 4 server, shared suites.
`pnpm build` green. `GET /test-level` returns 200.

**Visual gate PASSED** — `claude-in-chrome`, shared tab, 2026-09-21. The route renders: deck, marigold
rails, both block families, tube walls, starfield, ship and the tuning panel. `W` advances the ship, the
chase camera follows, and the green finish gate comes into view. Console is clean; the only warning is a
pre-existing `THREE.Clock` deprecation from the library.

Blocks render in two placeholder families — `LETHAL_SURFACE` (pink) and `DRAG_SURFACE` (white), both in
`track-blocks.tsx`. These are what the non-destructible block-art item replaces.

## 8. Left open

- The CLAUDE.md `/solo` wording. The owner amends it.
- Camera far plane. R3F defaults to 1000 and no client Canvas sets it (**#128**). `finishZ` is 800, so the
  gate is inside the default frustum here, but a longer test level would clip.
- Hand-placed geometry for close-up work, via the authored provider (**#24**).
