# The rail was never lighting the deck, and the glow was the floor

Branch `feat/test-level`. Picks up `2026-09-22-one-tone-map-and-the-emitter-wash.md`. Owner opened
with *"the whole rail lighting issue is still not fixed !!!"*, then *"lets first confirm if the rails
are actually used as light. also are they affected by camera position"*, then *"fix all of them.
choose your order"*.

## What the live A/B proved

Driven at `/test-level` through the Chrome extension, ship strafed to the right rail with a synthetic
held `KeyD` (a `computer` key press sends keydown+keyup, so the module-level `down` set in
`input/keyboard.ts` never holds — dispatch `KeyboardEvent`s from `javascript_tool` instead).

A clean double dissociation. The near band and the far cord are **not the same object**.

| A/B | near right band | far left cord |
|---|---|---|
| `emitter.intensity` 1.5 → 0 | unchanged | **collapses to a dashed dark line** |
| `fill.point` 25.6 → 0 | unchanged | unchanged |
| `rail.emissive` 2 → 0 | **gone — bare grey metal** | unchanged |

- The far "glowing rail" was **the deck**, not the rail: the emitter array's *specular* streak, visible
  only where the floor is near edge-on to the camera.
- The near band was the emissive strip, clipped flat.
- `fill.point` was a red herring — the first pass predicted it and was wrong. It lights the ship.

## Root cause — the emitter is a grazing light, so its diffuse term is dead

`track-materials.ts:82` — `RAIL_EMITTER_LIFT = 0.5`. The line light sits 0.5u above the plane it is
meant to light, and the deck normal is UP, so `saturate( dot( geometryNormal, emDirD ) )`
(`emitter-array.ts:79`) *is* `lift / distance`. For a deck point 3u from the emitter axis:

```
dot   = 0.5 / 3.04 = 0.164      atten = 1 / 3.04² = 0.108
product 0.018 × intensity 1.5 × colour(0.91, 0.33, 0.02) = (0.024, 0.009, 0.000)
```

Black. **Diffuse falls off as 1/d³, not 1/d², because the cosine is itself proportional to 1/d.** Only
specular survives. Raising `emitter.intensity` cannot fix it — at 10 it produced a blown specular
streak over a still-black deck, which is the "white smear" the previous session chased.

## Correction to the previous handover

Its table put the rail at luminance `0.85`, under `bloom.threshold 1`, and concluded it "doesn't
bloom". That arithmetic omitted `ExposureTuning`, which runs **before** the bloom pass
(`world-scene.tsx:36-38` = Exposure → Bloom → Tone). At `tone.exposure 2` the real figure is **1.71**.
Every row of that table shifts by the same ×2.

## Fixed, in this order

### 1. The emitter feed no longer touches the camera

`camera.matrixWorldInverse` refreshes only inside `gl.render()`, so during any `useFrame` it is a frame
old — and `world-scene.tsx:34` mounts `<TrackView>` before `{ children }`, so `TrackRail` fed the
emitters *before* `LocalLoop` moved the camera (`local-loop.tsx:24`). Every frame the light was placed
in last frame's view space and shaded in this frame's.

`feedRailEmitters` now writes **world space** and lost its `camera` parameter entirely; the fragment
shader transforms with three's built-in `viewMatrix`, which is always the real render camera.
Verified-this-session: `three@0.185.1`, `build/three.module.js:7000` — `'uniform mat4 viewMatrix;'` is
unconditionally in the fragment prefix. The axis transform is hoisted out of the 12-slot loop.

Fixed by construction — the camera is no longer read — not by a visual A/B.

### 2. The cord became a cord

`RAIL_EMISSIVE_SHARE` **0.5 → 0.125**: the lit strip goes 1.0u → **0.25u**, against the reference's
~0.2–0.3u cord, and `RAIL_MARGIN` follows to 0.875u. `rail.emissive` left at 2 — the band read flat
because it was a wide slab of clipped core, not because it was too bright. Confirmed live: the near
band is now a cord with a halo instead of a peach stripe.

Only a stale test *name* needed touching (`track-rail.test.ts` said "80%", already wrong at 0.5); every
assertion is constant-derived and tracked the change.

### 3. Inboard deck seams — and the plan the art direction overruled

The plan was a wash from the rail onto the deck. **`golden-reference/cruise-lighting.png` rules that
out**: the deck beside its rail cord is dark. The floor marigold is inboard seams. And
`docs/ART_MATERIALS.md` §2 already names the feature —

> | Interior seam inserts | **M7**, sparse · short · varied length · irregular spacing | gameplay |

— which also rules out the continuous `mod()` shader lines that were the next idea. Short inserts,
varied length, irregular spacing.

**New: `seam-inserts.ts`** (pure, seeded through `hash2` from three fixed salts) + **`track-seams.tsx`**
(one mesh), mirroring the `track-rails.ts` / `track-rail.tsx` split. 8 lanes at 8u spacing from a 4u
inset, 0.12u wide, 3–11u long, 45% occupancy, skipped over gaps, `polygonOffset` + 0.02u lift against
z-fighting. New `seam.emissive` knob in the Deck group, default 1.2. 9 new tests.

**Mechanism weighing for the seams (rule 13)** — continuous `mod()` shader lines on the deck material
(rejected: the direction says short and irregular, not continuous); emissive baked into the procedural
deck texture (rejected: locked to the 16u tile, width is resolution-bound, aliases at distance); decal
meshes or a projected texture (rejected: sorting, overkill); `THREE.Line` segments (rejected: no
world-scaled width, no bloom-friendly thickness); **seeded quad geometry (chosen)** — deterministic,
testable, no tiling constraint, reuses the existing `pushQuad`/`packGeometry` path and the established
generator/component split.

## Files

| File | Change |
|---|---|
| `emitter-array.ts` | `FRAG_LIGHTS` transforms world → view with `viewMatrix`; axis hoisted |
| `track-rails.ts` | `feedRailEmitters` lost `camera`; `_view`/`_axis` → one `_world` scratch |
| `track-rail.tsx` | `useFrame` no longer takes `{ camera }` |
| `track-geometry.ts` | `RAIL_EMISSIVE_SHARE` 0.5 → 0.125 |
| `track-rail.test.ts` | stale "80%" test name |
| `seam-inserts.ts` · `seam-inserts.test.ts` · `track-seams.tsx` | new |
| `track-materials.ts` | `SEAM_SURFACE` |
| `track-view.tsx` | mounts `<TrackSeams>` between floor and rail |
| `dev/tunables.ts` | `seam.emissive` |
| `docs/ART_SCALE_REFERENCE.md` | rail rows corrected; four seam rows; a seam paragraph in §1a |

Gates: typecheck clean · **134 client tests** (was 125) · 96 shared · 4 server · lint clean (7
pre-existing file-size warnings, comment ratchet clean).

## Not committed

**The tree is not clean and was not clean when this session started.** `deep-space-sky.tsx`,
`game-environment.tsx`, `sky-backdrop.tsx` (deleted), `sky-config.ts`, `sky-config.test.ts` and
`world-scene.tsx` carry a **parallel agent's uncommitted sky work**. Nothing here was committed, so
those changes are still sitting alongside this session's. Separate them before committing either.

## Still open

- **`RAIL_EMITTER_LIFT = 0.5` is untouched.** The grazing-light analysis stands, and the emitter still
  contributes almost nothing in diffuse. It was left alone because the reference does not want a deck
  wash, so the dead diffuse term costs nothing visually — but the emitter array is now doing one job
  (a specular streak) for the cost of twelve line lights. Worth asking whether it earns its keep.
- **Confirm the seam bloom on a visible frame** (see above — arithmetic only).
- **`tone.exposure` spec 1 vs `bloom.threshold` 1**: at spec defaults nothing marigold blooms, not even
  the rail. One of the two numbers is wrong. Owner's call.
- ~~Should `lethal` and `drag` bloom?~~ **Closed** — `monoliths` removed drag blocks entirely.
- `BOUNDARY_W = 1.0u` vs the reference cord; feeds collision.
- The sky reads navy — now also entangled with the parallel agent's work above.
- `ART_MATERIALS.md` §7 decisions-and-departures entries.
- Panel is `/test-level` only. `perf.dpr` spec 2, still unasked. Fog revert before merge.

## The seam default was below the bloom knee — fixed

Owner, after seeing the seams land: *"the glowing seams in the rile grooves dont seem to have bloom."*
Correct, and the arithmetic says why. `seam.emissive` shipped at **1.2**:

```
#F59A24 linear luminance 0.428 × 1.2 = 0.514
× tone.exposure 2                    = 1.03     bloom.threshold 1, smoothing 0.2
```

On the knee, so effectively no contribution; at the spec `exposure 1` it is 0.514, nowhere near. The
rail at `emissive 2` reaches 1.71 and clears it comfortably.

The default was chosen to sit *under* the rail and landed *under the bloom knee* instead — and it
contradicted the direction. `ART_MATERIALS.md` §3 puts interior seam inserts in the **gameplay tier**,
*"above threshold; halo is part of the look"*, at reference intensity 1.0 = `MARIGOLD_REFERENCE_INTENSITY`
= **2.0**. `SEAM_SURFACE` was already seeded with exactly that; the tunable was overwriting it every
frame in `track-seams.tsx`.

**`seam.emissive` 1.2 → 2**, matching the rail and the gameplay tier. A stale `seam.emissive: 1.2` had
to be deleted from `localStorage` for the new spec default to apply.

### How the store actually stales a default — corrected

This session first wrote that "first load persists every spec default". **That is wrong.** Corrected by
`asteroids` and verified-this-session in `apps/client/app/dev/tunables.ts`:

- `restore()` is called bare at `:216`. It never writes. It applies a saved value only for keys the
  saved blob **already has** — `:199`, `if ( typeof v === 'number' && Number.isFinite( v ) )`.
- `persist()` is reachable from exactly one place, `announce()` at `:218-222`, which runs on a **set**.

Two consequences:

1. **Appending a new key is safe against a populated store.** A fresh key is absent from every saved
   blob, so it takes its source default on load. No clearing needed to see a new knob.
2. **The real trap: the first slider move of *any* key persists the whole `numbers` object**, every key
   including untouched defaults. One drag of `rock.scale` freezes `seam.emissive`, the Blocks group and
   everything else at their current values. After that, a source-side default change to **any** key is
   invisible in that browser until the store is cleared.

So the trigger is *"somebody moved any slider once"*, not *"the app loaded once"*. And clearing the
store to observe a new default **discards the owner's entire dialled set** — which is how `exposure 2`
gets lost. Back it up before clearing, every time.

**Unverified visually.** The extension opened a fresh hidden window and the frame could not be
captured. The claim rests on arithmetic plus the fact that the seams now carry byte-identical emissive
to the rail, which is observed to bloom. Confirm on the next visible frame.

### A broader finding worth acting on

At the **spec** `tone.exposure` of 1, the rail itself computes to 0.856 — *below* `bloom.threshold 1`.
Nothing in the marigold set blooms at spec defaults; the entire look currently depends on the owner's
dialled `exposure 2`. Either the exposure default or the bloom threshold is wrong. Not touched here
because it is one number with whole-frame consequences and it is the owner's call.

## Three sessions share this tree — coordination as of this note

`slur-supervisor` (this one), `asteroids`, `monoliths`. All three are in
`/Users/apple/Projects/personal/slur` on `feat/test-level`, and **nothing is committed**.

| Session | State | Owns |
|---|---|---|
| `slur-supervisor` | this note's work, uncommitted | rail/emitter/seam files below |
| `asteroids` | plan phase, **has edited nothing** | will own `asteroid-*.ts(x)` |
| `monoliths` | busy 17h+, not yet answered | unknown — ask before committing |

`asteroids` confirmed it will append-only into three shared files and announce each first:
`dev/tunables.ts` (a `rock.*` group), `game-environment.tsx` (one `<Asteroids>` line),
`track-materials.ts` (possibly an `asteroidSurface()`). It has not touched any file this note lists.

**The sky question is closed.** `monoliths` owns it and it is **already committed** (`adcd356`,
`dcc3149`), not dirty. `git status` confirms: none of `deep-space-sky.tsx`, `sky-config*`,
`world-scene.tsx` or `sky-backdrop.tsx` appear any more. The earlier note in this session that they
were dirty was true at session start and is now stale — they were committed under us.

**`monoliths` made a breaking shared-sim change.** The owner asked it to remove slow/drag blocks
entirely: `Block.lethal` is gone from the shared `Block` interface, `step.ts` lost its drag speed-cap
branch, and `track-materials.ts` lost `LETHAL_SURFACE`, `DRAG_SURFACE`, `DRAG_OPACITY_MIN/MAX` and
`DRAG_PULSE_SPEED`. Verified-this-session: **no file this session wrote imports any of them.** This
also **closes the carried-over "should lethal and drag bloom?" question — there is no drag block any
more.**

Its other note, worth chasing: at `fill.point 25.6` its blocks wash out pale grey because they are
`metalness 0` (full diffuse), where the deck escapes at `metalness 1`.

**Chrome is a single-occupancy resource.** The extension opens its own window; a tab outside the
frontmost window is `document.hidden`, rAF is throttled to zero, every screenshot is black, and a
`javascript_tool` call that awaits rAF hangs to the 45s CDP timeout. Only the human can raise a window,
so two sessions cannot both have a live canvas. `asteroids` took the window mid-session and handed it
back. Announce before taking it.

**`localStorage['slur.tunables']` is shared by every window**, the owner's included. Back it up before
writing (this session's copy: `scratchpad/tunables-backup.json`) and say so before reloading.

### Concurrent-edit outcome

`tunables.ts` gained `block.*` and `level.*` groups from another session *while this one was editing
it*, and `perf.dpr` went back to spec 2. `seam.emissive` survived at line 59 — by luck, not by
protocol. Re-verified after the fact: every marker from this session is still present
(`SEAM_SURFACE`, `<TrackSeams>`, `RAIL_EMISSIVE_SHARE = 0.125`, both `viewMatrix` lines, and no
`camera` left in `track-rails.ts`).

Gates re-run after the concurrent edits: typecheck clean · **136** client tests · 95 shared · 4 server
· lint clean. (Client and shared counts moved under this session — other sessions' tests.)

## Gotchas

- **The extension opens its own Chrome window.** The owner raised a window twice and it was the wrong
  one; the tab group from a previous session was gone. Retitling the tab via `document.title` is the
  fastest way to let them find the right one.
- **Shared `localStorage`.** The owner was dialling `deck.*` in their window mid-session. Back the
  store up (`sessionStorage` *and* a file) before writing it, and say so before each reload.
