# One tone map, and the wash that was never the bloom

Branch `feat/test-level`. Picks up `2026-09-22-owner-numbers-and-the-ship-glow.md`, whose fifth pass
left `<Canvas flat>` as **"Owner's call — not done"**. Owner's answer this session: *"then why not just
fix it instead of filing an issue"* — so it was fixed rather than filed.

## The pipeline change

Verified-this-session:

- `@react-three/fiber` **9.7.0**, `dist/events-156d8d12.esm.js:15903` —
  `gl.toneMapping = flat ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping`. Neither gameplay canvas
  passed `flat`, so **in-shader ACES** ran on every material.
- `world-scene.tsx:36-39` — the `EffectComposer` holds `<SceneBloom />` then `<ToneTuning />`.
- `tunables.ts:122` — `tone.mapping` had already been changed to spec default `Reinhard` (the earlier
  handover recorded it as `None`, which was true of the owner's *storage*, not the spec).

So the shipped default was **ACES → bloom → Reinhard**. Two curves.

The double curve was the smaller problem. ACES ran in the **material shader, before the composer**, so
the bloom pass never received an HDR value — which is why emissives had to be pushed to 6 and 10 to
cross a `0.9` threshold. Those numbers were compensation for a curve applied in the wrong place.

**As built:** `flat` on `routes/test-level/test-level-canvas.tsx` and `game/net-canvas.tsx` — both mount
the same `WorldScene`, so the real room carried the same double map. `landing-scene.tsx` and
`env-lab-canvas.tsx` deliberately **not** touched: neither mounts `ToneTuning`, so `flat` there would
leave them with no tone map at all and clip their neon to white.

### Why Neutral

`tone.mapping` spec default → **`Neutral`** (Khronos PBR Neutral). Verified-this-session against the
installed `postprocessing@6.39.4`, `build/index.js:13481` — `ToneMappingMode.NEUTRAL` maps to three's
`NeutralToneMapping`.

| Candidate | Weighing against `golden-reference/cruise-lighting.png` |
|---|---|
| **Neutral** | **chosen** — hue-preserving highlight rolloff; the saturated orange core survives |
| ACESFilmic | the known skew: bright saturated orange rides toward yellow then white. Our primary colour is the one it damages most |
| AgX | desaturates hard toward white by design and lifts blacks — kills both the neon and the black deck |
| Reinhard | no shoulder worth the name; the whole frame goes milky |
| Cineon | dated film emulation, hue shifts in the highlights |
| None / Linear | clips. White cords with an orange halo — the inverse of the reference |

The reference is the argument: its rim cords read **saturated orange at their brightest**, and only the
exhaust cores go white.

## The re-dial, and the finding

Driven live at `/test-level` through the Chrome extension, writing `localStorage['slur.tunables']` and
reloading (the store is a module singleton — `tunables.ts:198` runs `restore()` at import, so there is
no window handle to poke).

**Every prediction about the over-bloom was wrong.**

| A/B | Result |
|---|---|
| `bloom.threshold` 0.9 → 1.4 | almost no change |
| `rail.emissive` 2 → 0.8 | no change |
| `rail.emissive` → **0** | near edge *still* a white smear |
| **`emitter.intensity` 10 → 0** | **smear gone; rails snap to thin saturated cords** |

The blowout was the **emitter array** — `emitter.intensity` 10 over `emitter.range` **690u**
(`tunables.ts:98-99`), line lights washing the deck along the full rail length. Dialled when ACES was
compressing everything downstream; with ACES gone it dominates the frame. The rail strips
(`track-rail.tsx:93` — `strip.emissiveIntensity = num( 'rail.emissive' )`) and the bloom pass were
never the problem, which is why the first two A/Bs moved nothing.

**Landed into `NUMBER_SPECS`:**

| Key | Was | Now |
|---|---|---|
| `emitter.intensity` | 10 | 1.5 |
| `bloom.threshold` | 0.9 | 1 |
| `bloom.intensity` | 0.45 | 0.7 |
| `fill.point` | 1.2 | 25.6 |
| `fill.pointBack` | 8 | 4 |
| `fill.pointLift` | 6 | 0 |
| `fill.pointDecay` | 0 | 0.1 |
| `fill.pointDistance` | 0 | 140 |
| `fill.pointColor` | `#7d8ea3` | `#5f6367` |

The `Fill` block is the owner's own dialling, landed as spec defaults **because a `reset` ate it during
this session**. It was recovered from the previous handover's recorded values. Spec defaults are now the
protection against that happening again.

**Tested and reverted, no gain:** `deck.metalness` 0.9 → 0.5 and `fill.point` 25.6 → 50 both left the
near deck essentially unchanged. `deck.metalness` stays at Codex's 0.9 — no reason to move an
art-direction value for nothing. Note this contradicts the *second pass* of the previous handover, which
found metalness to be the only lever; that reading held at `fill.point` 1.2, not at 25.6.

## Docs

`conventions/r3f.md` §"Tone mapping" — the "Open … **not done**" paragraph is replaced by what is now
true: every gameplay Canvas carries `flat`, which canvases do not and why, and the Neutral rationale
with the reference cited. `.claude/rules/r3f-rendering.md` was already correct from the previous
session's `toneMapped: false` removal.

## Still open — none of them is a dial

- **Inboard amber deck seams.** The reference carries marigold across the full track width; our floor
  only has `isOuterEdge` rails, so the deck goes near-black at bottom-centre. Content.
- **`BOUNDARY_W = 1.0u`** against the reference's ~0.2–0.3u cord. Geometry, and it feeds collision.
- **The sky reads navy** where the reference nebula is desaturated grey. `ibl.*` and the dome, separate
  from the tone pipeline.
- `ART_MATERIALS.md` §7 decisions-and-departures entries.
- Panel is `/test-level` only.
- **Revert before merge:** fog (`game-environment.tsx`).
- `perf.dpr` — spec 2, still unasked.

## Commit

Everything landed in **`4cf3a84`** *"feat(client): rebuild the corridor look — rail, deck, lighting and
grade"* — committed by a **parallel process** in the window between this session's `git add -A` and its
`git commit`, which is why the message is not the one this session wrote. Verified present in `HEAD`:
`flat` on both canvases (reformatted multi-line by biome, prop intact), all nine spec values, and the
`conventions/r3f.md` rewrite.

That commit also carries `near: 1, far: 1000` on both cameras, which this session **did not write** —
not present when the files were read. Likely the same parallel process; issue #128 covers exactly that
default. **Worth checking before the branch merges.**

## Gotchas that cost time

- **The extension's tab was `document.hidden: true` twice.** rAF is throttled to zero there, so the
  canvas never renders and every screenshot is black — and a `javascript_tool` call that awaits rAF
  hangs until the 45s CDP timeout. `resize_window` works on a hidden window but does **not** raise it.
  Only the owner can bring it forward.
- **The owner and the agent share one `localStorage`.** Mid-session both were dialling; `tone.exposure`
  moved from 1 to 3 under the agent's feet and the A/B chain had to be restarted. Agree who drives.
- **`reset` wiped the owner's whole dialled set**, `Fill` included. The previous handover's recorded
  numbers were the only copy. Write dialled values into a doc *before* the session that might reset them.

## HANDOVER — safe to `/clear` from here

Tree is **clean**, everything committed on `feat/test-level`. Next steps, in order:

1. **Check the `near: 1, far: 1000` camera change** that arrived with `4cf3a84` (see above).
2. **Re-dial the emissives that have no knob** now that bloom sees true HDR — finish gate 2.4, pickups
   3, bolts 4, `mono.seam` 10, `rim.emissive` 6. All hard-coded; each is a code edit.
3. **Inboard amber deck seams** — the largest remaining gap against the reference.
4. `BOUNDARY_W`, the sky, `ART_MATERIALS.md` §7, `perf.dpr`, the fog revert.

## Second pass — the knobless emissives needed nothing, and the camera change is accounted for

Owner: *"go ahead and do those changes your self"* — the two items this note handed forward.

### The re-dial item was based on a wrong prediction

The first pass said the hard-coded emissives *"will bloom less than they did"* and would need raising.
**Wrong, and the arithmetic says so.** Removing the in-shader ACES makes them arrive at the composer
**hotter**, not dimmer. Linear Rec.709 luminance × `emissiveIntensity`, against the new
`bloom.threshold` of 1.0:

| Surface | hex | int | lum × int | |
|---|---|---|---|---|
| finish gate posts/beam | `#39ff14` | 2.4 | 1.74 | blooms |
| pickups | `#ffd24a` | 3 | 2.04 | blooms |
| bolts | `#8affff` | 4 | 3.37 | blooms |
| rim cords (knobbed) | `#F59A24` | 6 | 2.56 | blooms |
| boundary / rail | `#F59A24` | 2.0 | 0.85 | below |
| drag surface | `#ffa51f` | 1.6 | 0.77 | below |
| lethal surface | `#ff2740` | 2.2 | 0.51 | below |
| finish banner | `#39ff14` | 0.5 | 0.36 | below |

**Nothing was changed.** Reasoning per row:

- The four that bloom already do; raising them would over-blow the frame.
- **Rails were not touched even though 0.85 is under threshold.** They were settled *visually* in the
  first pass and read as thin saturated cords. The live dial outranks the arithmetic. Note also that
  `rail.emissive` (spec 2) overwrites `BOUNDARY_SURFACE.emissiveIntensity` every frame in
  `track-rail.tsx:93`, so editing the constant alone would do nothing.
- **`lethal` 0.51 and `drag` 0.77 are left alone deliberately.** They were below threshold *before*
  this change too, and further below then. Making hazard blocks glow is a **new art decision, not a
  repair**, and `/test-level` runs `blockDensity: 0` so there is no way to judge it there. Open
  question for the owner, not a silent edit.
- The finish banner is translucent; 0.36 reads as intentional.
- `track.tsx:56` (`#0a2540` @1.4, luminance 0.02) is legacy and mounted only by `/env-lab`, which has
  neither `flat` nor `ToneTuning`. Unaffected.

### The camera change is legitimate

`near: 1, far: 1000` arriving with `4cf3a84` was **not** a stray edit. It is a parallel agent's work,
recorded in `.claude/phases/2026-09-22-depth-precision-and-exposure-order.md`, fixing the owner's
report that the gap seams flicker while moving. `far: 1000` equals R3F's own default, so the real
change is `near` 0.1 → 1. Nothing to chase; the first pass's flag is closed.

### Verified

`localStorage['slur.tunables']` was **removed entirely** and `/test-level` reloaded from pure spec
defaults. The frame is identical to the dialled one — the numbers are in `NUMBER_SPECS`, not in a
browser. This is the check worth repeating after any dialling session.

### Open for the owner

**Should `lethal` and `drag` bloom?** Crossing 1.0 needs `lethal` ≈ 5.0 and `drag` ≈ 2.4. It is a
readability argument (a hazard that does not glow) against an art one, and it has never been true in
this project. Needs a route with `blockDensity > 0` to judge.

## Third pass — the sky patch is gone, the image is `scene.background`

Owner: *"we are now going with the image as background… why not remove the whole dome and just put the
image as scene background"*, then *"the image in the dome itself is not contributing anything to
lighting right now, so why have the dome"*.

### What the "dome" actually was

Not a dome. `sky-backdrop.tsx` built a **spherical patch** — `sphereGeometry` with a phi span of
`fovDeg: 120` and a matching theta span, aimed by `bearingDeg: 0` / `elevationDeg: -2`, alpha-feathered
`edgeFadeDeg: 12` at its rim, at `radius: 800`. Everything outside that patch was the flat
`<color attach="background">` from `EnvConfig.background` (`#02030a`). The patch existed to give a
**rectangular** matte (`/textures/nebula-backdrop.jpg`, 1672×941) a direction in the world.

The owner is right that it lit nothing: `meshBasicMaterial`, and three has no SSR. Reflections on the
`metalness` 0.9 deck come from `GradientIbl`, which is untouched by this change.

### An argument this session made and withdrew

The case against `scene.background` was that a plain `Texture` (UVMapping) is drawn screen-space and
does **not** rotate with the camera, so the nebula would be pinned to the frame — and that fixing it
properly needed the art re-authored as an equirect panorama.

**The owner's counter is correct:** *"game camera only moves in one direction what is a panorama going
to help with"*. The chase camera looks down `+Z` and only yaws by the strafe lag — the deleted test
computed exactly that angle as `atan( STRAFE_LAG_U / LOOK_DISTANCE_U )`, a few degrees. There is no
view in this game where a panorama shows anything a flat image cannot. Argument withdrawn; recorded
here because it was made in chat and someone will otherwise re-make it.

### As built

`game-environment.tsx` puts the texture on `scene.background` via `<primitive attach="background" />`,
with `repeat`/`offset` derived from `useThree( state => state.size )` so the image **covers** the
viewport instead of stretching on a non-matching aspect. A second benefit over the patch: a background
has no geometry, so it cannot be clipped by the far plane — the patch sat at `radius` 800 against the
`far: 1000` that landed in `4cf3a84`, 200u of headroom that nobody was watching.

**Deleted:** `sky-backdrop.tsx`; the `backdrop` and `toneMapped` props on `DeepSpaceSky`;
`SkyBackdropConfig` and `DEEP_SPACE.backdrop`; the `config` prop on `GameEnvironment`
(`EnvConfig.background` was its only reader). Four `sky-config.test.ts` cases described only the patch
geometry — removed with their helpers (`frameHalfWidthDeg`, `IMAGE_ASPECT`, `CANVAS_ASPECT`,
`STRAFE_LAG_U`, `LOOK_DISTANCE_U`); the far-plane and star-shell assertions stay under clearer names.

**Untouched:** `Stars`, `SkyFollow`, `StarLight`, `SkyEnvironment`, `GradientIbl`.

`pnpm typecheck` · `pnpm test` (125 client, down 3 from the removed patch tests) · `pnpm lint` green,
7 warnings, same set as `HEAD` before the change. Verified live: the nebula fills the frame edge to
edge where the patch used to feather into flat `#02030a` at the margins.

Committed as **`adcd356`**.

### Note for whoever reads `EnvConfig` next

`EnvConfig.background` now has no reader in the game path. It is still declared in `env-config.ts` and
set by all three presets. Left in place rather than cascading the removal — `environment.tsx` (the
`/env-lab` path with `GradientDome`) is a separate consumer and was not part of this change.
