# The flickering seams are the near plane, and the bloom is the exposure order

Branch `feat/test-level`. Picks up `2026-09-22-rail-ownership-and-slab-depth.md`. Uncommitted at
handover. `pnpm typecheck` · `pnpm test` (96 shared + 128 client + 4 server) · `pnpm lint` all green;
the 7 lint warnings are pre-existing.

Owner raised two things: *"i noticed the edge seams on the gaps flicker a lot and i mean a lot while
moving"* and *"moving the ship close to the rail, looses the emitter and lighting and also the bloom
doesn't show up"*. Three separate causes; two fixed in code, one is a dial.

## The browser was not usable, again

`/test-level` was opened through the extension and the canvas rendered black at 0 fps. A 500 ms rAF
sampling loop never resolved and `Runtime.evaluate` timed out after 45 s — the exact failure
`.claude/memory/browser-extension-throttles-fps.md` records. Everything below was settled by
arithmetic and by reading the installed packages.

One thing the extension *is* good for: `localStorage.getItem( 'slur.tunables' )` is a synchronous
read and returned the owner's live panel state without a frame ever rendering. That is how the bloom
numbers below were obtained rather than guessed.

## 1. The gap seams flicker — depth-buffer precision

**Verified-this-session.** R3F 9.7.0 builds the default camera at
`node_modules/.pnpm/@react-three+fiber@9.7.0_.../dist/events-156d8d12.esm.js:15771`:

```js
const camera = isCamera ? cameraOptions : orthographic ? new THREE.OrthographicCamera( 0, 0, 0, 0, 0.1, 1000 ) : new THREE.PerspectiveCamera( 75, 0, 0.1, 1000 );
```

Both Canvases passed only `fov` and `position`, so **near was 0.1 and far 1000**.

Depth resolution for a 24-bit buffer is `dz ≈ z² · ( f − n ) / ( 2 f n ) · 2 / 2^24`. At n = 0.1,
f = 1000 that is `5.95e-7 · z²`:

| distance | quantum (n = 0.1) | quantum (n = 1) |
|---|---|---|
| 100u | 0.006u | 0.0006u |
| 300u | 0.054u | 0.0054u |
| 900u | 0.48u | 0.048u |

`CORD_RADIUS` is 0.08u (`track-rim.tsx:12`) and `AHEAD` is 900u (`track-instancing.ts:3`). So beyond
roughly 300u **the whole rim cord fits inside one depth quantum of the deck it lies on**, and which
one wins flips per pixel with sub-pixel camera motion. That is the flicker, and it is worst exactly
where the owner sees it: down the corridor, while moving.

**Fix, both Canvases:** `camera={ { fov: 75, near: 1, far: 1000, position: [ 0, 5, -13 ] } }`.
Ten times the precision, zero change to the image.

`near = 1` and not more: the chase camera sits at `cam.position.x = p.x` (`chase.ts:23`), so hugging
the rail puts the camera 2u from the rail's inner face at x = ±32. `near = 2` would clip it.

### The second, distance-independent half

A cylinder lying on a plane is **tangent** to it, and a tangent surface is coplanar to first order
over a wide band — it fights at any precision. The cord's axis sits exactly on the deck edge line
(`x = f.x0`, `y = f.y`), so it is tangent to the deck top plane *and* to the slab side wall, with a
quarter of it buried in the slab.

Rather than move the cord — that is a look change and the owner's call — the material now biases its
depth toward the camera:

```
polygonOffset: true,
polygonOffsetFactor: CORD_DEPTH_BIAS,   // -2
polygonOffsetUnits: CORD_DEPTH_BIAS,
```

A thin bright cord pulled a fraction toward the eye cannot peter-pan visibly; it has no shadow and
nothing passes between it and the deck.

### Measured and ruled out

`emitSpan` emits a LEFT and a RIGHT wall for **every** span, so two spans that share an x edge in the
same segment produce two exactly coincident 24u-tall quads. A node script over the real test-level
descriptor (`resolveTrack( { seed: 20260921, length: 120, gapChance: 1 } )`, 166 segments) found **10
such pairs**, all at `y = 0`, e.g. segment 57 spans `-32..-24` and `-24..-4`.

They do **not** z-fight: `pushQuad` winds by the normal, so the pair is back-to-back and front-face
culling drops one. It is wasted geometry — roughly 10 hidden 24u walls — not a defect. Left alone.

## 2. The bloom does not show up — exposure runs after the threshold

The owner's live panel state, read from `localStorage`:

```
rail.emissive 1 · bloom.threshold 0.9 · bloom.smoothing 0.2 · tone.exposure 3 · rim.emissive 6 · mono.seam 10
```

Marigold is `ACCENT_ANCHOR` `#F59A24` (`accent.ts:8`), linear `( 0.914, 0.323, 0.018 )`, **luminance
0.427**. The strip's pixel is that times `rail.emissive` 1 = 0.427, against a threshold of 0.9 with
smoothing 0.2 — `smoothstep( 0.9, 1.1, 0.427 )` is **zero**. The strip contributes nothing to the
bloom. `rim.emissive` 6 gives luminance 2.56 and `mono.seam` 10 gives 4.27, which is why the gap rims
and the monolith seams glow and the rail strip alone does not.

The reason the owner could not find this by turning the exposure up is the composer order.
`world-scene.tsx` had:

```
<EffectComposer multisampling={ 0 }>
    <SceneBloom />
    <ToneTuning />      ← ExposureEffect, then ToneMappingEffect
```

so **exposure was applied after the luminance threshold**. `bloom.threshold` lived in raw scene-linear
space while the image on screen was three times brighter. Turning exposure up brightened everything
and pulled nothing into bloom.

This is a regression from the `<Canvas flat>` switch, not a grading choice. Under three's own
pipeline `toneMappingExposure` is applied inside `<tonemapping_fragment>` in the **material** shader,
i.e. before anything the composer sees. `flat` sets `NoToneMapping`, which skips that block and takes
exposure with it; `ExposureEffect` was added to replace it but landed on the wrong side of the bloom.

**Fix.** `ExposureEffect` moved out of `ToneTuning` into its own `ExposureTuning`
(`apps/client/app/dev/exposure-tuning.tsx`, house rule #9) and placed first:

```
<ExposureTuning />
<SceneBloom />
<ToneTuning />
```

Exposure → bloom → tone map, which is the order every reference pipeline uses and the one `flat` was
meant to restore.

**This re-grades the bloom for the whole scene, and it is meant to.** `bloom.threshold` 0.9 now tests
a value that is 3× what it used to be, so the rim cords and monolith seams bloom harder and the rail
strip crosses at `rail.emissive` ≈ 0.31 instead of ≈ 2.2. Expect to raise `bloom.threshold` once —
toward 2.7 if the old look is wanted exactly — and then the number means what it looks like.

### Mechanism weighing (project non-negotiable #13)

1. **Move `ExposureEffect` before `SceneBloom`** — restores the pre-`flat` reference order, one
   position change, threshold becomes meaningful against the visible image. **Chosen.**
2. Raise `rail.emissive` to ≥ 2.2 and change nothing else — makes the strip bloom, leaves the
   threshold meaningless and the next surface hits the same wall. Treats the symptom.
3. Drop `bloom.threshold` to ~0.35 — same objection, and it drags every dim surface into bloom.
4. `gl.toneMappingExposure` on the renderer — dead under `flat`; would require dropping `flat` and
   reintroducing the double tone map the previous session removed.
5. `<SelectiveBloom>` masking the strip — banned by `.claude/rules/r3f-rendering.md` unless specific
   surfaces must be masked, and it does not fix the threshold's meaning.
6. Bloom `luminanceMaterial` in a custom exposed space — a second place to keep exposure in sync.

## 3. "Loses the emitter and lighting near the rail" — that is `deck.metalness 0.9`

Not a bug. `feedRailEmitters` takes only the ship's **z** (`track-rail.tsx:96-97`), so moving
laterally cannot change which emitters are fed or where they sit. What changes is the **specular**
term, and at `deck.metalness` 0.9 the deck has almost no diffuse left — `BRDF_Lambert( material.diffuseContribution )`
gets a 10% albedo of an already dark plate (`deck.plateColor #23272a`). The marigold wash on the deck
is a **mirror reflection**, not lit floor.

Worked for a deck point beside the ship at `P = ( 28, 0, z )`, normal UP, camera at
`( ship.x, 5, z − 12 )`, and the rail light line at `x = 33, y = 0.5`:

| ship.x | mirror ray `reflect( −V, N )` | reaches the rail line? |
|---|---|---|
| 0 | `( 0.900, 0.161, 0.386 )` | yes — crosses x = 33 at y = 0.90, 0.4u off the line, well inside the GGX lobe at roughness 0.35 |
| 28 | `( 0, 0.385, 0.923 )` | **no x component at all** — runs parallel, closest approach 5u forever |

Hug the rail and the reflected ray swings to point straight down the corridor, so the rail leaves the
lobe and the wash collapses. Physically correct for a mirror; wrong for a floor that is supposed to
read as lit.

**Dials, owner's call, no change made:** lower `deck.metalness` (`ART_MATERIALS.md` wants dielectric
decks; the same sheet already disagrees with our monoliths at 0.9 against its M3 "Metalness 0.0"),
or raise `deck.roughness` from 0.35 to widen the lobe so it keeps the rail at every lateral offset.
Roughness alone will not fully fix it — the lobe has to widen a long way to span the 5u miss.

## Also removed

`BOUNDARY_SURFACE.toneMapped: false` (`track-materials.ts`). Added last session against the
double-tone-map, banned since by `.claude/rules/r3f-rendering.md` (*"Every material is tone mapped —
`toneMapped={false}` is banned. Removed project-wide 2026-09-22"*), and a no-op anyway: `flat` sets
`NoToneMapping`, three defines no `TONE_MAPPING`, and the flag reaches no shader.

## Files touched

| File | Change |
|---|---|
| `routes/test-level/test-level-canvas.tsx` | camera `near: 1, far: 1000` |
| `game/net-canvas.tsx` | camera `near: 1, far: 1000` |
| `dev/exposure-tuning.tsx` | **new** — `ExposureTuning`, drives `ExposureEffect` |
| `dev/tone-tuning.tsx` | keeps only `ToneMappingEffect` |
| `game/scene/world-scene.tsx` | `<ExposureTuning />` first in the composer |
| `game/scene/track-rim.tsx` | `CORD_DEPTH_BIAS = -2`, `polygonOffset` on the cord material |
| `game/scene/track-materials.ts` | `BOUNDARY_SURFACE` loses `toneMapped: false` |

## Next, in order

1. **Look at all four live.** The seams, the strip's halo, `bloom.threshold` re-dial, and whether the
   deck still goes dead beside the rail.
2. **`deck.metalness`** — decide the deck's material family against `ART_MATERIALS.md` rather than by
   feel; the monolith 0.9-vs-M3-0.0 departure is the same argument and should be settled once.
3. **`rail.emissive`** re-dial after the threshold settles.
4. Still open from before: 24u slab underside read, `deathY`, inboard amber deck seams,
   `ART_MATERIALS.md` §7 departures to hand to Codex, panel is `/test-level` only.
5. **Revert before merge**: fog (`game-environment.tsx`) and the sim freeze on `P`
   (`dev/sim-freeze.ts`).
