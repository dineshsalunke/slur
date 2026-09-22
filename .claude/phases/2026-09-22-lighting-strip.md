# Lighting strip and the /env-lab retirement

**Date:** 2026-09-22 · **Issue:** #196 · **PR:** #198 · **Branch:** `art/clear-lighting-stack`

## Why

The owner is not satisfied with the scene lighting. The decision is to rebuild it from an
image-based source. This phase clears the old lighting first, so that the new lighting is judged
against a black frame and not against the rig it replaces.

## What was removed

Everything that put energy into a surface, not only `*Light` elements.

| File | What it was |
|------|-------------|
| `scene/gradient-ibl.tsx` | a synthetic 128x64 half-float equirect fed to drei `<Environment map>` |
| `scene/fill-lights.tsx` | one `pointLight` moved onto the camera each frame |
| `scene/emitter-array.ts` | a hand-rolled analytic tube light injected after `#include <lights_fragment_begin>`, writing into `reflectedLight.directDiffuse` and `directSpecular`. 12 slots, fed per frame from the rail runs. This was the dominant deck light |
| `scene/star-light.tsx`, `scene/sky-environment.tsx` | a directional key and three `Lightformer` cards, both already switched off at their only call site |
| `scene/scene-bloom.tsx`, `dev/tone-tuning.tsx`, `dev/exposure-tuning.tsx`, `dev/exposure-effect.ts` | the full `EffectComposer` chain |
| `scene/lighting.tsx` | the wrapper for the IBL and the fill light |
| `routes/env-lab/*`, `scene/track.tsx` | the retired route and its grid-void track |

## What stayed, and why

**Emissive materials stayed.** The owner asked for this. Rail strips, gap rims, deck seams, monolith
seams and the sealed-block seam term are surfaces that glow. They illuminate nothing else and they
survive a lighting rebuild unchanged. With all other light gone, they are the only thing that makes
the shapes readable.

**`GameEnvironment` stayed.** The nebula backdrop, the star field and the monoliths are background
and geometry.

**`scene/environment.tsx`, `env-config.ts` and `gradient-dome.tsx` stayed.** The landing page still
renders them. An earlier claim in this session, that the `/env-lab` removal would also remove the
last fog in the client, was wrong: `routes/home/landing-scene.tsx` imports the same module.

## Tone mapping moved from the composer to `gl`

The composer held the only tone curve. That is why every gameplay Canvas carried `flat`. With the
composer removed, `flat` would leave raw linear output that clips. `net-canvas.tsx` and
`routes/test-level/test-level-canvas.tsx` now drop `flat` and pass
`gl={ { toneMapping: THREE.NeutralToneMapping } }`. The curve is unchanged.
`routes/home/landing-scene.tsx` was not touched; it keeps its own `<Bloom>`.

## Debug panel

19 tunables lost their consumer: the `tone.*`, `ibl.*`, `fill.*`, `bloom.*` and `emitter.*` groups.
`rail.emissive` and `rim.emissive` moved from the empty "Rail emitter" group into "Rail".

Removing the last entry of `CHOICE_SPECS` collapsed the generic choice machinery to `never`, so the
choice control was removed as well: `dev/tuning-choice.tsx`, `ChoiceSpec`, `choice()`, `setChoice()`,
`choiceSpec()`, and the panel and section branches. Numbers and colors are not affected. A future
selector is a small re-add against the same pattern.

## State at handover

PR #198 is open against `dev`. `pnpm typecheck`, `pnpm test` (141 client, 4 server, shared) and
`pnpm lint` are all clean. `/test-level` and `/game/:roomId` render near-black except emissive
surfaces. This is the intended baseline.

## Follow-on decision: delete the tunables system

The first pass removed only the lighting groups from the tuning panel. The owner's intent was wider:
remove all of it. Decision taken 2026-09-22, after the owner saw the panel with eight groups still
standing. The reason is focus: a bare scene keeps attention on the lighting. Knobs come back only
when the rebuild needs them.

The panel is not inert UI. `num()` and `col()` are read every frame by the deck, rail, monolith,
block and groove materials, and by the test-level track descriptor. Full deletion therefore means
replacing about 40 call sites with constants, at the values the specs hold now.

Scope: delete `dev/tunables.ts`, `dev/use-tunables.ts`, `dev/tuning-panel.tsx`,
`dev/tuning-section.tsx`, `dev/tuning-number.tsx`, `dev/tuning-color.tsx`. Give each subsystem its
own constants, taken from the current `NUMBER_SPECS` and `COLOR_SPECS` defaults. Keep `FpsReadout`.
The rebuild token drops out with the panel, so `useRebuildToken()` call sites become plain `useMemo`
dependencies.

## Next

1. Merge #198.
2. Decide the light source. The options weighed in session, not yet decided:
   - a captured or authored `.hdr` / `.exr` equirect through drei `<Environment files>`;
   - the nebula backdrop promoted from `scene.background` to `scene.environment`, so that the sky
     lights the scene. It is an LDR JPG, so it has no true highlight range for the metals;
   - `Lightformer` cards, the pattern that was just removed;
   - a corrected colour gradient, the pattern that was just removed.
3. Add a row for this note to `.claude/phases/INDEX.md`. The index landed on `dev` in PR #197, after
   this branch was cut.

## Related

- [[2026-09-22-lighting-rebuild]] — the earlier lighting attempt this supersedes.
- [[2026-09-22-one-tone-map-and-the-emitter-wash]] — where the emitter array and the single tone map
  were established.
