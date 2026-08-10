# Env Lab — atmosphere variant prototype (S6 art pass, ADD §11)

Throwaway visual lab to pick the world atmosphere for SLUR. Hybrid look = **open ribbon underfoot
(existing `Track`, untouched) + distant parallax neon canyon-walls + bloom/fog/stars/gradient sky**.
Post-FX is **bloom-only** (no CA / vignette / scanline / noise — deferred).

## How to view

```
pnpm dev            # http://localhost:5173/env-lab
```

Camera auto-flies down a stretch of the neon ribbon. **Keys `1` / `2` / `3`** switch variants live.
The active variant name + key legend is in the top-left overlay.

## The three variants (one line each)

- **A · Deep-Space Drift** — sparse white stars in a pure void (no gradient dome), **far, low blue** walls,
  minimal/loose fog. Cold, empty, "racing through space".
- **B · Neon Canyon** — **close, tall magenta** walls with tight magenta haze + a violet gradient dome and
  medium stars. Enclosed, aggressive, synthwave-club.
- **C · Grid Void** — **dense** stars + cyan-tinted haze + a cyan horizon-glow dome, **mid-height cyan**
  walls; leans on the existing `Track` neon grid as the "ground grid". TRON-ish, legible, balanced.

## Variant parameter tables

All units are world-u unless noted. Every field is a commented, tweak-live param in
`apps/client/app/game/scene/env-config.ts`.

### Fog (linear, `attach="fog"` — near = fog starts, far = fully fogged)

| | color | near | far |
|---|---|---|---|
| A | `#02030a` | 140 | 640 |
| B | `#2a0a3a` | 40 | 300 |
| C | `#04101c` | 80 | 460 |

### Backdrop — base void `<color>` + optional gradient dome (camera-locked inner sphere)

| | background | dome | top → bottom | radius |
|---|---|---|---|---|
| A | `#02030a` | **off** (stars-only void) | — | — |
| B | `#0a0512` | on | `#160826` → `#3a0f4a` | 700 |
| C | `#04060c` | on | `#02060e` → `#08324a` | 750 |

### Starfield (drei `<Stars>`)

| | count | radius | depth | factor | saturation | fade | speed |
|---|---|---|---|---|---|---|---|
| A | 1200 | 320 | 80 | 4.0 | 0.0 | ✓ | 0.4 |
| B | 3000 | 250 | 60 | 5.0 | 0.2 | ✓ | 0.5 |
| C | 6000 | 280 | 100 | 4.5 | 0.1 | ✓ | 0.6 |

### Tube-walls (instanced, recycled ahead of the ship — `scenery.tsx` pattern)

`distance` = x from centre to each wall. **All > `HALF_WIDTH` (32)** → non-collidable, purely visual.
`count` = total slabs across both sides (~half per side); it is a hard instance-buffer cap.

| | distance | thickness | height min→max | spacing | count | color | intensity |
|---|---|---|---|---|---|---|---|
| A | 92 | 4 | 6 → 26 | 60 | 40 | `#1e6fff` | 2.2 |
| B | 52 | 5 | 30 → 90 | 26 | 80 | `#ff2bd6` | 2.8 |
| C | 68 | 3 | 14 → 40 | 40 | 60 | `#00e5ff` | 2.6 |

### Bloom (single global pass, at the Canvas root — driven by the active config)

| | intensity | luminanceThreshold | luminanceSmoothing |
|---|---|---|---|
| A | 1.0 | 0.45 | 0.20 |
| B | 1.4 | 0.40 | 0.25 |
| C | 1.2 | 0.42 | 0.20 |

## Reference research (what informed each variant)

- **cuberun** (our anchor, per ADD §11) builds depth from **fog + a ~10k-star field + a galaxy skybox** over
  a leapfrog neon floor. → Every variant keeps fog + drei `<Stars>`; **C** pushes the star count toward
  cuberun's density; the gradient dome stands in for the galaxy skybox (cheaper, tint-controllable).
- **TRON**: pure black void carved by neon **grid lines and light-walls** — enclosure from glowing vertical
  planes, not solid geometry. → the tube-walls are emissive slabs (black base + HDR emissive), and **C**
  leans on the existing `Track` grid as the ground plane for the classic grid-void read.
- **Wipeout**: leans on **fog for depth falloff** and **track-side structures** flicking past as the speed
  cue. → tight, tinted fog in **B** (`near 40`) plus close/tall walls (`distance 52`) give the enclosed,
  fast-parallax canyon; loose fog in **A** (`far 640`) reads as open space.
- **Synthwave**: **vertical gradient sky** (violet → magenta horizon) + grid. → the gradient dome in **B**
  (violet→magenta) and **C** (cyan horizon glow); **A** deliberately omits it for a colder deep-space void.

## r3f.md footguns hit / decisions

- **Single global `<Bloom>`** stays at the Canvas root (env-lab route), **not** inside `environment.tsx` —
  so `environment.tsx` composes the WORLD only and drops into `net-canvas`/`game-canvas` as one child
  without duplicating the bloom pass. Bloom params still travel per-variant via `config.bloom`.
- **Wall slabs = black `color` + HDR `emissive` + `toneMapped={false}`** so they cross the bloom threshold
  (the r3f.md neon recipe). `emissiveIntensity` > 1 on every variant.
- **Stars + dome must follow the camera** (`SkyFollow` group copies `camera.position` each frame) — drei
  `<Stars>` is a fixed-radius sphere at the origin; without following, the ship exits the star field within
  seconds at cruise speed. Parallax still comes from the star radius/depth, not from the follow.
- **`<Stars>` props verified against drei 10.7.8** `Stars.d.ts` (`radius/depth/count/factor/saturation/
  fade/speed`) — no guessing an API.
- **CanvasTexture disposal**: the dome gradient texture is `new`'d in `useMemo`, so per r3f.md ("manually-
  created resources are yours to dispose") a small cleanup effect disposes it on unmount / colour-change.
  If the dome ramp renders upside-down, just swap `top`/`bottom` in the config (texture-orientation is
  fiddly and not worth a shader here).
- **House style**: `<Fragment>` (no shorthand), one component per file — `Environment`, `TubeWalls`,
  `GradientDome`, `SkyFollow`, `EnvRig`, `EnvLabCanvas` each own a file; `env-config.ts` is data, not a
  component. The RR route module (`route.tsx`) keeps its multi-export (exempt).

## Files

- `apps/client/app/game/scene/environment.tsx` — `Environment` (fog + background + dome + stars + walls),
  driven by an `EnvConfig` prop. **This is the integration-ready target file** (ADD §11).
- `apps/client/app/game/scene/tube-walls.tsx` — `TubeWalls`, instanced + recycled (mirrors `scenery.tsx`).
- `apps/client/app/game/scene/gradient-dome.tsx` — `GradientDome`, optional camera-locked gradient sky.
- `apps/client/app/game/scene/sky-follow.tsx` — `SkyFollow`, camera-locked group for dome + stars.
- `apps/client/app/game/scene/env-config.ts` — the `EnvConfig` type + the 3 `ENV_VARIANTS` (all params).
- `apps/client/app/routes/env-lab/route.tsx` — RR route module (`/env-lab`).
- `apps/client/app/routes/env-lab/env-lab-canvas.tsx` — the lab Canvas + variant switch (keys 1/2/3).
- `apps/client/app/routes/env-lab/env-rig.tsx` — spawns the lab ship entity + auto-advances the flythrough.
- `apps/client/app/routes.ts` — registered `route('env-lab', …)` (only edit to an existing file).

Everything else (`net-canvas`, `game-canvas`, existing scene files) is **untouched** — this stays
throwaway. `pnpm typecheck` + `pnpm lint` are green.
