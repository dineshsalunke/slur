# Corridor lighting: what is established, and the decision to start clean

Branch `feat/test-level`. Continues `2026-09-22-monolith-and-corridor-lighting.md`.

**Decision taken at the end of this session: strip the lighting and rebuild it from
nothing.** Reasoning below. Do not continue tweaking values.

## Shipped

`f7be4af` — the corridor light the previous handover left uncommitted, unchanged.

`fede942` — four value changes. Read its body: it separates what is verified from what
is not, and the distinction matters.

| Change | Status |
|---|---|
| `backdrop.gain` 1 -> 0.4 | **Verified.** Backdrop now sits below the track in value. |
| `KEY_INTENSITY` 1 -> 0 | **Verified.** `ColdKey` was the grey mush, not the rail emitters. |
| `environment.keyIntensity` 3.2 -> 0.9 | **Improvement, cause unproven.** Reduces the lobe; does not remove it. |
| `RAIL_GLOW_INTENSITY` 1400 -> 700 | Hotspot confirmed as the point lights; softened, not solved. |

The previous handover **misattributed the grey floor** to the rail emitters. It was
`ColdKey`. That correction is the most useful single fact from this session.

## The unresolved bug

A broad lighter wash on the right of the deck, toward the camera. Still present. The
owner can see it; it is not subtle.

**Ruled out**, each by zeroing and observing: `ColdKey`, the hemisphere fill, all four
rail point lights, `envMapIntensity`, and the rail emitter uniforms (read off the GPU
confirming `rgb = 0`). Reducing `environment.keyIntensity` reduces it, so the drei
`Environment` IBL is *involved*, but the attribution is not established — see trap 3.

## Why we are starting clean: four traps that invalidated most of the session's probes

1. **Stale object handles.** Caching a mesh from `scene.traverse` across turns is
   worthless: HMR remounts the scene and the live floor became a new mesh (`id 81` ->
   `id 181`) while the cached handle stayed alive but undrawn. Every probe after the
   remount reported on a dead object — that is what produced the impossible reading
   "black albedo, zero lights, still glowing". Re-acquire by predicate every frame.
2. **Irreversible probe mutations.** `m.color.setHex(0)` cannot be undone by flipping
   the flag that set it back off. Toggle-based bisects silently accumulate state.
3. **A moving camera.** The sim runs, so no two screenshots share a view. The one
   "decisive" observation of the session — null `scene.environment`, lobe gone — had the
   ship in a visibly different place in the two frames. Not comparable. **Freeze the sim
   before any A/B.**
4. **A contested tree.** See below.

A `gl.readPixels` luminance probe was also tried and **discarded as invalid**: it
returned numbers identical to the decimal across seven different light configurations
including the restored baseline, almost certainly because the scene renders through
`postprocessing`'s composer and the read was not of the presented frame.

## Blocker — resolve before the rebuild

A second agent is relighting the same tree. The previous handover listed their files as
`track-geometry.ts`, `track-texture.ts`, `test-level-canvas.tsx`. **That list is stale.**
During this session they also rewrote `floorSurface()` in `track-materials.ts` for normal
maps, derived `FLOOR_ROUGHNESS` from a new `ROUGHNESS_MAP_BASE`, zeroed `BOUNDARY_SURFACE`
to black for their own bisect, and touched `track-boundary.tsx` and `docs/ART_MATERIALS.md`.

Floor roughness, metalness and normal maps *are* lighting inputs. A clean-room lighting
rebuild while someone else changes them will reproduce the exact confound above.

**Take a worktree, or have them stand down on `track-materials.ts` first.**

## The rebuild, when the tree is stable

1. **Freeze the sim** so A/B comparisons are valid. This is the prerequisite, not a nicety.
2. **Strip to black.** Remove every light and the drei `Environment`. Confirm the deck
   renders black. That is the known-good zero.
3. **Add one source at a time**, screenshotting after each against a frozen view, and
   write down what each one is *for*:
   - rail emitters (the corridor's own light — should be the primary source)
   - a bounce fill
   - whatever the monoliths need to read as form rather than silhouette
   - the IBL last, if at all — it is the least controllable and the current suspect
4. Judge each against `docs/art-direction/golden-reference/action-lighting.png`: dark
   graphite deck, tight marigold specular streaks, backdrop below the track in value.

## Uncommitted

`track-materials.ts` carries my `RAIL_EMITTER_INTENSITY` 60 / `RANGE` 160 / `DECAY` 2
(was 40 / 600 / 1) mixed with the other agent's WIP. Verified this session against
`three@0.185.1` `lights_pars_begin.glsl.js:56` that decay 1 over range 600 is near-flat
`1/d` across a 64u corridor, so the change is sound on the math — but it was never
isolated on screen. The rebuild supersedes it; re-derive rather than trust it.

## Still open from the previous handover

`docs/ART_MATERIALS.md` M3 specifies monoliths as *"rough dielectric ... Metalness 0.0"*;
we ship 0.3. Needs a decisions-and-departures entry per that sheet's section 7. The other
agent is editing that file.

## Reaching the live scene from the page

```js
const fiber = await import('/node_modules/.vite/deps/@react-three_fiber.js');
const st = [...fiber._roots.entries()][0][1].store.getState();
// st.scene, st.camera, st.gl
// shader uniforms of a patched material:
// st.gl.properties.get(mesh.material).uniforms.uEmitterTint.value
```
