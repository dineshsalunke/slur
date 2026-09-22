# Handover — the split-crown exhaust and engine light

Session of 2026-09-22/23. Branch `dev`, shared checkout with `slur-supervisor` (sealed-block
surfaces, scene-fog) and `rearview-mirror` (rear-view, tuning-schema).

## State: written, typechecks, lints, tests pass — NOT yet seen on screen, NOT committed

The owner reported one defect against a live build and it is fixed (see "The lag bug"). No visual
tuning pass has happened yet, because the driven tab keeps freezing (see "Blocked on").

## What the GLB actually contains

`apps/client/public/models/ships/split-crown.glb` — 2.5u wide x 1.0u tall x 6.0u long, origin at
the belly centre, nose at -z, tail at +z. Two meshes independently define **four** exhaust ports:

| Mesh | Material | Content | Per-port size |
|---|---|---|---|
| `Engine_core` | emissive `#ff7607`, `KHR_materials_emissive_strength` 1.7 | 12 slats = 4 grilles x 3 slats, flat plate at z = 2.995 | 0.34w x 0.131h, slats 0.021 tall on a 0.055 pitch |
| `Marigold_emission` (rear shells) | emissive `#e95304`, strength 0.8 | 4 bezel plates at z = 2.987, one behind each grille | 0.40w x 0.205h |

Port centres in model space: `(+/-0.31, 0.245, 2.99)` and `(+/-0.31, 0.605, 2.99)` — the lower and
upper pairs that make it the *split* crown.

`ship-visuals.ts:15` gives split-crown `scale: 1, lift: 0, facing: [ 0, Math.PI, 0 ]`. The yaw puts
the tail at ship-local -z, so the ports land at ship-local `(+/-0.31, 0.245 | 0.605, -2.99)` facing
-z. No scale, no lift: these are direct offsets from the ship group.

**Owner decisions taken this session:** slot jet (not round cores — the ports are louvred
letterboxes, and four round cores in a 2x2 would read as mush); mirror bloom deferred, cheap route
for now; engine light on the **local ship only**.

**Model/collision conformance — CHECKED, nothing wrong.** An earlier draft of this note claimed
`DEFAULT_TUNING.halfL` 1.26 against a 3.0 half-long model, i.e. collision 2.4x shorter than the hull.
**That was an error: it compared the Split Crown's hull against the Fighter's box.** `split-crown`
maps to class `freighter` (`ship-classes.ts:102`), tuning `halfW 1.25, halfL 3.0`. `DEFAULT_TUNING`
is the *Fighter's* tuning, carried by the Challenger.

Measured 2026-09-23 — POSITION accessor bounds over every mesh primitive, times the
`ship-visuals.ts` scale, against halfW/halfL x2:

| Ship | Class | Model (scaled) | Collision box | Delta |
|---|---|---|---|---|
| Executioner | interceptor | 2.00 x 1.84u | 2.00 x 1.84u | +0.2% |
| Challenger | fighter | 2.60 x 2.52u | 2.60 x 2.52u | -0.0% |
| Bob | comet | 2.20 x 1.18u | 2.20 x 1.18u | +0.4% |
| Dispatcher | phantom | 2.40 x 5.03u | 2.40 x 5.02u | -0.1% |
| Split Crown | freighter | 2.50 x 6.00u | 2.50 x 6.00u | +0.0% |

Every box is within 0.4% of its hull. The roster is sound; there is nothing to fix here. Node
transforms were checked separately and are identity on all five (0 non-identity nodes in each), so
the scaled accessor bounds are the true bounds.

This is the failure mode GDD §0 warns about — *"numbers were written by hand against the grid
instead of derived"* — in reverse: a correct number checked against the wrong row. Resolve a ship's
box through `tuningForShip()`, never through `DEFAULT_TUNING`.

## Files

New, all in `apps/client/app/game/scene/`:

| File | Role |
|---|---|
| `exhaust-ports.ts` | The four port offsets + `PORT_WIDTH`/`PORT_HEIGHT`, keyed by ship id. Only `split-crown` has an entry, so every other ship emits nothing. |
| `exhaust-geometry.ts` | Tapered slot prism: 18 rings x 12-point superellipse, unit length along -z, `aAxial` 0..1 baked per vertex. `slotProfile()` holds the flare-then-taper curve. |
| `exhaust-material.ts` | `ShaderMaterial`, additive, `depthWrite: false`, `side: BackSide`. |
| `exhaust-drive.ts` | Throttle 0..1 from `Sim.vz` (local) or the interp buffer (remote), over `DEFAULT_TUNING.maxCruise` (55). Returns `DRIVE_EXTINGUISHED` (-1) for dead. |
| `exhaust-field.tsx` | One `InstancedMesh`, 48 slots (12 ships x 4), one `useFrame`. Zero per-ship React. |
| `engine-light.tsx` | One `PointLight`, local ship only. |
| `exhaust-geometry.test.ts` | 9 tests, green. |

Edited: `dev/tuning-schema.ts` and `dev/tuning-panel.tsx` (appended `Exhaust` + `EngineLight` groups
*after* the supervisor's `Block` group and rearview's `RearView` lines, as both peers asked);
`scene/world-scene.tsx` (two imports, two mounts).

## Decisions that are load-bearing

**`BackSide` + `abs(dot(N,V))` instead of billboards.** On a tube, the back wall's normal points at
the camera along the centre line and grazes at the silhouette, so `pow(abs(dot(N,V)), uSoftness)`
gives a bright core with soft edges for free. Weighed against additive billboard quads, GPU
particles, drei `<Trail>`, post-chain light shafts, and emissive-only. Billboards lose because the
rear-view is a **second render of the same scene graph from a different camera** (`rear-view.tsx`,
priority 0.5) — a CPU-oriented card would be correct in the main view and edge-on in the mirror.
Post-chain shafts lose because the mirror pass has no postfx at all. The fragment term is computed
per-camera by construction, so both passes are right with no opt-in.

**Non-uniform instance scale would skew those normals**, so the shader corrects them analytically:
`normalize( vec3( normal.xy / widen, normal.z / stretch ) )`. One instanced `aDrive` vec3 carries
`(stretch, widen, brightness)`, which is also why there is no `instanceColor` and no per-ship
material — one material, one draw call, for the whole field.

**`ShaderMaterial`, not `toneMapped={false}`.** `.claude/rules/r3f-rendering.md` bans that flag as of
2026-09-22. The fragment shader ends with `#include <tonemapping_fragment>` and
`#include <colorspace_fragment>`. Verified in `three@0.185.1` source this session:
`resolveIncludes` runs unconditionally for non-raw shader materials (`WebGLProgram.js:790/794`), and
`USE_INSTANCING` plus the `instanceMatrix` attribute declaration are injected for them too
(`WebGLProgram.js:439, 485, 605`). Since the composer forces `NoToneMapping` on the renderer, the
tonemapping chunk compiles to nothing today — it is there so the material stays correct if that
changes.

## The lag bug — fixed, and the reason matters

**Symptom the owner reported:** the plume detached from the ship as speed rose, and lagged with a
damped wobble when strafing.

**Cause:** `syncRenderSystem` writes `group.position` inside the `LocalLoop`/`NetLoop` `useFrame`,
which is priority 0. `ExhaustField` was also priority 0. Verified in `@react-three/fiber@9.7.0`:
`internal.subscribers.sort( ( a, b ) => a.priority - b.priority )`
(`events-156d8d12.esm.js:1129`) is a **stable** sort, so equal priorities run in *mount order* —
and `WorldScene` mounts before `LocalLoop`. The field therefore read last frame's ship position. At
`maxCruise` 55 on a 60Hz frame that is a **0.92u** gap, scaling with speed and lateral on strafe.

**Fix:** `ExhaustField` and `EngineLight` now subscribe at priority `0.25` (`AFTER_RENDER_SYNC`),
which is strictly after every priority-0 subscriber and before rear-view (0.5) and the
`EffectComposer` (1).

**Consequence to know about:** a `useFrame` priority > 0 makes r3f skip its automatic render
(`if ( ! state.internal.priority && state.gl.render ) ...`). That is already the case because the
composer sits at priority 1, so nothing changed — but if `<SceneEffects>` were ever removed from
`WorldScene`, these two priorities would silently blank the canvas. Worth a comment in any PR that
touches the composer's presence.

**The general lesson:** any new `useFrame` that reads a ship `Object3D` must run after the loop that
writes it. Priority 0 is not safe for that; mount order decides it and mount order is not stable
against refactors.

## Blocked on

The `/test-level` tab reports `document.hidden === true` and rAF never fires — the freeze recorded
in `.claude/memory/browser-extension-throttles-fps.md`. The canvas screenshots black and per-frame
readouts stay empty. Clicking into the page did **not** wake it this time. R3F 9 does not expose the
root store on the canvas element (no `__r3f`, and the store lives in the reconciler tree, not the
DOM fiber tree), so frames cannot be driven by hand from the page either. The shader has therefore
never been compiled or linked — **a GLSL error would not have surfaced yet.** First thing to check.

## Next steps

1. **Get a frame.** Foreground the Chrome window, hold W, confirm the plume tracks the ship now.
   Check the console for a `THREE.WebGLProgram` compile error before judging anything visual.
2. **Tune against `docs/art-direction/golden-reference/cruise-lighting.png`.** Sampled targets from
   that image: core blows to `#fdfaf6`, halo `#a5581f`, mid-plume `#733202`, tip dissolving into the
   deck; the deck pool lifts the neutral `#1f2125` to `#403229`. Plume length reads as roughly one
   hull length at cruise. `CRUISE-LIGHTING.md`: *"Cruise uses short exhaust without the central
   projectile or dramatic peripheral blur."*
3. **Defaults that are guesses, not measurements:** `Exhaust.length` 4.5, `Exhaust.glow` 3.2
   (no confidence it clears `Bloom.threshold` 0.6), `EngineLight.intensity` 18, `EngineLight.back`
   3.4. All live in the Leva panel under **Exhaust** and **Engine light**.
4. **Then revisit the mirror.** The owner's call was: if a bloom pass in the rear-view is
   acceptable, consider it; otherwise keep the cheap route. The plume will read flat in the inset
   until then — per rearview-mirror, do **not** tune `glow` by how it looks there.
5. **`Engine_core`'s authored emissive (1.7) may already carry the nozzle** — `ship-model.tsx:88`
   `applyGraphite()` skips any material with non-zero emissive, so it survives. Look before adding
   anything more at the nozzle mouth.

## Peer state at handover

- **slur-supervisor** holds `sealed-block-*.ts`, `track-blocks.tsx`, `scene-fog.tsx`,
  `world-scene.tsx`. They warned: do not run repo-wide `pnpm format` while peers have uncommitted
  work — use `pnpm exec biome check --write <paths>`. This session followed that.
- **rearview-mirror** holds `rear-view*.{tsx,ts}` and four `RearView.*` lines in `tuning-schema.ts`.
- `pnpm lint` is **red on `dev`** for reasons that are not this work: findings in `track-rail.tsx`,
  `track-texture.ts`, `world-scene.tsx`, `monolith-field.test.ts`, `landing-scene.tsx`, all
  supervisor in-flight. `world-scene.tsx` also has a pre-existing unused-`blocks`-parameter warning.

## Still parked from before

`HANDOVER-hud.md` stands unchanged: the `/game/:roomId` reconcile half of issue #209 is not started,
plus `» BOOST ACTIVE`, the threat HUD, and the flat SVG power gem.
