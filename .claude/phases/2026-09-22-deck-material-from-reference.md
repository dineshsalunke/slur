# Deck material, measured off the golden reference

Date: 2026-09-22. Branch: `feat/test-level`. Uncommitted.

Owner's sequence for this work, in order: **(1) tile texture at ~4u → (2) material settings →
(3) wear/patch texture → (4) rail.** Step 1 is done. Steps 2–4 are not started.

## Method — the reference was measured, not eyeballed

No ImageMagick or `sharp` in this repo, so `scratchpad/png.mjs` decodes PNG with Node's built-in
`zlib` (IHDR + IDAT inflate + un-filter). Scale calibration: the two rail peaks on row y=460 of
`cruise-lighting.png` sit at x=51 and x=1528; those are the ±32.5u boundary centrelines, giving
**22.7 px/u** at that depth. Every world-unit figure below derives from it.

The texture was verified by running the **real module** headless — `document.createElement` stubbed
with a canvas that rasterises `fillRect` into a `Uint8Array`, driven by `tsx`. That proves the
pattern, not the look. **Nothing here has been seen in a browser.**

## What changed

| File | Change |
|------|--------|
| `apps/client/app/game/scene/track-texture.ts` | Rewritten twice. **4u × 4u square plates**, straight bond, 0.1u joints, neutral `#23272A` base, per-plate value jitter ±4%. Old `drawBlotches`/`drawGrain` removed. Cell 16u × 32u at 64 px/u → 1024 × 2048. Then: joint contrast 0.16 → **0.34** and a **normal map** added; `trackSurfaceTexture()` → `trackSurfaceMaps(): { map, normalMap }`. |
| `apps/client/app/game/scene/track-geometry.ts` | `PANEL_W`/`PANEL_L` (16/20) → `TEX_SPAN_X`/`TEX_SPAN_Z` (16/32) across the three `uvFor` planes. |
| `apps/client/app/game/scene/track-materials.ts` | `floorSurface()` spreads `trackSurfaceMaps()` and sets `normalScale`. **Owner also has `FLOOR_ENV_MAP_INTENSITY = 0` here, uncommitted — see the warning below.** |
| `docs/ART_MATERIALS.md` | Revision 5. Breaking bond struck; joint width 0.2–0.8u → 0.1u. Six sites. |

`pnpm typecheck` passes; biome clean on both source files; comment ratchet clean.

Headless verification output:

```
longitudinal joints @ z=2u : [ 3.95, 7.95, 11.95, 15.95 ] u
longitudinal joints @ z=20u: [ 3.95, 7.95, 11.95, 15.95 ] u   <- same phase = straight bond
transverse  joints @ x=2u  : [ 15.95, 31.95 ] u
```

## Measurements from `cruise-lighting.png`

**Deck, where nothing warm reflects** — `#2c3236` far, `#1d2124` mid, `#181919`–`#1d1f21` near.
b/r ratio **1.14 – 1.22**, and it *decreases* toward camera: the coolness is environment reflection,
not albedo. The old `BASE = '#14181e'` was b/r **1.50** — the blue was baked into albedo where the
reference puts it in the reflection. Rendered luminance is L=25–37 near, 44 mid: a near-black surface
that earns its shape from reflection alone.

**Joint contrast — 9–31%, clustered 10–20%, mean ~16%.** Two independent scans agree. A separate
population at 95–100% exists: those are gap voids, not joints. This closes §5's contrast question.

**Roughness — 0.42–0.45.** The pickup at x=878 is ~70px tall; its reflection streak runs 90+px and is
still at 50% of peak at 2.5× the object's height. A mirror would return a 70px copy. Upper half of
M1's 0.35–0.50 band.

**Metalness 1.0.** The streak holds its source hue (`#e9a860` → `#8e5f35`) instead of washing white,
so F0 is neutral. `track-materials.ts:5` currently has `0.75`, contradicting §M1's own table.

**Boundary rail cross-section** (left rail, y=460, total influence 48px = **2.1u**, bright core 14px =
**0.62u**):

| Offset | Colour | L |
|---|---|---|
| 0 | `#ffffe1` | 253 — **clipped white** |
| ±5 | `#eac493` | 202 |
| ±9 | `#b16a28` | 116 |
| ±20 | `#3b2208` | 37 |

Inboard shoulder is ~2× the outboard one — that extra is the deck reflecting the rail, free once
roughness and metalness are right. Do not author it.

**Interior inlays are dimmer than the boundary.** Core `#fce9b3`, L=**233, sub-clipped**, ~7px wide —
despite being far nearer camera than the rail sample. §M7 says *"both may be equally hot"*; the
reference separates them by intensity and extent as well as continuity. Inferred from two samples at
different depths; direction is clear but it wants a second sample before freezing. **Not yet recorded
as a §7 departure.**

## The rail cannot currently reach the reference — verified

`BOUNDARY_SURFACE` is `emissive: '#F59A24'` at `emissiveIntensity: 2.0`. `#F59A24` has a linear blue
of 0.017, **1.9% of its red**; at intensity 2 the blue channel peaks near 0.03 and renders saturated
orange. The reference core is `#ffffe1` — blue **225**.

That whiteness comes from ACES desaturating highlights through its cross-channel matrix, which only
engages far past clipping. **Verified-this-session:** R3F 9 sets
`gl.toneMapping = ACESFilmicToneMapping` by default
(`apps/client/node_modules/@react-three/fiber/dist/events-156d8d12.esm.js:15903`) and nothing in the
project overrides it. So the fix is roughly **8–20× the current intensity**, not a different colour.
The golden read then lives in the shoulder, exactly as §M7 describes. Untested — it will need the
bloom (`threshold: 0.42`) retuned alongside it, and that is an eyes-on pass.

## Decisions taken this session

**Breaking bond removed (owner, 2026-09-22).** Owner's read: *"it looks like a brick wall more than a
scifi metal floor or deck"*. The sheet contradicted itself — §M1 justified the offset as *"the way
real metal decking is laid"* while §M8 quotes board 24's audit naming the same read as the defect:
*"acquire a masonry-like small-panel texture, which is not the intended metal section"*. Two things
caused it: the offset **and** the square aspect. Plates are now elongated down-track.

**The rationale was struck, not preserved.** Owner's explicit instruction: *"remove this it was
wrongly added"*. §7 item 7 rewritten, revision 4's §8 entry gone rather than struck through.

**Consequence, easy to miss:** the lane ban now rests on **joint contrast alone**. There is no
structural guarantee left, so §5's gate is load-bearing. Under straight bond the mid-to-far deck
reverting toward stripes through mip blur is the *expected* behaviour, not a "most likely survives".

**Joint width 0.2–0.8u → 0.1u (owner).** Below the range the same owner set on 2026-09-20; 0.3u still
read as a groove rather than a seam.

Also corrected in passing: §5 cited `CHASE: 7.5u up, 15u back`, stale since yesterday's retune
(`chase.ts:7-8` is now 4.7 / 7.3).

## Grooves — darker, plus a normal map (owner, 2026-09-22)

Joint albedo contrast **0.16 → 0.34**. The 16% came from measuring the *rendered* reference, where the
groove is lit; on our render it read too light. Owner's eye on the real render outranks a measurement
of a different image, but the number is now a departure from §5's recorded contrast and is **not yet
written into `ART_MATERIALS.md`**.

`trackSurfaceMaps()` returns `{ map, normalMap }` built from one shared layout (`eachJoint`) so the two
register exactly. Verified headless:

```
ALBEDO  x=252 34,37,40 | x=253..258 23,26,28 | x=259 35,39,42     -> 34% contrast, 6px = 0.1u
NORMAL  x=253..255 223,128,212   x=256..258 32,128,212            -> two walls, opposite tilt
NORMAL  transverse: y=1021..1023 128,223,212  y=1024..1026 128,32,212
```

Plate interior is flat `128,128,255`. `WALL_TILT = 0.75`, `NORMAL_SCALE = 0.8`, both exported to dial.

**Two caveats, neither resolved:**

- **Green-channel convention is unverified.** I picked `+WALL_TILT` on the lower-v wall. If three.js's
  V orientation runs the other way the transverse joints will read as **ridges, not grooves**. Fix is a
  negative `normalScale.y`, not a texture change. Look at this first.
- **At 0.1u the groove is 6.4px in the texture.** The normal map will read near-camera and mip away
  fast. At distance the darkening does all the work. If the groove needs to read further out, the
  honest lever is width or contrast, not normal strength.

## Rail emissive parked black (owner, 2026-09-22) — TEMPORARY, revert before rail work

`BOUNDARY_SURFACE` is now `emissive: '#000000'`, `emissiveIntensity: 0`, `color: '#000000'`, so the
deck can be judged without marigold dominating the frame. **Restore from git before starting step 4.**
Previous values: `emissive: MARIGOLD_EMISSIVE`, `emissiveIntensity: MARIGOLD_REFERENCE_INTENSITY`,
`color: '#15171a'`.

`track-boundary.tsx` re-passed `emissiveIntensity={ MARIGOLD_REFERENCE_INTENSITY }` as an explicit prop
after the spread, which would have overridden the zero — that prop and its now-unused import were
removed, so `BOUNDARY_SURFACE` is the single source. Put it back the same way, or don't: the explicit
prop was redundant with the spread to begin with.

**What was deliberately NOT touched: the rail emitter light array.** `RAIL_EMITTER_INTENSITY = 40` in
`track-materials.ts`, fed per-frame by `feedEmitters` in `track-floor.tsx`, is a patched light that
makes the rail actually *illuminate* the deck — §M1: *"an emissive material does not illuminate its
surroundings, and bloom produces a halo, not lighting."* So the rail is now **black but still throwing
warm light**, which looks odd but is what makes the deck judgeable at all. With
`FLOOR_ENV_MAP_INTENSITY = 0` this emitter array is close to the deck's only source — killing it too
would black the deck out entirely.

## Plates are SQUARE — 4u × 4u. Do not stretch them again.

The owner's brief from the start was *"i want every tile to be around 4u"*, restated twice more:
*"the tile doesn't look square"*, then *"who said a plate is supposed to be 4X8u ? i want each tile to
be square"*. Settled: **`PLATE_W_U = PLATE_L_U = 4`**, `COLS = ROWS = 4`, cell 16u × 16u → 1024 × 1024,
64 px/u on both axes. Verified: joint pitch 4u on both axes.

**What went wrong, so it is not repeated.** When the brick-wall read was fixed, two changes were made
at once — the row offset was removed (correct) *and* the plate was stretched to 4u × 16u (not asked
for, not flagged). The masonry read came from **offset + square**; removing the offset was sufficient
on its own. The stretch was then dialled 16u → 8u → 4u across three round trips that should not have
happened. **Square + straight bond is the design.**

`PLATE_W_U = 4` is separately fixed by board 24's *"16 across 64u"* and must not move. `COLS`/`ROWS`
set the repeat period only.

## Warning — `FLOOR_ENV_MAP_INTENSITY = 0`

Owner set this, uncommitted, and I left it alone. With `FLOOR_METALNESS = 0.75` and no environment to
reflect, a metal renders **black**. §M0 states it directly: *"a bare metal surface with nothing to
reflect renders black and reads as a hole. This is a constraint on the lighting rig, not a licence to
drop metalness until the problem goes away."*

This also makes the wear work below **impossible to judge**, because §M1 says *"The wear is only visible
inside the reflection … Roughness variation on an unlit conductor is invisible. Whatever supplies the
deck's warm energy must therefore exist **before** wear can be judged at all — tuning it first is
tuning against black."* Resolve the env map before starting step 3.

## Next steps

1. **Look at step 1 in a browser** before step 2. `/test-level` or a hosted room. Nothing is confirmed
   visually.
2. **Step 2 — material settings.** `FLOOR_METALNESS` 0.75 → 1.0; `FLOOR_ROUGHNESS` 0.4 → 0.43; drop
   the duplicate roughness/metalness props at `track-floor.tsx:229-231` (already in `floorSurface()`).
3. **Step 3 — wear. The big one; owner named it as the challenge.** Add a third map to
   `trackSurfaceMaps()` alongside the existing two. Specifics worked out but not built:

   - **Roughness is the instrument, not albedo.** §M1 froze this to board 25 on 2026-09-19: the three
     layers are *"broad softly-bounded finish patches that interrupt the warm reflections"*, *"occasional
     elongated scuff clusters with a weak down-track bias that never becomes a continuous traffic
     path"*, and *"sparse joint-edge rub on selected bevels rather than a bright outline on every
     panel"* — *"All three are **roughness**, not albedo and not geometry."* The owner's circled
     patches on `cruise-lighting.png` are layer one.
   - **Plumbing:** three.js multiplies `material.roughness` by the map's **green** channel. So the map
     cannot brighten — centre the field near **0.8 grey** and raise `FLOOR_ROUGHNESS` to `0.43 / 0.8 ≈
     0.54` so the clean plate still lands on the measured 0.43. Adding a `roughnessMap` without moving
     the scalar silently darkens roughness across the whole deck.
   - **Scale:** patches read roughly half a plate to two plates in the reference, soft-edged and
     irregular. Authored in world units, not pixels (§1: *"A detail authored to look right on screen is
     wrong the moment the camera moves"*). The 16u × 32u cell is the repeat period — patches larger than
     that will visibly tile, so either keep them under it or break the repeat another way.
   - **Excluded, from board 25's own list:** rust, flaking paint, grime, skid marks without a contact
     rationale, bright silver scratches, dents, craters, debris, **all-over fine noise**, lane-like wear
     bands, fully outlined tile edges. The deleted `drawGrain` was all-over fine noise — do not
     reinstate it. *"Wear must never generate a new seam or read as a hole."*
   - **Subordination test:** §M1 — *"If a wear field is reading before the panel divisions do, it is too
     strong regardless of how well it matches a crop."*
   - **Blocked until the env map is resolved** — see the warning above. Wear tuned against a black deck
     is tuned against nothing.
4. **Step 4 — rail.** Owner's proposal: 3u wide, flush, 2.0–2.5u groove at centre, 0.25/0.5u metal
   shoulders. Sits at `[32, 35]`, outboard, taking no playable width — §M7 already sanctions this as
   *"the flush alternative"*. **Caveat:** the reference's emitter core is only 0.62u; the 2.1u I
   measured is glow plus deck reflection. A literally-emissive 2.5u face is 3–4× the reference and
   will read as a runway light. Recessing the groove so its walls shadow the edges gives a narrow
   visible band from a wide channel — probably the intent of the word "groove".
5. **Unwritten:** the §7 departure entries for (a) the base-colour hue — §M1's range `#0A1117`–`#303C45`
   is b/r ≥ 1.44 at both ends, bluer than the reference renders, so the doc's *value* was kept and the
   measured *hue* taken; and (b) the boundary-vs-inlay intensity separation above.
6. Still open from the previous handover, untouched: ADR follow-up for the camera retune
   (`DECISIONS.md:476`), the `hit-spark.tsx`/`explosions.tsx` unparked-instance audit, and splitting
   the origin-block fix into its own issue/PR.

## Scratchpad

`png.mjs` (decoder), `probe.mjs`, `rail.mjs`, `profile.mjs`, `seams.mjs`, `joint.mjs`, `bond.mjs`
(measurement), `render2.mts` (headless texture verification). Session-scoped — recreate from this doc
if needed.

One measurement **failed and should not be trusted if repeated**: `bond.mjs` tried to decide whether
the reference itself uses breaking bond by projecting joints toward a vanishing point. It returned
~40% hits, which is about what chance gives at that joint density — the detector cannot separate
joints from wear mottling, and the VP estimate is rough. It settled nothing.
