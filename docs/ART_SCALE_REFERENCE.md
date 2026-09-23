# SLUR — Art Scale Reference (authoritative)

> **Purpose:** the real, source-verified dimensions of every gameplay object, so concept art can be
> regenerated at true scale. **This sheet overrides every scale number printed on a concept board.**
>
> Every value below was read from source on 2026-09-17. Source of truth is the code, not this file —
> if they disagree, the code wins and this file is stale. Files: `packages/shared/src/constants.ts`,
> `packages/shared/src/sim/track.ts`, `packages/shared/src/ship-classes.ts`,
> `packages/shared/src/combat/constants.ts`.

## 0. The headline correction

**The track is 64 units wide. The widest ship is 2.6 units wide.**

A ship spans **~4% of the track width** — about **1/24th**. The `docs/art-direction/boards/` boards draw the ship at
roughly **1/8th to 1/10th** of the track, so the real track is **~2.5–3× wider, relative to the ship,**
than every board shows.

This is the single correction that matters most. Consequences for art direction:

- The real ribbon reads **vaster, emptier, and more lonely** than the boards. That may be *better* —
  "Cold Space. Warm Energy." — but it is not what was drawn.
- **Marigold edge-glow is a weak guide at true scale.** The handoff makes track edges the primary
  navigational read, but at true scale each edge sits **32u** off-centre — over 12 ship-widths away.
  A pilot threading the middle of the track cannot use them for fine positioning. Some interior
  functional read (lane seams, the racing line, hazard-local cues) likely has to carry that load.
  **Flagging this as an open art problem, not solving it here.**

## 1. Track

| Thing | Value | Constant | Note |
|---|---:|---|---|
| Track width | **64u** | `HALF_WIDTH = 32` | full width = 2 × 32 |
| Authoring lanes across | **16** | `2·HALF_WIDTH / CELL` | authoring scaffolding **only** — not a runtime unit |
| Segment length (z) | **20u** | `SEG_LEN` | one segment; **a gap is exactly one segment long** |
| Total track length | **8000u** | `TRACK_SEGMENTS(400) × SEG_LEN(20)` | ≈2.4 min at cruise, ~2.8 min real average |
| Track thickness (visual) | *free* | — | **not a sim constant.** The sim floor is a plane; thickness is pure art. Board 07's "1u" is a legal choice, not a requirement. |
| Authoring snap grid | **4u** | `CELL` | design-time only. The sim is continuous float-AABB; **never quantize art to this at runtime** |
| Edge rail width (x) | **2u** | `RAIL_W` | sits **outboard**: inner face at ±32, outer face at ±34 |
| Edge rail height (y) | **0u metal · 0.125u strip** | `RAIL_LIP_H` | the metal top face is **coplanar with the deck top**. Only the emissive strip stands proud, as a 0.25u × 0.125u lip. Its inboard face turns the strip toward the camera: a flat strip was sub-pixel from the chase camera and barely bloomed (#229). The box drops `SLAB_THICKNESS` below |
| Rail slab depth (y) | **24u** | `SLAB_THICKNESS` | shared with the deck slab, so rail and deck present one underside |
| Emissive share of the rail | **12.5%** | `RAIL_EMISSIVE_SHARE` | of `RAIL_W`, centred on the top face → **0.25u** marigold at 2u |
| Rail metal margin (x) | **0.875u** | `RAIL_MARGIN` | `RAIL_W × (1 − RAIL_EMISSIVE_SHARE) / 2`, one each side of the strip |
| Interior seam insert width (x) | **0.12u** | `SEAM_WIDTH` | `seam-inserts.ts`; the M7 inserts in the deck face, inboard of both rails |
| Interior seam lane spacing (x) | **8u** | `SEAM_SPACING` | first lane at `SEAM_INSET` = 4u, mirrored → 8 lanes across 64u |
| Interior seam length (z) | **3 – 11u** | `SEAM_LEN_MIN/MAX` | varied per insert; never crosses its own segment boundary |
| Interior seam lift (y) | **0.02u** | `SEAM_LIFT` | plus `polygonOffset`, so the insert never z-fights the deck it sits on |

### 1a. No visual element may take playable width — ADR-012

> **The deck's rendered top face ends at exactly ±`HALF_WIDTH`, always.** Rails, trim, edge strips and
> any future border art live **outboard** of that, in `[32, 32+w]`, mirrored. Nothing that is drawn may
> move where the deck is drawn to end.

The rail is positioned by **span**, not by pivot: inner face `x = 32`, outer face `x = 32 + RAIL_W`.
Stated for a centred pivot that is `±(32 + RAIL_W/2)` = **±33**, *not* ±32 (which straddles the edge
and eats `RAIL_W/2` of deck) and *not* ±34 (which leaves a `RAIL_W/2` gap).

**The rail is its own mesh, not part of the deck.** `apps/client/app/game/scene/track-rail.tsx` builds
it from the same `RailRun` list that feeds the rail emitters, so geometry and lighting can never drift
apart. `track-floor.tsx` draws the deck slab and stops at ±`HALF_WIDTH`; it no longer extends itself
outboard to lend the rail an outer wall. The rail box draws top, outer wall, underside and end caps —
**no inner face**, because the deck slab's own side wall at ±32 already seals that plane, and drawing
both would be coincident geometry.

The top face is split into two material groups: group 0 is the metal (`railBodySurface()`, the same
`plateSurface()` treatment the deck and monoliths get, driven by its own `rail.*` tunables), group 1 is
the `RAIL_EMISSIVE_SHARE` strip in `BOUNDARY_SURFACE` marigold.

**Interior seam inserts are a separate mesh again.** `ART_MATERIALS.md` §2 lists them as *"M7, sparse ·
short · varied length · irregular spacing"*, gameplay tier. `seam-inserts.ts` places them from a fixed
salt through `hash2`, so the pattern is deterministic and testable; `track-seams.tsx` draws them in one
mesh under `SEAM_SURFACE`. They are **not** lit by the rail emitters and they do not feed them — they
are their own emissive, dialled by `seam.emissive`. They sit strictly inboard of ±`HALF_WIDTH`, so
ADR-012 holds for them as it does for the rail, and they are skipped over a gap segment.

**Why this is a hard rule and not a preference.** The sim's floor spans ±`HALF_WIDTH` unconditionally
(`packages/shared/src/sim/track.ts:133`) and knows nothing about any client-side trim constant. A trim
that insets the drawn deck therefore does **not** narrow the track — it makes the picture disagree with
the physics, and the player flies on solid floor that renders as border. An edge marker drawn somewhere
other than the edge has failed at its only job. Verify by asserting the deck's outer top-face vertex
sits at ±`HALF_WIDTH` **for every value of the rail width** — a test that only checks the rail's own
position passes while the deck moves underneath it.

## 2. Obstacle blocks — **only the height is fixed**

This is the most commonly misread part of the spec, including by this document's first draft. GDD §0 is
explicit: block width/depth are *"a generation artifact, **not** a rule — any size is legal."*

| Axis | Status | Value | Note |
|---|---|---:|---|
| **Height (y)** | **FIXED — load-bearing** | **8u** (`BLOCK_HEIGHT`) | **above double-jump reach on purpose → un-jumpable.** Strafe around or destroy; never hop |
| Width (x) | **FREE** | *4u as generated today* | `CELL`-quantized by the current generator only. Any real-valued width is legal |
| Depth (z) | **FREE** | *8u as generated today* | `BLOCK_DEPTH`; a short discrete pillar inside the 20u segment, **not** a full-depth wall |

GDD §0's own examples of legal blocks: **`5.5 × 5.5 × 8u`**, **`3.5 × 5 × 8u`**. Note that the first two
numbers vary freely and **the third is always 8**.

**What this means for art:**

- **Never vary the height.** Every block, always, is 8u tall. A block drawn short enough to look hoppable
  is lying about the mechanic and will get players killed unfairly.
- **Do vary width and depth freely.** A block is not a cube and not a fixed silhouette — the family should
  read as *"a wall of 8u-tall mass, cut to arbitrary widths."*
- The `4 × 8 × 8u` pillar is simply **what today's generator happens to emit**. Do not enshrine it.

Board 07's "~2u wide / ~3u tall" is wrong on both counts — too small, and it varies the one axis that
must not vary.

## 3. Clearance contract (the one hard spatial invariant — GDD §0)

| Thing | Value | Note |
|---|---:|---|
| `MAX_SHIP_WIDTH` | **4u** | the *contract* ceiling (= `CELL`), **not** the current roster max |
| `CLEARANCE_MARGIN` | **3u** | the only tunable |
| **`MIN_CLEAR`** | **7u** | at every z-slice the widest lethal-free floor run must be ≥ this |

Art must never depict a threadable route narrower than **7u** — that is 1.75 lanes, and at true scale
it's a *slot*, visibly tight against a 64u ribbon. Conversely a corridor is never guaranteed wider
than 7u, so compositions that assume a generous open lane are not always truthful.

## 4. Ships (footprint = collision hitbox = visible box — WYSIWYG, locked)

| Class | Model | Width (u) | Length (u) | Top speed (u/s) | Identity |
|---|---|---:|---:|---:|---|
| Interceptor | executioner | 2.00 | 1.84 | 48 | flat sleek scalpel — best weaver |
| **Fighter** (baseline) | challenger | **2.60** | 2.52 | 55 | square all-rounder |
| Comet | bob | 2.20 | 1.18 | 70 | tiny glass rocket — fastest |
| Phantom | dispatcher | 2.40 | 5.02 | 50 | long courier — gap master |
| Freighter | split-crown | 2.50 | 6.00 | 62 | long cruiser — gap tank |

**All five widths cluster between 2.0u and 2.6u** — a 30% spread. Ships differ far more in *length*
(1.18u → 6.00u, a 5× spread) than in width. Board 03's "SHIP ~2.6u" is **correct** (it's the Fighter).

Note the consequence: the Freighter is **6u long and 2.5u wide** — a 2.4:1 needle. Ships are much
longer than they are wide, and art should reflect that.

## 5. Environment scale (from the boards, sanity-checked)

These come from the concept boards, which used a *correct* ship reference (2.6u), so they are
internally consistent — unlike board 07's track figure.

| Thing | Board value | × track width (64u) | Verdict |
|---|---:|---:|---|
| Obelisk | 200–400u | 3–6× | plausible for monumental framing |
| Gate | 200–350u | 3–5× | plausible |
| Arch | 150–300u | 2–5× | plausible |
| Asteroid S | 10–50u | 0.2–0.8× | fine |
| Asteroid M | 50–200u | 0.8–3× | fine |
| Asteroid L | 200–400u | 3–6× | fine |
| Asteroid XL | 400u+ | 6×+ | fine, background only |

**Board 03 and 04 are trustworthy on scale. Board 07 and 09 are not.**

## 6. Board corrections — use this when regenerating shots

| Board | Printed | Actual | Error |
|---|---|---|---|
| `07` panel 8 | track width "~6u–8u" | **64u** | **8–10× too small** |
| `07` panel 8 | obstacle height "~3u" | **8u** | ~2.7× too small |
| `07` panel 8 | obstacle width "~2u" | **4u** | 2× too small |
| `07` panel 8 | track thickness "1u" | *free choice* | not a constraint — fine as-is |
| `09` panel 1 | "1-lane partial gap, 1u × 2u" | **4u wide × 20u long** | 4× / 10× too small |
| `09` panel 4 | "2-lane 2u×2u / 4-lane 4u×2u" | **8u×20u / 16u×20u** | same error |
| `10` panel 3 | "CUBE (1x1) / WIDE (2x1) / TALL (1x2)" | cell notation | **do not ship this as a runtime rule** — sim is continuous |
| `10` panel 4 | "LEFT / CENTER / RIGHT LANE" | 16 lanes exist | three-lane framing is misleading |

**Gaps are 20u long.** Every board draws them far too short. A gap is a full segment — at 55 u/s you
are airborne over it for roughly a third of a second, and it should look like a genuine chasm, not a
seam.

## 7. Combat (for VFX scale)

| Thing | Value | Constant |
|---|---:|---|
| Bolt speed | **900 u/s** | `BOLT_SPEED` |
| Bolt lifetime | **1.7s** | `BOLT_TTL` |
| Bolt range | **≈1530u** | `BOLT_SPEED × BOLT_TTL` |
| Bolt half-extent | **1.5u** | `BOLT_HALF` |
| Stun on hit | **1.2s** | `STUN_SECONDS` |

The bolt travels at **~16× the Fighter's cruise speed** and crosses **~24 track-widths** before
expiring. It is emphatically a streak, not a projectile you watch fly — board 05's "elongated energy
tracer" read is correct and should be pushed further.

## 8. Player colour

`COLOR_COUNT = 12` — **already 12 in source.** ADD §11's "raise `COLOR_COUNT` 8→12" task is stale and
is now marked done. Note this is *palette capacity*, not a committed visual direction: per the
2026-09-17 call, the world is uniformly marigold and hue-shifting is reserved for distinguishing
opponent ships if and when that proves necessary.

## 9. A quick shot-framing cheat sheet

For regenerating concept art at true scale, per **one 64u-wide track**:

- Fighter ship = **2.6u** → **1/24th of track width**
- Block height = **8u, always** → ~3× the ship's width; **never varies**
- Block width/depth = **free** (4u × 8u today) → vary these for silhouette interest, never the height
- One authoring lane = **4u** → **1/16th of track width**
- Minimum threadable corridor = **7u** → **~1/9th of track width**
- One gap = **20u long** → **~1/3rd of track width, measured down-track**
- One segment = **20u** → the track is **400 of these** end to end
- Obelisk = **200–400u** → **3–6 track-widths tall**

> Rule of thumb for a chase-cam shot: if the ship looks like it occupies more than about **4%** of the
> ribbon's width, the track is drawn too narrow.
