# The owner's numbers landed, and a light between the ship and the camera

Branch `feat/test-level`. Picks up `2026-09-22-camera-knobs-and-the-dark-deck.md`, which handed over a
table of dialled values with the question *"land these into `NUMBER_SPECS`?"* unanswered. Owner's
answer this session: *"use my tweaked numbers."*

## Landed into the specs

`apps/client/app/dev/tunables.ts`, spec defaults only — no behaviour code touched.

| Key | Was | Now |
|---|---|---|
| `cam.back` | 7.3 | 12 |
| `cam.backStretch` | 1.5 | 0 |
| `cam.height` | 4.7 | 5 |
| `cam.lookAhead` | 9.5 | 14 |
| `cam.lookAtLift` | 1.35 | 1 |
| `cam.follow` | 16 | 20 |
| `cam.fovStretch` | 15 | 0 |
| `ibl.intensity` | 2 | 3 |
| `groove.metalness` | 0.95 | 1 |
| `groove.roughness` | 0.95 | 1 |
| `groove.cavity` | 0.25 | 0.3 |
| `ibl.zenith` | `#26292c` | `#52575b` |
| `ibl.horizon` | `#303439` | `#2f3337` |
| `ibl.nadir` | `#1e2023` | `#34373c` |

`cam.fov` was already 70. **`perf.dpr` was NOT landed** — the handover flagged the owner's `1` as
probably left over from a `reset`, and the session before that reverted the same `1` after measuring
120 fps / 1.2 ms cpu. Spec stays at 2; the owner's storage still holds 1, so their window is
unchanged either way. One number to flip if the 1 was deliberate.

Zeroing both speed-stretches is kept deliberately: the framing the owner judged is now the framing at
every speed, which is a stable target while the look is being settled.

## The near-camera light

Owner's ask: *"a very subtle light either behind the ship, or near the camera or anywhere between the
ship and camera."* This is the **ship-exhaust emitter slot** the previous two handovers listed as open
and identified the mechanism for.

### Mechanism weighing (rule #13)

| Candidate | Weighing |
|---|---|
| **A slot in the existing `emitter-array`** | **chosen.** Every surface is already patched with that shader — deck (`track-floor`), rails (`track-rail`), monoliths (`monolith-group`), ship hull (`ship-model`) — so one slot lights all four. No new three.js light, no shader recompile, and the write happens inside the `useFrame` that already feeds the array. |
| `<pointLight>` parented to the ship | A change in the scene's light count recompiles every standard material, and it puts one more piece of live state in the React tree. |
| `<spotLight>` on the camera rig | Reads as a headlight; wrong for "Cold Space. Warm Energy." Same recompile cost. |
| Emissive plane under the tail | Lights nothing. three.js has no SSR; an emissive material is not a light source. |
| Raise `ibl.intensity` / add a hemisphere light | Global. Measured last session: kills the black but washes the frame and the monoliths go pale grey. |
| Ship-tracking gradient blob in the deck shader | Cheap, but non-physical and confined to the deck — no spill onto the rails or the hull. |

### As built

**`apps/client/app/game/scene/ship-glow.ts`** (new) — `feedShipGlow( uniforms, slot, ship, camera )`
writes one emitter: centre at the ship's interpolated position, lifted by `ship.glowLift` and pushed
`ship.glowBack` toward the camera, half-length `ship.glowLength` along the emitter axis, marigold
`accent()`, intensity `ship.glow`, cutoff `ship.glowRange`. Returns `false` at intensity 0 so the slot
costs nothing when the group is dialled off.

A **line** light, not a point, because the array's axis is world `+Z` in view space — the segment lays
the warm streak along the deck between the tail and the camera instead of a round pool under the ship.

**`track-floor.tsx`** — `feedEmitters` now takes `ship: THREE.Vector3 | null`, writes the glow into
slot 0 and hands the rails `EMITTER_SLOTS - slot`. Rails lose one of twelve slots only while the glow
is on. The local player is fetched once now (`queryFirst( LocalPlayer, Sim )`) and `Render` is read off
it optionally, so a player without a `Render` group keeps the old rail-selection `z`.

Position comes from `Render` (the interpolated group `chase.ts` also follows), not raw `Sim`, so the
light tracks the drawn ship. If `LocalLoop`'s `syncRenderSystem` happens to run after `TrackFloor`'s
`useFrame` the light is one frame stale, which is invisible at 2.5u behind the ship.

**New panel group `Ship glow`**, 5 rows, auto-picked up by `tuning-panel.tsx`'s `groupRows()`:
`ship.glow` 1.2 · `ship.glowRange` 16 · `ship.glowBack` 2.5 · `ship.glowLift` 0.6 ·
`ship.glowLength` 2. Defaults are deliberately faint; "subtle" was the ask.

### Verified

`pnpm typecheck`, `pnpm test` (128 client + 4 server) and `pnpm lint` all green — the 7 lint warnings
are pre-existing and in files this session did not touch. Live at `/test-level`: a marigold pool under
the tail with a streak running to the bottom edge of the frame, on the deck that the previous session
measured at `#0d0f10`.

The owner was dialling the new group in their own window during the session; storage read
`ship.glow 6.95 · range 46 · back 4.7 · lift 1.05 · length 3.1` — far hotter than the defaults, and
not landed into the specs.

## Still open — carried forward

- **Inboard amber deck seams.** `cruise-lighting.png` carries marigold across the full track width;
  our floor only has `isOuterEdge` rails. Content, not a dial.
- **Rail top face far wider than the reference's cord** — `BOUNDARY_W = 1.0u` against ~0.2–0.3u.
  Geometry, and `BOUNDARY_W` also feeds collision.
- `ART_MATERIALS.md` §7 decisions-and-departures entries, now nine with the ship glow.
- Panel is `/test-level` only.
- **Revert before merge**: fog (`game-environment.tsx`) and the sim freeze on `P` (`dev/sim-freeze.ts`).
- Nothing committed. The tree also holds gap-teeth/rim and rail-material work from a parallel agent —
  stage by path.

## Second pass — why the glow read as a tube light, and the Fill group

Owner on seeing the glow: *"why is it looking like a tube light behind the ship and i can only see the
reflection, i thought we were supposed to evenly light the whole area behind the ship."* Their three
proposed fixes: a directional light, a point light with a bigger radius placed behind the camera so the
lobe is off-screen, or brightening the IBL.

### The measurement, three A/Bs on the same frozen frame

| Change | Near deck behind the ship |
|---|---|
| Fill lights at defaults, `deck.metalness` 0.9 | lifts slightly; plates read but stay dim |
| `deck.metalness` 0.9 → 0.45, fill lights on | **evenly lit to the bottom edge of the frame** |
| `deck.envMapIntensity` 1 → 3.5 → 6, metalness 0.9 | **no visible change** |

### The finding

**A dark metal's reflectance is its dark albedo.** `track-materials.ts:20` builds the deck as
`color: '#ffffff'` plus a metalness map, driven by `deck.metalness` 0.9. At that metalness the diffuse
term is gone and the specular F0 is the plate texture, which is in the `#23272a` family. Brightening
the environment multiplies a dark number by a larger one and stays dark — which is why the owner's
option (c) is inert even at 6×. An analytic light of any shape has only the GGX lobe to return, which
*is* the tube-light read.

**`deck.metalness` is the gate on all three of the owner's options.** Recorded here because the
`2026-09-22-camera-knobs-and-the-dark-deck.md` A/B table says "`deck.metalness` 0.9 → 0.5, near deck
unchanged — **not the lever**". That reading was correct for its conditions and wrong as a general
conclusion: with no fill light in range there was no diffuse irradiance for the lowered metalness to
pick up. With a fill light present it is the only lever that works.

Nothing was landed for it. `deck.metalness` is a material value from Codex's reference reading, so the
recipe was handed to the owner instead: `deck.metalness` ≈ 0.45–0.55 with the `Fill` group at defaults.

### As built

**`apps/client/app/game/scene/fill-lights.tsx`** (new) — a static `<directionalLight>` positioned from
`fill.dirElev`/`fill.dirAzim` on a 100u radius, and a `<pointLight>` that rides behind and above the
camera. Both are driven from `num()`/`col()` inside one `useFrame` through refs, so the component holds
no reactive subscription and never re-renders (rules #4/#10).

The directional light does not follow anything: parallel rays, no falloff, no shadows, so one static
light covers the whole finite track. Its `target` stays the default `Object3D` at the origin, never
added to the scene, so its `matrixWorld` is identity and the direction is `position → origin`.

Verified-this-session against three 0.185.1 source, `src/lights/PointLight.js:60` — *"The amount the
light dims along the distance of the light"*, `decay` default 2, and the constructor doc: `distance`
`0` means no limit. `fill.pointDecay` defaults to **0**, which is the owner's "bigger radius so the
lobe is not visible" as a flat dome rather than a wider lobe.

**`lighting.tsx`** — `SceneLighting` was a one-liner returning `<GradientIbl />`; now a `Fragment` of
that plus `<FillLights />`. One recompile of the standard materials at mount when the light count
changes, never per frame.

**New panel group `Fill`** — `fill.dir` 0.6 · `fill.dirElev` 50 · `fill.dirAzim` 200 · `fill.point` 1.2
· `fill.pointBack` 8 · `fill.pointLift` 6 · `fill.pointDecay` 0 · `fill.pointDistance` 0, plus colours
`fill.dirColor` `#93a7bd` and `fill.pointColor` `#7d8ea3`. Cool on purpose: the marigold stays the only
warm source in the frame.

### Note on the shared `localStorage`

The three A/Bs wrote `deck.metalness` and `deck.envMapIntensity`, both of which the owner had at spec
default. Announced before writing, and both restored to 0.9 / 1 afterwards. The owner's own dialled
values were never touched.

## Third pass — the sun is gone, the glow is unwired

Owner, on the `Fill` group: *"lets remove the sun the fill is working out really well"* — then *"also
the ship glow just unwire it now, we will add it later once we work on the ship exhaust."*

### The sun is deleted, not disabled

`fill-lights.tsx` keeps only the camera-following `<pointLight>`; the `<directionalLight>` and its
`DIR_RADIUS`/`DEG` constants are gone, and so are `fill.dir` / `fill.dirElev` / `fill.dirAzim` /
`fill.dirColor`. The `Fill` group is now 5 numbers + 1 colour.

The camera fill alone is what fixed the complaint, dialled by the owner to
`fill.point 25.6 · pointBack 4 · pointLift 0 · pointDecay 0.1 · pointDistance 140 · #5f6367`.
A near-zero `pointDecay` with a 140u cutoff is the flat dome the owner asked for: it lifts the whole
deck rather than putting a lobe anywhere in frame. **Not landed into the specs** — the owner was still
dragging at handover.

Note that this works at `deck.metalness` 0.9, which the second pass said it could not. The difference
is intensity: 25.6 against the 1.2 default. The second-pass finding stands as a statement about the
*shape* of the response — a dark metal returns only the GGX lobe, so the fill has to be strong and
wide enough that the lobe covers the whole near deck instead of reading as a streak. Lowering
`deck.metalness` is the cheaper route to the same look; the owner chose brightness over metalness and
kept the deck a mirror.

### Ship glow removed from the render path

`ship-glow.ts` is **deleted** and the `Ship glow` panel group with it. `track-floor.tsx` is back to its
pre-session shape: `feedEmitters( uniforms, runs, z, camera, intensity, range )`, rails filling all 12
slots from slot 0, no `Render` import.

Deleted rather than left unreferenced because a panel group whose sliders move nothing is a trap for
whoever opens it next. The design to re-wire from is the **"The near-camera light"** section above —
the mechanism weighing, the line-light-not-point reasoning, and the slot-0 arrangement. Re-wiring is
the one call site in `feedEmitters` plus the five `ship.*` specs.

Stale `ship.*` and `fill.dir*` keys sitting in the owner's `localStorage` are harmless: `restore()`
only reads keys that exist in the specs, and the next `persist()` writes only current keys.

`pnpm typecheck` · `pnpm test` (96 shared + 128 client + 4 server) · `pnpm lint` green after both
removals. Verified live at `/test-level`.

## Fourth pass — the gap rim cords had no bloom

Owner: *"there is no bloom on the glow seams for the gap."*

### Cause

Every other glowing thing in the scene has a live intensity knob; the gap cords had neither a knob nor
a per-frame write.

| Emitter | Emissive intensity | Blooms |
|---|---|---|
| Monolith seams | `mono.seam` = 10 | yes |
| Rail strips | `rail.emissive` = 2 | weakly |
| Gap rim cords | hard-coded `CORD_INTENSITY` = 2 | no |

`track-rim.tsx:13` — `export const CORD_INTENSITY = MARIGOLD_REFERENCE_INTENSITY;` (2.0), applied once
in `buildCordMesh` and never again: `TrackRim` had no `useFrame`, where `TrackRail` pushes
`strip.emissiveIntensity = num( 'rail.emissive' )` every frame. Marigold `#F59A24` has a linear
luminance of ~0.42, so the cords sat at ~0.85 against `bloom.threshold` 0.9 — just under the line, in
the `bloom.smoothing` 0.2 ramp, which is why they read as lit but never bloomed.

### Fix

New `rim.emissive` spec in the `Rail emitter` group, default **6** (≈2.1 luminance, clear of the
threshold), pushed each frame by a `useFrame` in `TrackRim` onto the instanced mesh's material.
Verified live: the gap outline now carries a halo.

The cords keep `toneMapped: false`. That is load-bearing, not an oversight — see below.

### Tone-mapping finding, latent and separate

Verified-this-session against the installed R3F 9.7.0,
`dist/events-156d8d12.esm.js:15903` — `gl.toneMapping = flat ? THREE.NoToneMapping :
THREE.ACESFilmicToneMapping`. `routes/test-level/test-level-canvas.tsx:29` passes **no `flat` prop**,
so the renderer applies **in-shader ACES** to every material that does not opt out, and
`dev/tone-tuning.tsx` then runs a **second** tone map as a post effect.

Today this does not bite: the owner's `tone.mapping` is `None`, so `ToneTuning` sets
`BlendFunction.SKIP` and the post pass is a no-op. **Picking any mode in the Tone panel double
tone-maps the frame**, and the in-shader ACES is also why emissives have to be pushed so far past 1 to
reach the bloom threshold — the bloom pass never sees a real HDR value.

The correct fix is `<Canvas flat>` so the post pass is the only tone map, but that re-bases the whole
look and every dialled number in the panel with it. **Owner's call — not done.** Worth a GitHub issue.

## HANDOVER — safe to `/clear` from here

Branch `feat/test-level`. **Nothing committed.** The tree also holds gap-teeth/rim and rail-material
work from a parallel agent, so stage by path.

### Files this session touched

| File | State |
|---|---|
| `apps/client/app/dev/tunables.ts` | owner's dialled values landed as spec defaults; new `Fill` group (5 numbers + `fill.pointColor`); new `rim.emissive` row in `Rail emitter` |
| `apps/client/app/game/scene/fill-lights.tsx` | **new** — camera-following point light, panel-driven |
| `apps/client/app/game/scene/lighting.tsx` | `SceneLighting` now a `Fragment` of `GradientIbl` + `FillLights` |
| `apps/client/app/game/scene/track-rim.tsx` | added `useFrame` pushing `rim.emissive` |
| `apps/client/app/game/scene/track-floor.tsx` | **net zero** — the ship-glow wiring was added then reverted |

`apps/client/app/game/scene/ship-glow.ts` was created and then deleted on the owner's instruction.

### Next steps, in order

1. **Land the owner's `Fill` numbers** into `NUMBER_SPECS`/`COLOR_SPECS` once they settle. Last read:
   `fill.point 25.6 · pointBack 4 · pointLift 0 · pointDecay 0.1 · pointDistance 140 · #5f6367`.
   Specs currently ship `1.2 · 8 · 6 · 0 · 0 · #7d8ea3`.
2. **Ask about `perf.dpr`** — spec 2, owner's storage 1. See the first section.
3. **Decide on `<Canvas flat>`** (above). File an issue first.
4. **`rim.radius`** is the other half of the bloom story — bloom energy scales with bright *area*, and
   `CORD_RADIUS` is 0.08u. Making it a knob needs `buildCordMesh` to watch `useRebuildToken()` the way
   `TrackRail`'s materials do, and `CORD_RADIUS` also pads cord lengths in `buildCords`, which
   `track-rim.test.ts` covers — check those assertions before touching it.
5. **Ship exhaust** — re-wire the glow from the "The near-camera light" section above.
6. Still open from earlier handovers: inboard amber deck seams; `BOUNDARY_W` 1.0u vs the reference's
   ~0.2–0.3u cord; `ART_MATERIALS.md` §7 departures, now ten entries; panel is `/test-level` only.
7. **Revert before merge**: fog (`game-environment.tsx`) and the sim freeze on `P` (`dev/sim-freeze.ts`).

### Gotchas that cost time this session

- **The extension tab and the owner's window share `localStorage`.** Read it rather than trusting an
  in-memory store, and say before writing. Three A/Bs wrote `deck.metalness`/`deck.envMapIntensity`;
  both were restored.
- **`reset` is not an undo** — `resetTunables()` restores every key to spec default.
- Removed spec keys left stale in storage are harmless: `restore()` reads only keys that exist in the
  specs, and the next `persist()` writes only current ones.
- The driven tab is backgrounded, so its **fps readout is worthless**; cpu-per-frame is still usable.

## Fifth pass — `toneMapped: false` removed project-wide

Owner: *"remove all toneMapped: false instances from the code, lets have everything tone mapped."*

Eight literal sites, six files:

| File | Surface |
|---|---|
| `explosions.tsx` | death shards (`meshBasicMaterial`, additive) |
| `hit-spark.tsx` | hit sparks (`meshBasicMaterial`, additive) |
| `gradient-dome.tsx` | the sky dome |
| `finish-gate.tsx` ×3 | gate posts, cross beam, translucent banner |
| `pickup-field.tsx` | pickups |
| `projectile-field.tsx` | bolts |
| `track-rim.tsx` | gap rim cords |

`deep-space-sky.tsx` and `sky-backdrop.tsx` were left alone: they only carry a `toneMapped?: boolean`
prop that **defaults to `true`**, and the single caller (`game-environment.tsx:12`) does not pass it,
so that path was already tone mapped. The prop is now dead plumbing — removable, not removed.

Removing the flag left three materials collapsible onto one line; `biome format --write` was run on
**only those three files** to avoid touching a parallel agent's in-flight `track-view.tsx`.

### Docs updated in the same turn, or the next session re-adds the flag

`conventions/r3f.md` taught the opposite in six places, and `.claude/rules/r3f-rendering.md` mirrored
it as a hard rule ("Neon = HDR emissive + `toneMapped={false}`"), which loads automatically whenever a
rendering file is read. Both now say every material is tone mapped and the flag is banned, with the
arithmetic that replaces it: **linear luminance × `emissiveIntensity` must exceed `bloom.threshold`**.
A new **"Tone mapping: one pass, no opt-outs"** section in `conventions/r3f.md` records the owner's
decision verbatim, the marigold worked example, and the `<Canvas flat>` question as still open.

### Consequence to expect

Every emissive in the game now pays the in-shader ACES curve, which compresses toward 1.0. The gap
cords keep their new `rim.emissive` knob (default 6) and will need re-dialling upward; the fixed
intensities elsewhere — finish gate 2.4, pickups 3, bolts 4, `mono.seam` 10, `rail.emissive` 2 —
have **no knobs** and will bloom less than they did. Expect a dimmer, more consistent frame.

**Not verified visually.** The extension's tab group was closed before this pass could be screenshotted
and a new window was not forced open. `pnpm typecheck` · `pnpm test` (96 + 128 + 4) · `pnpm lint` green
for every file this session touched.

### Flag for the owner — a parallel agent's in-flight edit

`track-view.tsx` on disk now renders `TrackFloor`, `TrackRim`, `TrackBlocks` — **`<TrackRail>` is gone
while its `import` remains**, which is the one lint error left in the tree (`track-view.tsx format`,
plus the unused import). Rail geometry, the emissive strips and — since the parallel agent moved
`feedRailEmitters` into `TrackRail` — **all rail emitter lighting** therefore do not render. Left
untouched as someone else's work in progress; it is not from this session.
