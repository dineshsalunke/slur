# Lighting rebuild from black

Branch `feat/test-level`. Continues `2026-09-22-corridor-lighting-bisect.md`, which took the
decision to strip and relight one source at a time. Owner confirmed no second agent is in the tree.

## ⛔ Temporary — revert before this branch merges

| What | Where | Restore to |
|---|---|---|
| Sim freeze on `P` | `apps/client/app/dev/sim-freeze.ts`, used in `routes/test-level/local-loop.tsx` | Delete the module, the `useEffect` and the `if ( simFreeze.on ) return;` |
| Bloom + composer removed | `game/scene/world-scene.tsx` | `<EffectComposer multisampling={ 0 }><SceneBloom config={ GRID_VOID.bloom } /></EffectComposer>` |
| Fog removed | `game/scene/game-environment.tsx` | `<fog attach="fog" args={ [ config.fog.color, config.fog.near, config.fog.far ] } />` |
| `RAIL_EMITTER_INTENSITY = 0` | `game/scene/track-materials.ts` | Re-derive with the rail; was 60 |

## Stripped (owner: "remove all the lighting")

Deleted: `cold-key.tsx` (directional, already at intensity 0), `corridor-light.tsx` (hemisphere
bounce 1.2 + four player-following point lights at 700). Both committed at `f7be4af` — recover with
`git show f7be4af -- <path>`.

`lighting.tsx` is now `SceneLighting() → null`, kept as the single slot to relight into.
`DeepSpaceSky` takes `environment={ false }`, which kills the drei `<Environment>` IBL and its three
Lightformer cards. The backdrop, the star field and every emissive material stay — an emissive
material illuminates nothing, so it is not lighting.

Deck renders black, as expected: `FLOOR_METALNESS = 0.75` with no environment has nothing to reflect.
That is the known-good zero.

## Reading of `docs/art-direction/golden-reference/cruise-lighting.png`

Measured figures are in `2026-09-22-deck-material-from-reference.md`. New this session, eyeball-level
and not pixel-measured:

1. **Nothing casts a shadow** — not the ship, not the monoliths, not one asteroid. There is no
   shadow-casting key in that frame.
2. **Owner's "even lighting" holds, with a correction.** No hotspot, no falloff pool, but the far
   deck is *lighter* than the near deck (`#2c3236` far, `#181919` near). That is haze plus grazing
   incidence, not a light. Our rig produced the inverse — a bright near-camera lobe.
3. **Owner's "there is light on the camera side" is supported.** Camera-facing faces of the
   monoliths, the near asteroids and the ship's back all carry the cool highlight; side faces fall
   off. That is what an environment map does when the hemisphere behind the camera is bright — and
   the nebula backdrop fills it.
4. **The warm streaks under the ship and the pickup are those objects' own emissive reflected in the
   deck**, not evidence of a light on the deck. Owner agrees; they are deferred with the emissives.

So the reference decomposes into three things: a cool broad IBL, marigold linework as the only hot
pixels, and the deck reflecting both.

## Rail emitter light — needed, but deferred (owner)

three.js has no real-time GI and no screen-space reflections, so an emissive material appears in no
reflection and lights nothing. The reference's warm deck streaks can only come from an analytic
light doing direct specular on the metal — which is what the patched emitter array in
`emitter-array.ts` exists for, and what `ART_MATERIALS.md` §M1 says. Owner's call: build it after the
rail module/profile exists, because the emitter's lift, length and offset are derived from the rail's
real cross-section.

## Order for the relight

Reverses the bisect handover, which put the IBL last. The IBL goes **first**: it is the only
mechanism that produces "even and shadowless", and a metal deck without one is black by definition.
The lobe the last session chased is most likely the *key Lightformer card* — a 60° rect at bearing
66° / elevation 19° — not the IBL as such.

1. Near-uniform IBL. **Done** — see below.
2. Rail emissive at reference intensity (done — bloom off while judging it).
3. Rail emitter light, after the rail profile.
4. A fill only if the monoliths still read as silhouette.

No directional key at any point.

## Step 1 as built — `game/scene/gradient-ibl.tsx`

A procedural equirect gradient (`IBL_NADIR` → `IBL_HORIZON` → `IBL_ZENITH`) as a half-float
`DataTexture`, handed to drei's `<Environment map>`. Uniform by construction, no asset, no network,
and four constants to dial. Rejected alternatives: a `preset` HDRI (runtime CDN fetch), a downloaded
`.hdr` (every space plate is a bright blob in one direction — a card by another name), Lightformers
(what produced the lobe), and a `CubeCamera` over our own backdrop (`gain: 0.4`, returns nothing).

Verified in `three@0.185.1` source this session:

- `ShaderChunk/lights_fragment_maps.glsl.js` — specular `radiance` is fed **only** by
  `getIBLRadiance()` under `#if defined( USE_ENVMAP )`, while `getHemisphereLightIrradiance`
  (`lights_fragment_begin.glsl.js:190`) goes into indirect *diffuse*. **`ambientLight` and
  `hemisphereLight` cannot light a metal.** An env map is mandatory, not a preference.
- `renderers/webgl/WebGLEnvironments.js` — an equirect `scene.environment` is PMREM'd automatically,
  so no hand-rolled `PMREMGenerator` call is needed.
- `ColorManagement.enabled = true` by default, so `new THREE.Color('#3d464f')` is already linear.
  Do not `convertSRGBToLinear()` on top of it.

### The bug that cost the first pass: an equirect must be 2:1

The texture started at `8 × 64` — narrow and tall, on the reasoning that a vertical gradient needs no
horizontal resolution. It renders **black**, silently. Reading the live shader uniform showed
`envMap` resolved to a cubeUV render target of `336 × 8`; the deck stayed black at
`environmentIntensity = 200`. Same gradient at `128 × 64` lit the scene immediately.

Method note, since the previous session was wrecked by bad probes: the mesh was re-acquired by
predicate on every call, a green-emissive flash proved the probed material was the one being drawn,
and the sim was frozen with `P` so the A/B frames shared a camera. The intensity and colour sweeps
were reversible scalar/texture swaps, never `setHex(0)` on a channel that cannot be undone.

### Values

`IBL_ZENITH #3d464f` · `IBL_HORIZON #20262c` · `IBL_NADIR #06080a` · `IBL_INTENSITY 6`.

The first guess, `#2b3a4d`, read navy: b/r = 1.81 against the reference deck's measured 1.14–1.22.
`#3d464f` is b/r = 1.33 and reads graphite. Deck now shows plate joints, an even shadowless falloff,
far-deck lighter than near-deck as the reference has it, and monolith faces that read as form rather
than silhouette.

The duplicate `roughness`/`metalness` props on the floor mesh were dropped — `floorSurface()` already
spreads both.

## `FLOOR_METALNESS`: 0.75 → 1.0 → 0 → **0.7** (owner)

I set 1.0 mid-session on the previous handover's authority and the owner challenged it. The
challenge was right and the measurement behind 1.0 does not hold:

> `2026-09-22-deck-material-from-reference.md` — *"Metalness 1.0. The streak holds its source hue
> (`#e9a860` → `#8e5f35`) instead of washing white, so F0 is neutral."*

A neutral F0 does not identify a metal. A **dielectric's** F0 is a neutral 0.04, so it reflects
source hue just as faithfully. The observation is consistent with both, and cannot separate them.

Physically, `metalness: 1.0` means a raw clean conductor. A deck is coated, anodised or painted —
a dielectric layer over metal, the textbook case for 0. At 1.0 the diffuse term vanishes entirely,
which is why the whole scene went unreadable: nothing was left but reflections of a dim gradient.

Owner's value is **0.7** with roughness ~0.5, and that is what is shipped. Intermediate metalness is
unphysical by the strict reading, but the ~30% surviving diffuse is exactly what makes the deck
legible. Effective clean roughness is already 0.43 (`FLOOR_ROUGHNESS` 0.5375 × `ROUGHNESS_MAP_BASE`
0.8), a hair under the owner's ~0.5.

**`ART_MATERIALS.md` §M1 still states metalness 1.0 for the deck. That is now a departure and needs a
§7 decisions-and-departures entry — not yet written.**

## Open at handover

- **The owner's actual complaint is still not met:** *"I was expecting an even lighting where I see
  the whole world a bit clearly."* The deck reads at `IBL_INTENSITY 6`, but the monoliths are still
  nearly silhouettes and the frame overall is darker than that ask. Next lever is `IBL_INTENSITY`
  (a live sweep at 12–18 was started and not finished), then the monolith material.
- **Monoliths:** `ART_MATERIALS.md` §M3 says *"rough dielectric … Metalness 0.0"*; `monolith-config.ts`
  ships 0.3 with `envMapIntensity: 1.6`. Settle that before adding light for them.
- **Runtime probing broke after a Vite dep re-optimisation.** The
  `import('/node_modules/.vite/deps/@react-three_fiber.js')` handle from the bisect handover returned
  `_roots.size === 0` — a *different module instance* from the app's. The versioned URL
  (`?v=<hash>`) did not help either. Edit the file and reload instead; it is slower but never lies.
- Screenshots after a reload need ~4s of settle. A capture taken too early returns a black frame that
  looks exactly like a lighting bug.
