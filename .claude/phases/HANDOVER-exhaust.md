# Handover — the split-crown exhaust and engine light

Session of 2026-09-22/23, continued 2026-09-23. Branch `dev`, shared checkout with
`slur-supervisor` and `atmospherics`.

## State: shipped on `dev`. Colour ramp root-caused, fixed and judged on screen. `EngineLight` next.

The 2026-09-22 half of this note (GLB contents, port offsets, file table, the `BackSide` decision,
the priority-0.25 lag fix) is unchanged and still correct — read it below. What follows replaces its
"Blocked on" and "Next steps" sections.

`ea7aa5c feat(scene): the split-crown exhaust plume and its engine light` is **committed**. An
earlier version of this note said "NOT committed"; that was stale and caused `slur-supervisor` to
start judging the same work as an unowned handover. Both agents have since stood down.

## What got established on screen (2026-09-23)

**The shader compiles. There is no GLSL error.** The whole mechanism works — geometry, instancing,
the `aDrive` attribute, per-ship port placement. Proved by forcing `Exhaust.length` 20 / `glow` 15 /
`idle` 1 / `spread` 4 and getting a screen-filling plume.

**At schema defaults the plume was invisible, for two compounding reasons.** `length` 4.5 x the
idle ramp 0.35 = **1.6u**, aimed straight down the chase camera's own axis and swallowed by the
ship's silhouette; and `EngineLight.intensity` 18 / `distance` 14 lays a deck ellipse brighter than
the plume itself (`slur-supervisor`'s finding). The four bright grilles visible at the tail are
**not** the plume — they are the GLB's authored `Engine_core` emissive (strength 1.7), which
`applyGraphite()` skips. Judge the plume with `EngineLight.intensity` at 0.

### The real bug: the colour ramp was multiplied out

Found by `slur-supervisor`, confirmed by reading the shader. The old fragment was:

```glsl
float body = pow( facing, uSoftness ) * pow( 1.0 - vAxial, uFalloff );
gl_FragColor = vec4( mix( uHot, uCool, vAxial ) * body * vGlow, 1.0 );
```

`uCool` only reaches full weight at `vAxial` = 1, where `pow( 1.0 - vAxial, uFalloff )` is exactly
0. **The marigold end of the ramp is multiplied to black by construction.** The plume could only
ever render as `uHot` plus bloom — which is exactly what it did: a flat cream wedge with no marigold
anywhere. No amount of dialling `cool` could have fixed it.

**Fix shipped in `dd24d04` on `dev`:** colour is now a function of *intensity*, not of axial
position.

```glsl
float body = pow( facing, uSoftness ) * pow( 1.0 - vAxial, uFalloff );
vec3 tint = mix( uCool, uHot, pow( body, uHeat ) );
gl_FragColor = vec4( tint * body * vGlow, 1.0 );
```

Bright core → `uHot`; dim halo and tip → `uCool`, still dissolving to black through marigold as
`body` → 0. New `uHeat` uniform sets how tight the white core is, exposed as `Exhaust.heat`.

### The handover's tuning target was wrong

The 09-22 note says *"Plume length reads as roughly one hull length at cruise"*. It does not. I
cropped and sampled `docs/art-direction/golden-reference/cruise-lighting.png` (scratch crop +
sample scripts built on `scripts/deck-survey.mjs`'s `decode()`):

| Feature | Measured |
|---|---|
| Core | `#fdfaf8` — blown, two round cores, barely protruding past the hull |
| Halo | `#ab6a3c` — tight, immediately around the core |
| Deck streak | `#95511a` |
| Deck pool | `#3a2c22` against a clean deck of `#23272a` |

The reference plume has **no visible axial jet at all** from the chase camera. What reads at speed
is the **deck reflection**, not the plume — which is `EngineLight`'s job, not the shader's. The core
disc is roughly 0.12 of the wingspan. Tune toward "compact blown core + tight marigold halo + long
warm deck streak", not toward a long jet.

## Files changed this session — all in `dd24d04` on `dev`

| File | Change |
|---|---|
| `game/scene/exhaust-material.ts` | `uHeat` uniform; colour ramp decoupled from the falloff term |
| `game/scene/exhaust-field.tsx` | push `Exhaust.heat` in `syncPalette` |
| `dev/tuning-schema.ts` | add `Exhaust.heat` 1.0; `length` 4.5 → 1.4; `glow` 3.2 → 11 |
| `dev/tuning-panel.tsx` | expose `heat` |

`pnpm typecheck` green, `pnpm test` green (164 client + 4 server), `biome check` clean on all four.
**The committed numbers were seen on screen** at `/test-level` — four blown white cores with a
marigold halo and a warm deck streak, at idle and under throttle. An earlier draft of this note
carried 2.2 / 6 / 1.6; those were the reasoned values, superseded by judging them.

The trick that made judging cheap: `EngineLight.intensity` 0 and `Exhaust.idle` 1 — full drive while
stationary takes speed out of the equation entirely and beats trying to drive to cruise.

## Next steps

1. **`EngineLight`** for the deck streak `#95511a` / pool `#3a2c22`. `slur-supervisor`'s eye
   put it at `intensity` 6 / `distance` 22 / `lift` 1.2 / `back` 2.4 — unmeasured, but a better
   starting point than the schema's 18 / 14 / 0.5 / 3.4.
2. **Then the mirror.** Unchanged from before: if a bloom pass in the rear-view is acceptable,
   consider it; otherwise keep the cheap route, and do not tune `glow` by how it looks in the inset.

## Environment lessons that cost real time

- **The tuning store trap, in its nastiest form.** Editing a default in `tuning-schema.ts` kills
  every persisted entry for that key (`tuning-persist.ts` restores only when
  `entry.from === fallback`). Worse: after my schema edit and a reload, **leva re-persisted the old
  in-memory values against the new defaults** — `length` `{from: 2.2, value: 4.5}`, `glow`
  `{from: 6, value: 3.2}`. Those pass the `from` test, so the scene silently kept running the old
  numbers and my edit looked like a no-op. **After any `tuning-schema.ts` edit, delete that
  subsystem's keys from `slur.tuning.v1` and reload.** Delete only your own prefix — the store is
  shared per origin and other agents are live on `:5173`.
- **`atmospherics` is propagating a wrong liveness test** (`e.value !== e.from`). It never consults
  the schema. An entry is live iff `entry.from` equals the *current* schema default.
- **`document.hidden === false` does not mean the tab is running.** I measured 1 rAF/sec while
  "visible". Count frames. But `hasFocus` flips to false the moment the owner clicks away, and
  `window.focus()` does not reliably get it back.
- **A `computer` screenshot can come back fully lit while the rAF probe reads 1 fps** — the
  extension drives its own frame for capture (`slur-supervisor`'s finding, reproduced here). So a
  *still frame* is judgeable even when the page looks frozen; only motion and fps are not. Captures
  are intermittent, though — expect black frames and retry.
- **Synthetic `KeyboardEvent`s work** (`keyboard.ts` listens on `window` and reads `e.code`), and a
  keydown with no matching keyup sticks the throttle on. But the sim only advances while frames run,
  so driving to cruise this way is slow and unreliable. Forcing `Exhaust.idle` 1 is strictly better
  for judging the plume.

## Correction carried from `rearview-mirror`

The 09-22 note's closing claim — *"`DEFAULT_TUNING.halfL` is 1.26 while the model is 3.0 half-long"*
— is **false**. `split-crown` is class `freighter`, `halfL` 3.0, an exact match; 1.26 is the
Fighter's. All five ships were measured to under 0.4%. There is no collision/hull mismatch.

---

# Original note (2026-09-22) — everything below is unchanged and still accurate

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

**Owner decisions taken that session:** slot jet (not round cores — the ports are louvred
letterboxes, and four round cores in a 2x2 would read as mush); mirror bloom deferred, cheap route
for now; engine light on the **local ship only**.

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

Edited: `dev/tuning-schema.ts`, `dev/tuning-panel.tsx`, `scene/world-scene.tsx`.

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
`#include <colorspace_fragment>`. Verified in `three@0.185.1` source:
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

## Still parked from before

`HANDOVER-hud.md` stands unchanged: the `/game/:roomId` reconcile half of issue #209 is not started,
plus `» BOOST ACTIVE`, the threat HUD, and the flat SVG power gem.
