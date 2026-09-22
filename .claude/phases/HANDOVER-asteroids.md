# Handover — asteroids (shape, spread, density and tone landed; form still rig-limited)

Session of 2026-09-23, branch `dev`, issue #211. Two commits on top of the renderer-only slice
(`bb2d9f5`): `ffa25fb` then the config/material pass below.

## The owner's four complaints

> "asteroids look more like sphere, also they are not lit and are pretty much dark. also they are
> floating above the deck lets spread it out, and make sure they float in the range of above and
> below the deck. also the size seems a bit larger"

**1. Reads as a sphere — FIXED, seen on screen.** The old geometry was one shared
`SphereGeometry( 0.5, 12, 8 )`, smooth-shaded. New `asteroid-geometry.ts` displaces an
`IcosahedronGeometry` along each vertex's own direction by four octaves of a seeded sine lobe
(`DISPLACEMENT = 0.34`), then `computeVertexNormals()`. The geometry is non-indexed, so displacement
is a pure function of position and no cracks open; the recomputed normals come out per-face, which
is what makes it read as faceted rock rather than a dented ball. `variant` and `detail` in
`asteroid-config.ts` — dead until now — pick among seven geometries, so seven instanced meshes.

**2. Floating above the deck — FIXED.** `placeAsteroid` had `y = Math.sin( angle ) * radius` with
every band's angle range positive, so every rock in every band was above the deck. It now takes a
vertical sign from `hash01( seed, 0xa )`, exactly the way `x` already took one from `SIDES`. A new
test asserts every band puts rock both above and below.

**3. Size — CUT, and the bands were pulled inward.** The cut alone was wrong on its own: the
reference (below) shows rubble that reads *large in frame because it is close*, not because the
rocks are big. So sizes came down and radii came in together.

| band | radius (was → now) | size (was → now) | spacing | density |
|---|---|---|---|---|
| flank | 110–200 → **90–180** | 10–50 → **4–18** | 60 → **12** | 0.55 → **1** |
| mid | 240–520 → **180–400** | 50–200 → **15–60** | 40 → **16** | 0.8 → **1** |
| belt | 500–700 → **400–700** | 200–400 → **50–180** | 20 | 1 |

`limit` (the per-window budget, still not enforced anywhere) was raised to match: 96/128/160 →
176/132/112. Roughly 2600 instances over the 8400u test track, seven draw calls, ~800k triangles.
`CORRIDOR_CLEARANCE` (70u) still holds with margin — flank inner 90 minus half of an 18u rock is 81.

**Departure from `docs/ART_SCALE_REFERENCE.md` §5**, which prints *"Asteroid S | 10–50u"*,
*"Asteroid M | 50–200u"*, *"Asteroid L | 200–400u"* and calls each "fine". Every band now sits below
its printed class floor. That sheet is Claude-owned; if these survive the owner's eye it wants
updating.

**4. Not lit / dark — MUCH IMPROVED, not finished.** Four material passes, each tapped and looked
at. Final: albedo `#4a545f`, `emissive #2b333d` at 0.1, `envMapIntensity` 2.6, roughness 0.95.

What each pass taught, because the wrong lever is tempting at every step:

- **A large emissive floor kills form.** `#7d8b9c` at 0.5 lifted the dark side off black and turned
  every rock into a flat paper cutout. Emissive is direction-independent, which is exactly why it
  fixes blackness and exactly why it destroys shape. Keep it at a token 0.1.
- **`envMapIntensity` is the form lever, not the brightness lever.** The IBL shell is sky `#97979a`
  at 0.4 over ground `#343639` at 0.22 — about 1.8:1 — so raising env intensity amplifies that
  top-to-bottom ratio and that is where the shading gradient comes from. At 2.6 the near rock has
  real light and shadow faces.
- **Albedo is the brightness lever.** At `#79838f` the rocks read *lighter* than the nebula backdrop
  and popped out like snow. In `cruise-lighting.png` the rubble is consistently **darker than the
  sky behind it**, with lit top edges. `#4a545f` puts it back.
- **Fog was the single biggest cause, and the first probe of it was wrong.** `meshStandardMaterial`
  has `fog: true` by default, so every rock was painted by the scene `THREE.Fog`. The bands sit at
  90–700u against a `Fog.far` of 420, so most of the field was drawn as near-pure fog colour — flat,
  formless silhouettes pasted onto a backdrop that is *not* fogged, since the nebula is
  `scene.background`. `fog={ false }` on the asteroid material, and the same rock in the same frame
  goes from pale blobs to shaded form with light and shadow faces.

  This was first probed by raising the `Fog.far` schema default to 1400 and tapping, and the probe
  said fog was innocent. It was wrong: the ship had drifted off the deck between the two frames, so
  the comparison was across two different camera positions. **A look probe is only valid when the
  camera has not moved** — reload to spawn and tap immediately, or change nothing else.

  `fog={ false }` is consistent with what the asteroids are: background, the same class as
  `scene.background` and `DeepSpaceSky`, neither of which is fogged. The cost is that the nearest
  flank rock at 90u loses the aerial integration fog would give it — a fog factor of 0.13, not
  visible. The albedo had been dropped to `#4a545f` to fight the fog wash and was lifted back to
  `#586470` once the wash was gone.

**Check the other environment meshes for the same bug.** `monolith-group.tsx` sets no `fog` prop
either, so the monoliths are fogged too. That is probably right for them — they stand beside the
corridor, well inside `Fog.far` — but nothing has been measured. Anything that lives past 420u and
is meant to read as form, not haze, has this bug.

**What is still wrong, and why it is not an asteroid problem.** Small distant rubble reads flat
because the scene has no directional key worth the name — `BackFill` is a `directionalLight` at
intensity 0.35 aimed away from the camera, and `NearFill` is a `pointLight` whose `distance` cutoff
of 45u never reaches rock at 90u or beyond. That is rig issue **#170**, *"The rig gives the
player-facing face of everything zero light"*. The reference's rubble gets its chunky light/dark
faces from a real key light. **#211 should not close before #170.** Resist fixing it inside the
asteroid material: the self-contained options (a layer-filtered light, a wrap-lambert term via
`onBeforeCompile`) are all workarounds for a scene-wide gap, and CLAUDE.md #13 applies.

## The frame tap is working again, and it is how any of this got judged

The previous handover ended blocked: the extension backgrounds the driven tab, `rAF` stops firing,
and three successive screenshots served the *same stale frame* while the DOM HUD kept counting —
two material edits had HMR'd into a canvas that never repainted. Worse, after a reload `<Canvas>`
never mounted at all: r3f measures before mounting its children and the ResizeObserver never
delivers in a hidden tab. Confirmed directly — `document.querySelector('canvas')` was 300×150, the
default unsized element, so the whole R3F tree including `FrameTap` was unmounted.

**Two fixes, both durable:**

1. **`FrameTap` is mounted again.** `apps/client/app/dev/frame-tap.tsx` (built in #134, `181a411`)
   photographs a route by calling r3f's `advance()` itself, so it does not need `rAF`. It had been
   dead code since 2026-09-21, when `/art-lab`, `/art-gallery` and the `/iso-*` routes were deleted
   and took its only mount sites with them. It is now one line inside `TestLevelCanvas`.

2. **Drive a separate headless Chrome instead of the extension.** Headless renders offscreen, so
   `document.hidden` is false, the ResizeObserver fires, the canvas mounts, and the tap answers.

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --user-data-dir=<scratchpad>/chrome-profile --window-size=1600,900 \
  --remote-debugging-port=9333 --enable-unsafe-swiftshader \
  http://localhost:5175/test-level &

curl -s 'http://localhost:5175/__frame-tap/?name=asteroids&warmup=60&frames=3&timeout=40000'
```

writes `.claude/frame-tap-refs/asteroids.png`, which `Read` renders. `--enable-unsafe-swiftshader`
is what gets WebGL up without a GPU context. This is a real edit-tap-look loop at a few seconds a
turn, and it never needs the owner to touch the window.

Caveats found using it:
- **Only one page may answer.** The plugin refuses when two tabs respond. Keep the extension tab off
  `/test-level`, or point it elsewhere.
- **The first rendered frame is not the scene.** `AuthoredEnvironment` is drei
  `<Environment frames={ Infinity }>` and its cubemap has not converged; frame 1 showed a near-white
  deck and pale rock, the real dark look only arrived seconds later. Use `warmup=60`.
- **The spawn framing has no ship and a low camera.** Judge the sky and the flanks from it; do not
  read anything into the deck framing.
- `sips --cropOffset` pads rather than crops past the edge — it is not usable for zooming into a
  corner of a tap. Left unsolved.

## What to do next

1. Resolve **#170**, then re-judge the rock. That is the whole remaining gap against
   `cruise-lighting.png`.
2. Judge density and size against the owner's eye. The reference reads as a *swarm*; this is now
   much closer than the sparse giants it started as, but it is a matter of taste and the numbers are
   four config lines.
3. Whether the three bands read as three depth layers is *still* unanswered, two sessions running.
4. The owner's mid-band crop of `cruise-lighting.png`, outstanding since the atmospherics handover.

## Keep these out of the tuning panel

The panel is being retired (bake-then-delete; 19 scene modules read `num()`/`col()`). All six
asteroid modules contain zero `num()`/`col()` calls and the material is six source constants. Keep
it that way — real constants, not new tunables.

## Shared-checkout state at handover

`packages/shared/src/sim/{track.ts,constants.ts,block-depth.ts,clearance.test.ts}` are another
session's in-flight work and `pnpm typecheck` fails on them repo-wide. `pnpm lint` errors live in
`monolith-field.test.ts` and `track-rail.tsx`, also not this session's. Nothing here touches those
files; everything here passes `tsc --noEmit`, `biome check` and its 9 tests in isolation. Committed
with explicit pathspecs, per `.claude/memory/shared-checkout-shares-one-git-index.md`.

Someone raised `TEST_LEVEL_SEGMENTS` 120 → 420 mid-session; the field spans `finishZ + 400`, so that
is what the ~2600-instance count above is measured against.

## Also briefed and unstarted

`.claude/phases/HANDOVER-block-mechanics.md` (`a551808`): block collisions bouncing instead of
killing, and 4u–8u organic block heights, the second blocked by the single-slice clearance sampler
at `packages/shared/src/sim/track.ts:414` — which is what the session above is in.
