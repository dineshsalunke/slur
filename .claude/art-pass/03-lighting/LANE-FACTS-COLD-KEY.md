# Lane facts — the deck's cold key (task 3, lighting)

Written by the supervisor at the lane's ~213k seam, from the lane's fact dump plus first-hand
verification of the branch. **Every visual claim is `[unmeasured]` except the owner's own gate.**

## Where the work is

`art/cold-key` @ `27b3aa3`, pushed. **PR #158**, base `art/emitter-array`.

**Both branches were rebased by the supervisor after #157 merged** (see the handover). #155 now sits on
`dev` @ `146f53f`; #158 replays on top of it. The rebase is DONE — do not redo it.

Gate green on `27b3aa3` post-rebase: typecheck · lint (comment ratchet clean) · **78** shared + 74 client
+ 4 server tests · build. 2-dot `git diff art/emitter-array HEAD` = 6 files, +88/-10, byte-identical to
the pre-rebase diff.

## Shipped values

| file | constant | value | was |
|---|---|---|---|
| `cold-key.tsx` (new) | `KEY_BEARING_DEG` | `0` | — |
| | `KEY_ELEVATION_DEG` | `45` | — |
| | `KEY_COLOR` | `#c2ccd6` | — |
| | `KEY_INTENSITY` | **`1`** | proposed 8 |
| `lighting.tsx` | `AMBIENT_INTENSITY` | `0` | `1` |
| `emitter-array.ts` | `EMITTER_SLOTS` | `24` | `12` |
| `track-materials.ts` | `RAIL_EMITTER_RANGE` | `600` | `400` |
| — | `FLOOR_METALNESS` | `0.75` unchanged | |
| — | `FLOOR_ROUGHNESS` | `0.4` unchanged | |

Panel: `range` slider max 400 -> 800 so 600 is reachable; new `cold key` section (intensity / elevation /
bearing); `debugTuningSource` emits the three key constants. The ambient light and slider stay present at
0, so restoring it for an A/B is one drag.

**Mounting — solved differently from the brief, and better.** The brief asked for an explicit sibling
target inside `SkyFollow`. The lane made the light **static** instead: it does not ride `SkyFollow`, so
its position and three's default world-origin target are both fixed and the direction cannot swing over
the race's 8000u. Same guarantee, less machinery.

## Owner's gate — the only measured-by-eye facts here

Flown on `:5200`. **Bearing 0 confirmed. Intensity 8 read as too much; he landed on 1**, committed
verbatim. What he flew had `AMBIENT_INTENSITY` already at 0, so the fill's deletion is eye-gated at the
shipped key intensity, not only at the measured one.

## The harness

three@0.185.1's `meshphysical` path re-implemented in node — including a verbatim transcription of the
emitter array's own `FRAG_LIGHTS` — over all 24,474 in-frame deck fragments, seed 1234, real `CHASE` rig,
ship z=200. **Validated: it reproduces `LANE-FACTS`' published `ambient` 7.13e-4 and `starDiff` 3.25e-4
exactly.** `computeMultiscattering` omitted (needs `dfgLUT`; small at roughness 0.4, identical across
every compared config, so ratios hold). **The harness was a temp file and is deleted** — a third rebuild
is needed if these numbers are ever reopened.

## Measurements

**Baseline, no key:** centre 2.96e-3 · mid 2.08e-1 · rail 1.42e+1 · **edge/centre 4.79e+3x**. The
marigold strip's own emissive is 8.53e-1.

**At intensity 8 (measured):** centre 3.58e-1 = 0.420x marigold · edge/centre 4.25e+1x · centre lift 115x.

**At intensity 1 (shipped, derived by linearity** — `irradiance = dotNL * light.color`,
`light.color = color * intensity`**):** centre ~4.7e-2 = ~0.055x marigold · edge/centre **~3.0e+2x**. So
the shipped key is **~16x better than unlit, not 113x.** `[unmeasured]` by eye beyond "8 is too much".

**Bearing sweep** (elev 60, int 1): 0 -> key@centre 9.20e-3, own specular R/L 1.00 · 66 -> 1.57e-3,
R/L 2.79 · 246 -> 9.03e-4, R/L 0.70.

**Elevation sweep** (bearing 0, centre held ~0.35x marigold), intensity needed: 75deg -> 90 · 65 -> 45 ·
55 -> 24 · **45 -> 8** · 35 -> 1.6. Rest-vs-top-speed swing 1.00x at every elevation.

## Why bearing 0 — and what it costs

`backdrop.bearingDeg` is **0**: the nebula is centred straight down the track. So two sources do two jobs,
each motivated by something visible — **nebula ahead keys the deck, star at 66deg rims the rock field from
the right.** Bearing 246 balances the frame but has nothing behind it, the objection the brief itself
raised.

**The cost:** bearing 0 has no x-component, so every block face pointing at the player gets `N.L <= 0` —
**the key adds zero block and monolith modelling.** Bearing 246 is the option that buys that.

**Contact shading stayed out of scope and did not become conspicuous — because of the bearing.** On 0
nothing the player sees has a lit face for a shadow to fall from. **If the bearing ever moves to 246,
contact shading becomes a prerequisite, not optional.**

## The structural limit — half the gate is geometry, not tuning

A directional source on a flat plane has **constant `N.L`**, so the key's diffuse contribution *cannot
vary across the deck's width at all* — measured x = -16 / 0 / +16 -> 3.39e-1 / 3.43e-1 / 3.39e-1, flat to
2% across the middle 32u. Down the length it does vary (0.13 near -> 0.39 at 400u) and fills the far deck
the rails cannot reach.

The brief asked for *"a readable falloff across its width AND down its length"*. **The width half cannot
be met by any directional light.** That is what made intensity 8 read as a wash, and why the owner's 1 is
the right answer to the wrong knob — the fix, if one is wanted, is a different light SHAPE, not a number.

## Both re-tests

**`AMBIENT_INTENSITY` -> 0 — goes, but the PR body overstates why.** It was 24.1% of the centreline
unlit; 2.3% under the key at intensity 3. **At the shipped intensity 1 it would be nearer 7%**, so "the
key makes the ambient redundant" is weaker than #158's body states. Noted in a PR comment. The deletion
still stands on the owner's eye, which is the better authority.

**`FLOOR_METALNESS` stays 0.75 — the key does not rescue M1's 1.0.** Under the key at int 3: metalness
1.0 -> centre 2.36e-2, edge/centre 6.00e+2x · **0.75 -> 3.06e-2, 4.65e+2x**. 1.0 is **1.30x darker AND
more contrasty**. Mechanism, verified in three's source: `diffuseContribution = diffuseColor.rgb *
(1 - metalness)` is **exactly zero** at 1.0, and `specularColorBlended` makes F0 the deck's own albedo —
linear **9.13e-3**, BELOW the dielectric 0.04 it replaces. **M1's "bare conductor at 1.0" presumes a
conductor's reflectance as the base colour; `#14181e` is a paint value.**

**`FLOOR_ROUGHNESS` — reported, not changed.** Under the key: 0.15 -> 2.88e-3 · 0.35 -> 2.13e-2 ·
**0.4 (shipped) -> 2.76e-2** · **0.5 -> 3.76e-2** · 0.7 -> 3.61e-2 · 1.0 -> 1.40e-2. The key inverts the
pressure: 0.5 is 1.36x better than 0.4, because rougher spreads the lobe INTO frame instead of
concentrating it off-screen. Still inside M1's 0.35-0.50 band.

## Open, carried forward

1. **The thread worth pulling next:** raise the deck albedo off `#14181e` and THEN take metalness to 1.0.
   At `#3a4149` the centre is 1.7x better at the same key. `track-texture.ts`, out of scope for #158, and
   the real fix for the M1 departure rather than the workaround 0.75 is.
2. **Deck beside the rail is ~17x brighter than the rail — independent of the key.** At
   `RAIL_EMITTER_INTENSITY 40` / `decay 1`, deck 1u from the strip reads 1.42e+1 against the marigold
   strip's own 8.53e-1. **The array loses the "marigold is loudest" contest to its own spill.** Belongs
   to #155, unfixed.
3. **Rail-term discrepancy, unproven.** Lane's 6.81e+0 frame mean vs `LANE-FACTS`' 4.93e-4 at
   stated-same values, while both CONSTANT terms reproduce exactly. The lane's figure matches that doc's
   own prose and its 1.83e+2 peak, so 4.93e-4 is the likely anomaly. Affects nothing in #158.
4. **The apron is now IN this branch's base** (post-rebase). The key is world-static and uniform so it
   lands on the apron identically; the **z=0 rail seam** is still owed an eye.
