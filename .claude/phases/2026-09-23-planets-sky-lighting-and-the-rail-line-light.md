# Planets, the sky as the light, and the rail line light

**Date:** 2026-09-23 · **Branch:** `art/sky-planets-lighting` (stacked on `art/procedural-nebula-215`, PR #221) · **Issue:** #215 follow-on

Implementation session, same stream as the nebula sky. Three asks from the owner: distant planets with
crescents, lighting that matches `docs/art-direction/golden-reference/`, then 90 fps at DPR 2 with at
most 5 to 10% quality loss.

## What landed

| commit | what |
|---|---|
| `ba04183` | planets in the sky pass; the nebula cube becomes `scene.environment`; baker split into probe, env shell, planets |
| `426f952` | owner's sky and rock values as defaults; cold fill in the env cube; `Ship.envMapIntensity`; planet relief and corona; canvas without MSAA or alpha; two rail lights instead of six |
| `a7093ee` | analytic rail line light in the deck material replaces the area lights |

## The sky lights the scene now

The drei gradient IBL (a flat grey sphere at 0.6, re-rendered every frame) is gone. The baker renders
its still shade plus a ground disc, a thin marigold band and a cold fill term into a 128² cube and
PMREM-filters it once per tunable change. Deck, rails, monoliths, blocks, ships and rocks all reflect
the same sky the player sees. The flat grey sphere was why the deck rendered pale grey against a
near-black reference.

**The cold fill is what makes the deck show its texture.** With a pure nebula cube the metal deck
mirrors black and reads featureless, which the owner called "the road seems to lack texture". A small
cold constant in the light cube (`Env.fillColor` × `Env.fillIntensity`, weighted toward the zenith)
gives the satin sheen the cruise board has, and the panel wear and seams come back with it.

**The ship needed its own env intensity.** At metalness 1 the hull mirrored the whole nebula at
`Environment.intensity`, which the owner read as "too bright on the vehicle and unable to focus".
`Ship.envMapIntensity` at 0.45 is the fix; it is a per-material knob, not a scene one.

## Planets are analytic

A disc test per direction in the same sky pass: sphere normal from the offset to the planet centre,
terminator from a sun aimed by `Sky.planetPhase` (angle from the view axis) and `Sky.planetTilt`
(rotation around the planet), thin lit limb, corona outside the limb on the sun side
(`Sky.planetGlow`), bump-mapped relief from finite differences of a terrain field built from the noise
volume (`Sky.planetRelief`). The owner set relief to 0.05: at 21° the full relief read as static.
Two moons are anchored to the planet direction at fixed offsets (`Sky.moons`, `Sky.moonSize`).

Directions use `skyDirection( bearing, elevation )` from `sky-config.ts`, and the chase camera looks
down +Z, so a positive bearing is screen-right. The first render had the planet on the wrong side.

## The rail lights were the frame

DPR 2, 3456×2160, M3 Pro, GPU-synced medians while driving:

| state | ms/frame |
|---|---|
| six `RectAreaLight`s (as merged) | 17.7 |
| same, lights hidden | 9.6 |
| two lights, canvas without MSAA or alpha | 12.1 |
| line light in the deck material | 10.0 |
| every mesh hidden (post, rear view, HUD, present) | 5.4 |

three.js evaluates every area light with LTC on every fragment of every standard material, and the
six lights slid along the rails so every deck fragment paid for all six. The replacement is two
infinite lines in the floor material's `lights_fragment_end`: wrapped `1/d` diffuse plus a specular
streak from the closest point on the line to the reflection ray. It reads as the same warm halo along
both rails. Blocks and monoliths lose the area lights and keep their marigold from the environment
band, which was already doing most of that work.

## Measuring under ANGLE Metal

Plain `requestAnimationFrame` timing reported 2.2 ms for a full frame with the post chain removed and
swung by 2× between identical runs. It does not track the GPU. The meter that works, and the one
session 2 already recorded, is a one-pixel `readPixels` after each frame, median of the deltas over
three seconds, best of two page loads, with a warm-up load first because the first load pays shader
compilation for every variant it meets while driving. Baseline first and last in each run, because
the machine was shared with the owner's own browser tab for most of the session.

With the post chain removed the synced meter still reported 2.7 ms for the full scene, which the
per-toggle deltas inside the composer path contradict. Either the composer path makes the scene
itself 4 ms dearer, or `readPixels` on the default framebuffer does not wait under ANGLE Metal. Not
resolved. The composer path is the shipped path, and every number above is from it.

## Departures and open threads

- `Env.skyColor` and `Env.skyIntensity` as a grey sphere are gone; `Env.skyIntensity` is now the gain
  on the nebula in the light cube.
- `RailLight.span`, `thickness`, `stride`, `offset` are gone with the lights.
- The owner said pits are hard to track. The dark deck with the cold fill is a better ground for the
  marigold lips than the grey one was, but nothing was changed for pits specifically. Unverified.
- Real-device fps with vsync is the owner's to read off the HUD; the harness runs unthrottled.
- The rock material still evaluates the nebula key light plus the scene lights; at 0.9 ms it is not the
  next target. The 5.4 ms floor is.
- PR #221 is still open. This branch stacks on it, so its PR against `dev` carries both.

## Related

- [[2026-09-22-graphite-family-and-the-hdri-plan]] — planned an HDRI picker for the IBL; the nebula
  cube is that environment, and it is the one the player sees.
- [[2026-09-22-one-tone-map-and-the-emitter-wash]] — "the sky reads navy where the reference nebula
  is desaturated grey"; the hue and saturation knobs closed that, and the owner's values are the defaults.
