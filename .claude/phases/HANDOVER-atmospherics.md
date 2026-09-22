# Handover — atmospherics (fog shipped, asteroids next)

Session of 2026-09-22/23, branch `dev`, issue #210. Owner scope: "a bit of atmospherics — asteroid
belt and the fog", fog first.

## Shipped

Two commits, both on `dev`, both green on `pnpm typecheck` / `pnpm lint` / `pnpm test`:

- `24bf931` feat(client): grade the corridor into cold linear fog (#210)
- `03a28c8` fix(client): fog to the backdrop's horizon value, not to black (#210)

Files: new `apps/client/app/game/scene/scene-fog.tsx`, new
`apps/client/app/game/scene/backdrop.ts`, plus edits to `world-scene.tsx`,
`game-environment.tsx`, `dev/tuning-schema.ts`, `dev/tuning-panel.tsx`, `docs/ADD.md`.

`SceneFog` builds one `THREE.Fog`, attaches it with `<primitive object={fog} attach="fog" />`, and
pushes `Fog.near` / `Fog.far` / `Fog.color` into that object in `useFrame`. It renders from
`world-scene.tsx`, so `/game/:roomId` and `/test-level` both get it and the rear-view mirror
inherits it. Defaults: near 40, far 420, colour `BACKDROP_HORIZON`.

## The one real lesson

The first defaults (`#070a10`, 120/900) looked like nothing, and the owner said so. Cause: the
scene background is the nebula backdrop, whose mean value where the corridor vanishes is `#212e39`
— measured by drawing `/textures/nebula-backdrop.jpg` to a 2D canvas in the page and averaging the
centre. Fogging toward a value DARKER than the sky behind the geometry turns distant forms into
harder silhouettes, the opposite of atmospheric perspective. Fog colour must track the backdrop, so
it now lives beside `BACKDROP_URL` in `backdrop.ts` as `BACKDROP_HORIZON`. **If the backdrop image
is ever replaced, re-measure and update that constant.**

Rejected mechanisms are recorded in issue #210: `fogExp2` (no far handle), per-material fog uniform,
a camera-locked fog shell, a depth-based post pass, reusing the landing page's `env-config.ts`.

## Open look calls (owner has not ruled)

1. **Rails are fogged like everything else.** They dim noticeably by ~350u. If the owner wants the
   marigold to run further, it is `fog={false}` on the rail-light strips in `rail-lights.tsx` — but
   that makes them never fade, which the reference does not do either. Alternative: `Fog.far` 600,
   which keeps rails longer but weakens the monolith dissolve.
2. **`Fog.far` 420 vs 600** — 420 dissolves the far monoliths convincingly, 600 preserves rail runs.
   420 shipped.

## Next: the asteroid belt

Half of it already exists and **nothing imports either file**:

- `apps/client/app/game/scene/asteroid-config.ts` — three bands matching the reference's three depth
  layers: `flank` (110–200u, size 10–50), `mid` (240–520u, size 50–200), `belt` (500–700u, size
  200–400), each with `CORRIDOR_CLEARANCE = HALF_WIDTH + RAIL_W + 36`.
- `apps/client/app/game/scene/asteroid-field.ts` — deterministic hash placement, `asteroidField()`
  over a z-window, plus `asteroidClearance()`. `asteroid-field.test.ts` passes and asserts every
  placement clears the corridor.

So the slice is a renderer, not a design: an instanced `<AsteroidField>` component plus a cold
desaturated rock material. Per `docs/art-direction/AUDIT.md`, asteroids are lit but never emissive —
*"Cold, desaturated light separates distant rock/planet forms from space."*

The owner offered a crop of `docs/art-direction/golden-reference/cruise-lighting.png`; I asked for
the mid-band chunks sitting between the monoliths, since that layer's size and lighting have to sit
against geometry we already render. **That crop had not arrived when this session ended.**

File an issue before building it (CONTRIBUTING §2). Nothing is filed for asteroids yet.

## Environment gotchas worth carrying forward

- **Other sessions are in this checkout.** `hud` had uncommitted exhaust/engine-light work in
  `tuning-schema.ts`, `tuning-panel.tsx` and `world-scene.tsx` throughout. Staging technique for
  that case is in `.claude/memory/shared-checkout-shares-one-git-index.md`; `rearview-mirror` was
  committing the tree and has been told my work is already in.
- **A/B a tunable without the panel** by writing `localStorage['slur.tuning.v1']` — entries are
  `{value, from}` where `from` must equal the current schema default or the override is ignored.
  Clear only your own keys afterwards; the store is shared per origin.
- **The leva panel is taller than the viewport** and did not scroll for me. The `Fog` folder sits
  below `Fill` and is off-screen until you collapse `Environment`. `CMD+SHIFT+L` filters by control
  name (`near`, `far`), not folder name. Worth a fix by whoever owns the panel.
- **First screenshot after a reload comes back blank** (the known backgrounded-tab freeze). Take a
  second one.
