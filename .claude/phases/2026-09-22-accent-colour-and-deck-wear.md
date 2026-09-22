# Accent colour pipeline + deck wear

Date: 2026-09-22. Branch: `feat/test-level`. Uncommitted.
Continues `2026-09-22-deck-material-from-reference.md` — read that first for the deck/reference work.

**Nothing in this document has been seen in a browser.** Every claim below is either source-verified
against the installed stack or arithmetic; none of it is a visual judgement.

## A second agent is live in `track-materials.ts`

The owner has another agent working the lighting. Observed mid-session, already changed by them:
`FLOOR_METALNESS 0.75 -> 1`, `BOUNDARY_SURFACE` restored from parked-black to
`emissive: MARIGOLD_EMISSIVE`, and `RAIL_EMITTER_INTENSITY 60 -> 0`. **The rail throws no light in the
current working state**, so the accent will not be visible on the deck until that lands.

This constrained the accent design: the marigold export was deliberately **not** moved out of
`track-materials.ts`. It became a one-line re-point instead, to keep the conflict surface minimal.

## Step 1 of the wear sequence — the normal flip (owner asked to compare ridge vs groove)

No texture rebuild. Verified in `three@0.185.1`
`src/renderers/shaders/ShaderChunk/normal_fragment_maps.glsl.js` — `mapN.xy *= normalScale`, so
negating a component flips that tangent axis.

`track-texture.ts:26-27`:

```ts
export const NORMAL_SIGN_X = -1;
export const NORMAL_SIGN_Y = -1;
```

Both `-1`, so the **inverted** reading is what renders now. Set either to `1` to go back. They are
independent on purpose: the previous handover flagged the green-channel convention as unverified, so
if the two joint directions disagree (longitudinal grooves, transverse ridges), flip `Y` alone.

**Still unanswered — this was the question the owner asked.** Which sign reads as a groove has not
been judged. It needs eyes.

## Step 3 — deck wear (roughness map)

Third map on `trackSurfaceMaps()`, roughness only, per the three frozen layers at
`ART_MATERIALS.md:153`.

Verified in `three@0.185.1` `roughnessmap_fragment.glsl.js`: `roughnessFactor *= texelRoughness.g`.
Green channel, **multiplicative** — the map can only darken. Hence the mandatory pairing:

```ts
export const FLOOR_ROUGHNESS_CLEAN = 0.43;
export const FLOOR_ROUGHNESS = FLOOR_ROUGHNESS_CLEAN / ROUGHNESS_MAP_BASE;  // 0.5375
```

The field centres on `0.8` grey so the clean plate still lands on the measured `0.43`. **Adding a
roughnessMap without moving the scalar silently darkens roughness across the whole deck** — that is
why `FLOOR_ROUGHNESS` is now derived rather than a literal. Do not "simplify" it back to `0.4`.

Measured range: clean `0.4300`, smoothest `0.4005`, roughest `0.4996` — inside §M1's `0.35 – 0.50`.

Three layers, in board 25's strength order (finish > scuff > rub):

| Layer | Constants | Shape |
|---|---|---|
| Finish patches | `FINISH_*`, 7 per cell, delta `+0.06..+0.13` / `-0.04..-0.10` | 3–5 overlapping soft lobes, 1.0–2.6u radius |
| Scuff clusters | `SCUFF_*`, 4 clusters, delta `+0.05..+0.10` | 3–6 elongated strokes, ±0.2 rad down-track bias |
| Joint-edge rub | `RUB_*`, 22% of segments, delta `+0.04..+0.08` | thin 0.12u strip beside selected joints |

### Two bugs the probe caught — both were mine, both nearly shipped

1. `SCUFF_ROUGHER_MAX = 0.22` **silently clamped** at `1.0` grey (`0.8 + 0.22 > 1`). The constant was a
   lie and the probe showed max delta `0.200`, not `0.22`.
2. **Layer strengths were inverted against the spec.** `ART_MATERIALS.md:153` — *"Three layers, **in
   strength order**: broad softly-bounded finish patches ... occasional elongated scuff clusters ...
   sparse joint-edge rub"*. Shipped order was scuff `0.22` > rub `0.20` > finish `0.18`, exactly
   backwards. Now finish `0.13` > scuff `0.10` > rub `0.08`.

Both were found only by instrumenting the real module. **Re-run the probe after any constant change.**

### Verification method, and its limit

No headless canvas exists in this repo, and the previous session's stub only handled `fillRect` —
gradients cannot be rasterised without a real canvas. So the probe is a **recording** stub: it
implements a 2D affine transform stack and records every `fill()` with its accumulated transform.

`scratchpad/wear-probe.mts`, run with `cd apps/server && pnpm exec tsx <path>` (client has no tsx).
Session-scoped; recreate from this description.

```
canvases built        : 3 (albedo, normal, roughness)
roughness lobe fills  : 495 = 55 lobes x 9 wrap copies
lobe centres in-cell  : 55
lobe greys            : 190 .. 237     delta -0.055 .. 0.129
lobe major radius (u) : 0.64 .. 2.56
off-cell wrap copies  : 440 (seam coverage present)
```

**This proves placement, counts, wrap coverage and deltas. It does not prove the look.**

### Known tiling risk, not resolved

The texture cell is 16u x 16u and the largest lobe is ~2.56u radius. Patches stay under the repeat
period, but 7 finish patches in a 16u cell **will** repeat visibly down a long track. §1 warns against
authoring to the screen; the repeat is a separate problem and has no fix in this change.

## Accent colour pipeline — new

Owner's ask: *"do something that is scalable and easy to update the adapt on the fly, cause at somepoint
i want to be able to shift the hue ever so slightly based on the level progression"*.

New module `apps/client/app/game/scene/accent.ts`:

```ts
accent()                    // live THREE.Color — bind the REFERENCE, never copy it
accentDerived( fn )         // registered derived colour, refreshed on change
accentHex()                 // current hex, for material props / DOM
setAccentShiftDeg( deg )    // hue offset, clamped to +-ACCENT_SHIFT_LIMIT_DEG (24)
setAccentAnchor( hex )      // swap the base colour
ACCENT_TRIALS               // marigold, ember, amber, brass, signal, coral, vermilion*
```

### Mechanism weighing (non-negotiable #13) — for the PR body

How a hue change reaches consumers:

| Option | Verdict |
|---|---|
| React context + state | rejected — re-renders the scene subtree per change, violates #4/#10 |
| Prop-drill from level config | rejected — #10 forbids it explicitly; touches every intermediate |
| koota trait + `useQuery` | rejected — accent is presentation, not sim; server never knows it |
| Recompute per-frame per consumer | rejected — every consumer pays `setHSL` each frame for a static value |
| **Module singleton, one mutable `Color`, consumers bind the reference** | **chosen** |

It works because **three reads `uniform.value` every frame regardless**, so mutating a shared `Color`
propagates for free — zero re-renders, zero per-frame cost. Matches #8 (long-lived resource outside
React) and r3f's "reuse with `.set()`/`.copy()`". Derived values register once and refresh on change.

Verified end-to-end: hue shifts, derived radiance tracks, clamp holds at +-24, and `accent() === accent()`
stays true across every mutation — the reference identity is what makes the uniform binding work.

### THE colour-space trap — do not undo this

`three@0.185.1` `src/math/ColorManagement.js:23` sets `workingColorSpace: LinearSRGBColorSpace`, and
`Color.js:248/567` default `setHSL`/`getHSL` to it. So three's bare `offsetHSL` rotates hue in **linear**
space.

Measured: marigold reads **20.5deg in linear but 33.9deg in sRGB**, and the same "+20deg" gives `#f5cf24`
(linear) vs `#f5e024` (sRGB).

`accent.ts` passes `THREE.SRGBColorSpace` explicitly to both calls so degrees mean what a person means.
**Replacing that with `offsetHSL` as a "simplification" silently changes the scale.**

### Live consumers — mutate and they follow

| Site | Binding |
|---|---|
| `track-floor.tsx:35` rail emitters | `const RAIL_COLOR = accent()` |
| `ship-model.tsx:98` ship edge | `uEdgeColor: { value: accent() }` |
| `sealed-block-shader.ts:33` block seams | `accentDerived( ( b, o ) => o.copy( b ).multiplyScalar( MARIGOLD_REFERENCE_INTENSITY ) )` |

`SEAM_RADIANCE` is **one module-level derived shared by every sealed block**. Do not call
`accentDerived` inside `sealedBlockUniforms` — it is per-block and would grow the registry unboundedly.

### Follows the anchor but NOT the live shift

`monolith-config.ts:55` and `BOUNDARY_SURFACE.emissive` are material props read at render, so R3F only
re-applies them on re-render. Fine for per-level progression (a level change remounts the track).
Mid-level continuous drift on those two needs a `useFrame` push doing `mat.emissive.copy( accent() )`.
**The subscriber machinery for that was deliberately not built** — which of the two the owner wants is
still unknown.

`monolith-config.ts:55` was a hardcoded `'#F59A24'` duplicate — the one that would have left monoliths
orange while everything else shifted.

### Three marigolds existed; one is still separate

`app.css:19` `--color-marigold: #ff9f1c` is a third distinct value, untouched. Tailwind tokens cannot
import from TS, so the DOM UI does not track the 3D accent. `colors.ts:5` `#ff9f1c` is a **player
identity** colour under a `COLOR_COUNT` guard — deliberately not shared, leave it alone.

## Vermilion trial — ACTIVE, this is a trial not a decision

`ACCENT_ANCHOR` is now `ACCENT_TRIALS.vermilion` = **`#F54624`**. Revert with
`ACCENT_ANCHOR = ACCENT_TRIALS.marigold`.

Chosen as marigold's hue rotated **-24deg** (33.9deg -> 9.9deg), holding S/L constant, so the comparison
isolates hue. -24deg is exactly `ACCENT_SHIFT_LIMIT_DEG`, so this is also reachable as a pure shift.

**True pigment vermilion `#E34234` was rejected for the first look: it stops blooming.** At
`MARIGOLD_REFERENCE_INTENSITY = 2.0` it lands at luminance `0.410`, under the `0.42` threshold
(`env-config.ts:83`, GRID_VOID). The rail and seams would go dull rather than redder, and the owner
would be judging the wrong variable.

| Candidate | hex | hue | lum x2 | vs 0.42 | intensity to match marigold |
|---|---|---|---|---|---|
| marigold | `#F59A24` | 33.9 | 0.853 | blooms | 2.00 |
| **vermilion (active)** | `#F54624` | 9.9 | 0.479 | blooms | 3.55 |
| vermilion pigment | `#E34234` | 4.8 | 0.410 | **BELOW** | 4.17 |
| vermilion bright | `#FF4F1F` | 12.9 | 0.539 | blooms | 3.17 |

**Bloom coverage will shrink on any vermilion.** Rec.709 weights green at `0.7152`, so red is simply
darker at equal S/L — luminance falls `0.427 -> 0.240` on the hue rotate alone. `MARIGOLD_REFERENCE_INTENSITY`
was **not** bumped to the matching `3.55`: it lives in `track-materials.ts` where the other agent is
working, and changing it would confound their lighting pass. That is the owner's call once lighting lands.

## Gates

`pnpm typecheck` passes. `biome check` clean on all seven touched files. Comment ratchet clean.
The 3 repo-wide biome errors are in the owner's uncommitted `test-level-canvas.tsx`, untouched.

## Next steps

1. **Look at it.** Two open visual questions, both needing eyes and neither answerable from here:
   the normal sign (groove vs ridge), and vermilion vs marigold. Blocked on the rail throwing light
   again (`RAIL_EMITTER_INTENSITY` is `0`).
2. **Decide the progression model** — per-level step, or continuous drift within a level. Determines
   whether the two material-prop consumers need the `useFrame` push.
3. **Align `app.css:19`** to the chosen accent so the HUD does not read as a different hue.
4. **Wear subordination test** (§M1): *"If a wear field is reading before the panel divisions do, it is
   too strong regardless of how well it matches a crop."* Untested.
5. **Unwritten §7 departures**, now four: joint contrast `0.16 -> 0.34`; base-colour hue; the
   boundary-vs-inlay intensity separation; and the accent hue itself if vermilion sticks — the sheet is
   marigold-primary throughout and a hue change is a package-level departure, so it goes to the owner
   for ChatGPT, never edited into `docs/art-direction/`.
6. Still open, untouched: ADR follow-up for the camera retune (`DECISIONS.md:476`), the
   `hit-spark.tsx`/`explosions.tsx` unparked-instance audit, splitting the origin-block fix into its
   own issue/PR.
