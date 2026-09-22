# Handover — asteroids (shape + spread fixed, lighting unjudged)

Session of 2026-09-23, branch `dev`, issue #211. Picks up from the previous version of this file
(`bb2d9f5`, the renderer-only slice).

## The owner's four complaints, and what each got

> "asteroids look more like sphere, also they are not lit and are pretty much dark. also they are
> floating above the deck lets spread it out, and make sure they float in the range of above and
> below the deck. also the size seems a bit larger"

**1. Reads as a sphere — FIXED, seen on screen.** The old geometry was one shared
`SphereGeometry( 0.5, 12, 8 )`, smooth-shaded: a smooth silhouette with visible straight edges.
New `asteroid-geometry.ts` displaces an `IcosahedronGeometry` along each vertex's own direction by
four octaves of a seeded sine lobe (`DISPLACEMENT = 0.34`), then `computeVertexNormals()`. The
geometry is non-indexed, so displacement is a pure function of position and no cracks open; the
recomputed normals come out per-face, which is what makes it read as faceted rock rather than a
dented ball. `variant` and `detail` in `asteroid-config.ts` — dead until now — finally drive it:
six geometries (flank 3 variants at subdivision 3, mid 2 at 2, belt 2 at 2), so six instanced
meshes instead of three. Verified on screen: the rock is lumpy and irregular, not spherical.

**2. Not lit / dark — CHANGED BUT NOT SEEN.** `asteroid-material.ts` gained an emissive floor
(`#7d8b9c` at 0.5) and `envMapIntensity` 1.6, albedo `#5a6570` → `#6d7885`. The reasoning: the
two-tone comes from the IBL shell's own structure (a bright band over a dark ground), and raising
`envMapIntensity` alone raises the contrast with it. Emissive is the one term that is
direction-independent, so it lifts the unlit hemisphere off black without touching the lit side.
`#7d8b9c` × 0.5 lands around linear 0.11–0.17, under the 0.6 bloom threshold.

**This is the one thing still unverified.** See "Why it could not be judged" below.

**3. Floating above the deck — FIXED.** `placeAsteroid` had `y = Math.sin( angle ) * radius` with
every band's angle range positive, so every rock in every band was above the deck. It now takes a
vertical sign from `hash01( seed, 0xa )`, exactly the way `x` already took one from `SIDES`. Bands
are now rings around the corridor, not arches over it. A new test asserts every band puts rock both
above and below.

**4. Too large — CUT ~30%, not judged against the owner's baseline.** flank 10–50u → 7–34u, mid
50–200u → 34–130u, belt 200–400u → 130–270u.

**Departure from `docs/ART_SCALE_REFERENCE.md` §5**, which prints *"Asteroid S | 10–50u"*,
*"Asteroid M | 50–200u"*, *"Asteroid L | 200–400u"* and calls each "fine". Every band now sits below
its printed class floor. That sheet is Claude-owned, so if these sizes survive the owner's eye the
table wants updating; if they read too small, the honest lever is pushing `innerRadius` out rather
than going back up, because the flank band at 110u is what crowds the top of frame.

All six asteroid files pass `tsc --noEmit` and `biome check` in isolation, and the 9 tests in
`asteroid-field.test.ts` pass.

## Why the lighting could not be judged, and the fix that is now in place

The clean-origin discipline from the last handover worked: a client-only stack on `:5175`
(`CLIENT_PORT=5175 VITE_SERVER_PORT=2569 pnpm dev` from `apps/client`, no `.env` written so no other
session's ports moved) gave a store whose only non-default entries were hex-case differences. Two
frames rendered there and both were real.

**The first frame after a load is not the scene.** Frame 1 showed a near-white deck and pale rock;
frame 2, seconds later, showed the dark warm deck of the shipped look. `AuthoredEnvironment` uses
drei `<Environment frames={ Infinity }>` and its cubemap has not converged on the first frame. The
previous handover's "first screenshot after a reload comes back blank — take a second one" is
understated: the *second* one can also be wrong. Wait for a third that matches the second.

**Then the tab froze hard.** `requestAnimationFrame` stopped firing entirely — a `Runtime.evaluate`
that awaited one rAF tick timed out after 45s. The HUD kept counting (DOM, not rAF), so three
successive screenshots looked plausible while showing the *same stale frame*; two material edits
landed via HMR into a canvas that never repainted. After a reload the canvas did not come back at
all — `<Canvas>` measures before mounting its children, and in a fully backgrounded tab that
measurement never arrives, so the whole R3F tree stayed unmounted.

This is the environment wall in `.claude/memory/browser-extension-throttles-fps.md`, worse than
recorded: it does not just distort FPS, it can silently serve a stale frame as if it were current.

**The fix: `FrameTap` is mounted again.** `apps/client/app/dev/frame-tap.tsx` (built in #134,
`181a411`) photographs a route from a tab nobody is looking at — it calls R3F's `advance()` itself,
so it does not need rAF. It had been dead code since 2026-09-21, when `/art-lab`, `/art-gallery` and
the `/iso-*` routes were deleted and took its only mount sites with them. It is now one line inside
`TestLevelCanvas`'s `<WorldScene>`. Usage:

```
curl -s 'http://localhost:5175/__frame-tap/?name=asteroids&warmup=40&frames=3'
```

writes `.claude/frame-tap-refs/asteroids.png`. It still needs a *mounted* canvas, so it does not
rescue an already-frozen tab — but from a live one it beats screenshotting, because the plugin
refuses when two tabs answer and reports the frame deltas it actually captured.

## What the next session should do first

Get one live `/test-level` tab on a clean origin — the owner foregrounding the window is the
reliable way — then tap a frame and judge, in this order:

1. Does the unlit hemisphere still go flat black, or does the emissive floor separate it from
   space? `docs/art-direction/AUDIT.md` is the target: *"Cold, desaturated light separates distant
   rock/planet forms from space"*.
2. Does the lit side still blow out pale? If it does, the lever is `ASTEROID_ALBEDO` down, not
   `ASTEROID_ENV_INTENSITY` down — env intensity is also what shapes the rock.
3. Do the three bands now read as three depth layers? This was unanswerable last session and still
   is.
4. Size, against the owner's eye rather than the sheet.

**Issue #211 should still not be closed before rig issue #170** (*"The rig gives the player-facing
face of everything zero light"*). The emissive floor is a material-level workaround for a rig-level
problem; if #170 is fixed properly the floor may want lowering again.

## Keep these out of the tuning panel

The panel is being retired (bake-then-delete; 19 scene modules read `num()`/`col()`). All six
asteroid modules contain zero `num()`/`col()` calls and the material is six source constants. Keep
it that way — real constants, not new tunables.

## Shared-checkout state at handover

`packages/shared/src/sim/track.ts` and a new `packages/shared/src/sim/clearance.test.ts` are another
session's in-flight work and `pnpm typecheck` fails on them repo-wide (`Cannot find name 'Run'`,
`sliceCentres`, `openRunsAtSlice`). `pnpm lint` has two errors, in `monolith-field.test.ts` and
`track-rail.tsx` — also not this session's. Nothing here touches those files. Committed with
explicit pathspecs, per `.claude/memory/shared-checkout-shares-one-git-index.md`.

## Also briefed and unstarted

`.claude/phases/HANDOVER-block-mechanics.md` (`a551808`): block collisions bouncing instead of
killing, and 4u–8u organic block heights, the second blocked by the single-slice clearance sampler
at `packages/shared/src/sim/track.ts:414` — which is what the session above is in.
