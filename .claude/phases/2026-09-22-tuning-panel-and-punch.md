# The tuning panel, and the six asks that came with it

Branch `feat/test-level`. Continues `2026-09-22-lighting-rebuild.md` and
`2026-09-22-emitter-reach-and-groove-flare.md`, both of which closed with *"the debug panel the owner
asked for is still the right next step"*. It is built. Every value below was then dialled by the
owner in a live `/test-level` tab and is shipped as the spec default.

## The mechanism decision (CLAUDE.md #13)

A live-editable control surface that drives scene values without per-frame React re-renders, and
that can force a **canvas texture rebuild** — `trackSurfaceMaps()` memoised into a module-level
`cached` and HMR would not regenerate it, so every finding in the last two sessions cost a full
reload.

| Candidate | Weighed |
|---|---|
| **leva** | The r3f-community default. New dependency past the catalog + `minimumReleaseAge` gate, pulls zustand, and its React-state model re-renders subscribers. Would still need custom wiring for the texture rebuild. |
| **lil-gui / dat.GUI** | Imperative, tiny, no React. Still a new dependency, and its own stylesheet fights Tailwind v4, which is already the project's 2D UI tool. |
| **URL search params + a RR8 loader** | Idiomatic for the router, but one reload per tweak — that is today's slow loop, not a fix. |
| **`window.__slur` console handle only** | No UI at all, and the previous handover proved console probing unreliable: `import('/node_modules/.vite/deps/…')` returns a *different module instance* from the app's. |
| **`import.meta.hot.accept` on a constants module** | Still a file edit per value. |
| **Hand-rolled DOM panel over a module-singleton store** ✅ | No dependency. The panel lives **outside `<Canvas>`**, so its state changes never touch the scene tree. Scene side reads in `useFrame` (zero re-render) for scalars, and via `useSyncExternalStore` only where a rebuild is genuinely needed. Reuses Tailwind. CLAUDE.md #8: the store is a module singleton, not tied to any mount. |

## Shape

- `dev/tunables.ts` — the store. `NUMBER_SPECS` / `COLOR_SPECS` / `CHOICE_SPECS` are the **single
  source of default values for the whole look**; the scene reads them, so "tune it and copy" is the
  authoring loop. Persists to `localStorage` under `slur.tunables`. Two counters: `version` (any
  change) and `rebuild` (only keys marked `rebuild: true`).
- `dev/use-tunables.ts` — `useTunableVersion()` / `useRebuildToken()`, both `useSyncExternalStore`.
- `dev/tuning-panel.tsx` + `tuning-number` / `tuning-color` / `tuning-choice` — one subscription per
  **row**, per CLAUDE.md #10. Toggle with `` ` ``. Mounted in `test-level-canvas.tsx` behind
  `import.meta.env.DEV`, as a sibling of `<Canvas>`.
- In DEV the store is also on `window.slur` (`setNum`/`num`/`setChoice`/`resetTunables`) — a sweep is
  one line of JS instead of a slider drag, and unlike the fiber-module handle it is the *same*
  instance the app uses.

### The bug that cost the first pass: Chrome restores form state and React accepts it

On every reload Chrome restored the sliders and the `<select>` to arbitrary previous values and fired
change events into the controlled inputs, which wrote them to the store and persisted them. It looks
exactly like a store bug. `autoComplete="off"` alone did **not** stop it for `range` or `select`.

The fix is `dev/from-user.ts`: a change is accepted only when `document.activeElement === e.currentTarget`.
A real drag or a select focuses the control first; a restore does not. Verified: reload with
`localStorage` cleared now lands on defaults.

## The six asks

### 1 + 6 — over-lit, and does tone mapping help

Yes, and it was **not working at all**. Verified in the installed
`@react-three/postprocessing@3.0.4` build this session (`dist/index.js`, the `EffectComposer`
component): `A(()=>{const C=d.toneMapping; return d.toneMapping=_e,…},[d])` — the composer forces
`gl.toneMapping = NoToneMapping` for as long as it is mounted, and restores it on unmount. So
`renderer.toneMapping` and `toneMappingExposure` are dead while bloom is on, and the frame the owner
approved is an **untonemapped** frame. It shipped briefly as `None` for exactly that reason; once the
selector worked the owner picked **`Reinhard`**, which is the default now.

Tone mapping is now a `ToneMappingEffect` **inside** the composer, driven imperatively.
`postprocessing`'s `ToneMappingEffect` has no exposure, so `dev/exposure-effect.ts` is a nine-line
`Effect` that multiplies before it.

### 2 — the deck grooves

Owner's instruction taken literally: bevel out, joint metalness 0.2, roughness up. All of it is now a
dial, and `track-texture.ts` is parameterised rather than a wall of module constants —
`surfaceMaps( SurfaceParams )` with a params-keyed cache that the store's rebuild counter disposes
and clears. `paintNormal` returns early when `wallTilt` is 0, so the bevel can be removed outright.

Landed values (owner): width 0.15u, bevel tilt 0.05, bevel share 0.05, metalness 0.95, roughness
0.95, darkening 1.0, cavity 0.25.

### 3 — the emitter stopping midway

`RAIL_EMITTER_RANGE` was 160u. Verified in `three@0.185.1`,
`ShaderChunk/lights_pars_begin.glsl.js:65`: the window is
`pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) )` — 0.88 at half the cutoff, 0.35 at
0.8, 0.12 at 0.9. Useful reach is ~0.85 × range, so 160u died at ~135u while the floor draws to
`AHEAD = 900`. Range is now **690** with decay 2 and intensity 10 — the owner's second pass moved
decay 1.2 → 2 and intensity 32.5 → 10, which tightens the pool at the rail instead of flooding the
deck, and is much closer to the reference.

### 4 — a deck-like monolith material

`monolithProfileGeometry` now emits a **uv attribute**. The geometry is unit-scale and instanced with
a non-uniform matrix, so uvs are baked from the shape's real dimensions (`[width, bodySpan, depth]`,
passed as `MonolithSize`, part of the geometry cache key): side faces take u from ring perimeter
distance in world units and v from world height, caps from world x/z. Everything is divided by
`TEX_SPAN_X` so the deck's uv convention is shared.

Tiling is then `texture.repeat = TEX_SPAN_X / ( plate * COLS )`, which means **plate size never
changes geometry** — no floor rebuild when the owner drags it. Canvas resolution is fixed at
1024² and `PX_PER_U` derives from the span, so a 17u plate costs no more memory than a 4u one (it is
coarser: ~15 px/u against 64).

Owner's monolith: plate 17u, metalness 0.9, roughness 0.35, env map 1.55, plate colour `#313b45`,
seam emissive 10.

### 5 — bloom back, subtle

`<EffectComposer multisampling={0}>` is restored in `world-scene.tsx`. Bloom defaults 0.45 / 0.9 /
0.2 / 0.5 — threshold 0.9 catches the HDR marigold and nothing on the deck.

**The bloom sliders did nothing at first, for a second composer reason.** `Bloom` is
`wrapEffect(BloomEffect)`: new props build a new `BloomEffect`, but `EffectComposer` assembles its
`EffectPass` list in a `useLayoutEffect` keyed on `[composer, children, camera, …]`, and `children`
is the JSX element from `WorldScene`, which never re-renders. The new effect was never registered.
Both `SceneBloom` and `ToneTuning` now construct **one** effect in `useMemo([])`, render it through
`<primitive dispose={null}>`, and mutate it in `useFrame` — the same discipline as the materials.
Selecting `None` sets `BlendFunction.SKIP` rather than unmounting the primitive, for the same reason:
removing a child would not rebuild the pass list.

## Verified in the browser

Panel renders, defaults survive a reload, and all four previously-dead knobs move pixels (bloom
0.45→3.5 / threshold 0.9→0.2, mapping None→AgX, exposure 1→0.5). Scene renders correctly after the
emitter-loop change with no shader error. `pnpm typecheck`, `pnpm test` (96 shared / 4 server /
128 client) and `pnpm lint` green.

**Vite gotcha, hit once:** adding new modules while the page is live left Vite serving a stale
transform — `ReferenceError: RenderScale is not defined` while the source was correct and `tsc`
passed. A navigation with a fresh query string cleared it; a dev-server restart would too. Do not go
hunting for a real bug when the error names a symbol you just added.

## Current defaults = the owner's approved look

`NUMBER_SPECS` / `COLOR_SPECS` / `CHOICE_SPECS` in `dev/tunables.ts` **are** the look — there is no
second place to change it. As shipped:

```
Render   dpr 2
Tone     exposure 1 · mapping Reinhard
IBL      intensity 2 · zenith #26292c · horizon #303439 · nadir #1e2023
Bloom    intensity 0.45 · threshold 0.9 · smoothing 0.2 · radius 0.5
Deck     metalness 0.9 · roughness 0.35 · env 1 · normal 0.8 · plate 4u · #23272a
Groove   width 0.15u · bevel tilt 0.05 · bevel share 0.05 · metal 0.95 · rough 0.95
         darkening 1 · cavity 0.25
Emitter  intensity 10 · range 690u · decay 2 · rail emissive 2
Monolith metalness 0.9 · roughness 0.35 · env 1.55 · plate 17u · seam 10 · #313b45
```

## Files added or reshaped

| File | What |
|---|---|
| `dev/tunables.ts` | the store + every default value |
| `dev/use-tunables.ts` | `useTunableVersion` / `useRebuildToken` |
| `dev/from-user.ts` | the Chrome form-restore guard |
| `dev/tuning-panel.tsx` + `tuning-number/-color/-choice.tsx` | the panel, one subscription per row |
| `dev/frame-meter.ts` + `dev/fps-readout.tsx` | fps · cpu ms · worst frame |
| `dev/render-scale.tsx` | `perf.dpr` → `setDpr` |
| `dev/tone-tuning.tsx` + `dev/exposure-effect.ts` | tone mapping + exposure, inside the composer |
| `game/scene/track-texture.ts` | parameterised `surfaceMaps( SurfaceParams )` + rebuild cache |
| `game/scene/track-materials.ts` | `floorSurface()` / `monolithBodySurface()` from the store |
| `game/scene/monolith-geometry.ts` | uv attribute, `MonolithSize` |
| `game/scene/emitter-array.ts` | `uEmitterCount`, 12 slots |
| `game/scene/scene-bloom.tsx`, `world-scene.tsx`, `monolith-group.tsx`, `track-floor.tsx`, `track-boundary.tsx`, `gradient-ibl.tsx`, `routes/test-level/test-level-canvas.tsx` | wiring |

## Frame rate — reported, then **resolved: not a real regression**

**Outcome first: the owner ran the same build in Zen and got 120 fps.** There is no engine-side
frame-rate problem, and the investigation below is kept only so nobody re-runs it. The Chrome
instance that looked slow was the one being driven by the browser extension, which backgrounds the
tab; everything it reported about wall-clock frame rate was the throttle.

The two optimisations found along the way were kept, because both are strict wins with no look
change (see *Pixels* and *the emitter loop* below). The one thing that was **reverted**: `perf.dpr`
briefly defaulted to 1.5, which is a real sharpness cut. With perf a non-issue that is a quality
regression bought for nothing, so the default is back to **2** and it stays a slider.

**I could not measure wall-clock frame rate.** Driving the tab through the browser extension backgrounds it, Chrome
throttles `requestAnimationFrame` to 30 Hz when `document.visibilityState === 'hidden'`, and with the
tab fully hidden rAF stops firing altogether (a 120-frame sampler simply never completed and the CDP
call timed out). An early reading of "30 fps, unchanged when the canvas dropped from 6.9 MP to
0.86 MP" is **an artifact of that throttle and proves nothing** — do not trust it, and do not repeat
the experiment this way.

So the panel now carries an **FPS readout** (`dev/frame-meter.ts` + `dev/fps-readout.tsx`): frames
counted in R3F's `addAfterEffect` on a module singleton — the mechanism `conventions/r3f.md` names
for work outside the Canvas — averaged over 500 ms windows, plus the worst frame in each window.
Amber under 55, red under 40. The owner can read a number on their own screen; I cannot.

Ruled out by reading the installed source this session:

- `ToneMappingEffect.mode` is **self-guarded** (`if (this.mode === value) return`), so the per-frame
  assignment in `ToneTuning` cannot recompile the shader.
- `ToneMappingEffect.update()` only runs its `LuminancePass` when `adaptiveLuminancePass.enabled`,
  which is true only for `REINHARD2_ADAPTIVE`. Reinhard costs nothing extra.
- `LuminanceMaterial`'s `threshold`/`smoothing` setters touch `defines` but never set
  `needsUpdate`, so the per-frame bloom writes cannot recompile either.
- The panel is not the cause of a steady-state cost: it is DOM outside the Canvas and re-renders only
  on a change. Its `backdrop-blur` was dropped anyway — blurring a region over a canvas that changes
  every frame forces a re-composite every frame, and it bought nothing.

What is left, and what was done about it: **this session put the `EffectComposer` back**, which turns
one pass into a scene render into a HalfFloat target plus a bloom pass with its mip chain plus a
merged exposure/tone-mapping pass. That cost scales with pixel count, and **no canvas in the repo
sets `dpr`** — R3F defaults to `window.devicePixelRatio`, so a Retina display renders every one of
those passes at 4× the CSS pixels.

`dev/render-scale.tsx` makes it a dial: `perf.dpr` (default **1.5**, clamped to the real device
ratio) applied through `state.setDpr` from a `useFrame` guarded on `gl.getPixelRatio()`. Verified —
the drawing buffer went 2250×1135 → 1125×567 at 0.75. `setDpr` confirmed present on `RootState` in
`@react-three/fiber@9.7.0` (`dist/declarations/src/core/store.d.ts:118`).

### The one number that did survive the throttle: **cpu 1.4 ms**

The meter also reports CPU time per frame — `addEffect` (before the loop) to `addAfterEffect` (after
it), covering every `useFrame` plus the renderer's draw submission. It read **1.4 ms** in the same
frame where wall-clock `fps` was garbage from the throttle, and CPU timing does not care about
vsync.

**That settles the class of the problem.** 1.4 ms against a 16.7 ms budget means nothing this session
added on the CPU — the tunable reads in `useFrame`, the store, the panel — is anywhere near the
cause. The frame is **GPU-bound**. So the levers are pixels and per-fragment cost, and 60 fps is
reachable.

### Pixels: `perf.dpr`

Before this session **no canvas in the repo set `dpr`**, so R3F used `window.devicePixelRatio` — on a
Retina display every composer pass runs at 4× the CSS pixels. That is now a dial:
`dev/render-scale.tsx` applies `perf.dpr` through `state.setDpr` from a `useFrame` guarded on
`gl.getPixelRatio()`, clamped to the real device ratio. Verified: the drawing buffer went
2250×1135 → 1125×567 at 0.75. **Default 2** — full quality, since perf turned out fine. Drop it to
1.0–1.5 if a weaker machine ever needs the headroom; `setDpr` is confirmed on `RootState` in
`@react-three/fiber@9.7.0` (`dist/declarations/src/core/store.d.ts:118`).

### Per-fragment cost: the emitter loop was the worst thing in the frame

`emitter-array.ts` ran a loop of `EMITTER_SLOTS` iterations **per fragment**, each doing a texture
fetch, two closest-point solves, `getDistanceAttenuation` (with `pow4` + `pow2`) and a full
`BRDF_GGX_Multiscatter`. It is patched onto the deck, which covers most of the screen. The
`if ( emTint.w <= 0.0 ) continue;` guard bought nothing: a GPU executes every iteration in lockstep
across the warp whenever any lane is still active, so parked slots were paid for in full.

Two changes, no look change:

- **`uEmitterCount` uniform + `if ( emI >= uEmitterCount ) break;`.** `feedEmitters` already fills
  slots 0..n-1 contiguously, so the bound is *uniform across every fragment* — a coherent branch the
  whole warp exits together, unlike the per-slot `continue` it replaces.
- **`EMITTER_SLOTS` 24 → 12.** `selectNearest` sorts by distance and fills nearest-first, so the
  slots this drops are the farthest runs — the most attenuated ones, at decay 2 especially.

Worst case that is a 2× cut on the most expensive shader in the scene; typical case more, because
the loop now stops at the real run count.

**If a frame-rate problem ever does appear**, the order is: read `cpu` in the panel first — if it is
still ~1.4 ms the CPU is innocent and only GPU work matters. Then bloom's `levels` (4), then whether
the bloom pass earns its keep, then the ship/monolith emitter patches, then `deck.envMapIntensity`
→ 0 as a bisect to price the IBL. And measure in a **foreground** browser, never through the
extension.

## Still open

- **The rail's top face is far wider than the reference's cord.** `BOUNDARY_W = 1.0u` renders a
  1u-wide fully-emissive band; `cruise-lighting.png` shows a line nearer 0.2–0.3u. This is the
  largest remaining departure from the reference and it is **geometry, not a dial** — `BOUNDARY_W`
  also feeds collision, so it needs a real decision, not a tweak.
- **Panel is `/test-level` only.** Mounting it in `/game/:roomId` is one line in `GameShell`, not done.
- **`ART_MATERIALS.md` §7 owes its decisions-and-departures entries** — now seven: deck metalness,
  plate aspect, monolith metalness/roughness, IBL band colours, the joint cross-section, the
  monolith now being an M1-family plate surface rather than §M3 *"rough dielectric … Metalness 0.0"*,
  and the tone-mapping choice.
- **The revert table from `2026-09-22-lighting-rebuild.md` is now partly discharged**: bloom +
  composer are back, `RAIL_EMITTER_INTENSITY` is live again as `emitter.intensity`. Still stripped:
  **fog** (`game-environment.tsx`) and the **sim freeze on `P`** (`dev/sim-freeze.ts`).
- **The panel's own values are the config.** If a value should become permanent, it is edited in
  `NUMBER_SPECS` — do not reintroduce a parallel constant in `track-materials.ts`. The panel's `copy`
  button emits the whole set as JSON, which is the intended handoff into a spec edit.
- **`EMITTER_SLOTS` is now 12, down from 24.** If a track ever puts more than twelve rail runs inside
  `emitter.range` at once, the farthest are dropped rather than dimmed. Not observed on the
  `/test-level` seed; watch for a rail that pops as you approach.
- Nothing is committed. The tree also holds the gap-teeth / rim work from the parallel agent — stage
  by path. Suggested split: the tuning panel + look changes as one commit, the emitter-loop and dpr
  work as a second, the gap/rim work by its own paths.
- Screenshots after a reload need ~8s **and a click into the canvas**; an early capture returns a
  pure black frame that looks exactly like a lighting bug. Hit this three times this session.
