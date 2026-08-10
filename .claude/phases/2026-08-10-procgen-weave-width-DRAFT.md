# 2026-08-10 — Procgen: coherent weave + block-width variety (RESEARCH + DESIGN BRIEF, DRAFT for human review)

**Status:** draft plan. No production code written; `track.ts` untouched. Headless sketch validated the core
claims (`scratchpad/weave-proto.mjs`, throwaway — reuses real `hash2` semantics).

Two designer goals: **(1) more/harder/coherent lateral weave** ("a line to thread", not scatter);
**(2) block-width variety** (1/2/3-cell-wide blocks) without breaking fairness.

---

## 1. Ground-truth findings

### Block footprint (code + renderer) — the perception is wrong; the cube is square
- **Sim (`track.ts` L109-123):** every cube is emitted as `x0=-HALF_WIDTH+lane*CELL`, `x1=x0+CELL` →
  **exactly 4u wide (1 cell), always.** z-extent is `z0=z0+r*CELL`, `z1=z0+CELL` → **exactly 4u deep (1 cell).**
  Height `y0=0, y1=BLOCK_HEIGHT=8` → **8u tall (2 cells).** So a block's **footprint is a 4u×4u square**, 8u tall.
  There is **no primitive for a multi-lane block** — that is the entire root cause of goal #2's monotony.
- **Renderer (`track-view.tsx` `emitBlocks` L61-77):** the box is sized straight from the cube's own
  `x1-x0 / y1-y0 / z1-z0` — **WYSIWYG, no z-stretch, no scaling.** The render box IS the collision AABB.
- **Why the designer perceives "4u wide but longer depth":** two real effects, neither is a wide block —
  1. **Dominant cause: the 8u tall box viewed at the shallow chase camera foreshortens** — a 2-cell-tall
     pillar reads as "deep" down the ribbon.
  2. **Secondary: same-lane z-runs.** `ROW_FILL=0.7`, lane picked uniformly per row → P(two adjacent rows
     both filled AND same lane) = 0.7²·(1/16) ≈ 0.031/pair, ~0.12 runs≥2 per block-segment → roughly 1 in 8
     block-segments shows a 8–12u-deep stack at one x, reading as a single elongated block.
  **Ground truth: the footprint is a square 4×4 cell; "depth" is a camera/height artifact, not geometry.**

### Why the weave reads as scatter (root cause in the IID model)
- **Archetype is IID per segment** (`rawArchetypeAt` = first roll of `mulberry32(hash2(seed,i))`), same
  P at seg 5 and seg 195 → no arc, no pacing (already noted in the prior doc).
- **Within a block segment, each row's lane is `Math.floor(rng()*LANES)` — independent uniform.** There is
  **zero lane autocorrelation** between a cube and its neighbours (across rows *or* across segments). Coherence
  ("a line") is exactly spatial autocorrelation of obstacle position; IID has none by definition — it *cannot*
  produce a threadable line even when passable.
- **Obstacles arrive in disconnected bursts:** only 45% of segments are `block`; the other 55% (plain/gap)
  break any would-be stream into islands. So even a lucky run of same-lane cubes can't persist.
- **The fairness proof leans on IID:** "≤1 cube/row ⇒ every z-slice keeps ≥ LANES−1 open." Any attempt to
  add width *inside this model* forces re-proving fairness per width — a dead end. Goal #2 needs a different
  fairness backbone (see §4).

---

## 2. Algorithm survey (filtered by the hard constraints)

Legend: **O(1)** = per constraint 2 (random-access, local re-derivation only), **trig-free** = constraint 1.

| Approach | O(1)? | Trig-free? | Coherence | Difficulty dial | Verdict |
|---|---|---|---|---|---|
| **IID scatter (current)** | ✓ | ✓ | none | prob. only | **Reject** — prior art, is the problem |
| **Value-noise carved racing-line + noise walls** (prior doc) | ✓ (per-node hash) | ✓ (smoothstep) | high | corridor width / density / meander | **ADOPT as spine** |
| **Gradient (Perlin) noise line** | ✓ | ✓ (hashed integer gradients, dot-products — no trig) | higher (smoother) | same | Optional quality upgrade, not needed |
| **Octave-summed value noise (fBm-lite)** | ✓ | ✓ | high + richer | amplitude/octave count | **ADOPT** as line enrichment |
| **Integer lane-permutation / de-Bruijn tiles** | ✓ (tile = hash(seed,seg)) | ✓ | high but *canned*, repeats | tile-set swap | Secondary (signature/hand-authored stretches) |
| **Markov obstacle-pattern tiles** | ✗ pure Markov needs prev state = O(i); ✓ only if "state"=hash(seed,i) (then not really Markov) + bounded local lookback | ✓ | macro-pacing | transition table | Secondary — macro layer, like today's gap→pad lookback |
| **Low-discrepancy (Halton/Sobol/golden)** | ✓ | needs care | **anti-clusters** (opposite of a line) | — | **Reject for the line** (good for scatter/pickups, wrong tool here) |
| **"Flow field" via hashed noise** | ✓ | ✓ | — | — | Subsumed: the racing line *is* a 1-D flow field |
| **WFC over the track** | ✗ global solve | — | — | — | **Reject** (constraint 2) |
| **Cellular-automata smoothing pass** | ✗ global iteration | — | — | — | **Reject** (constraint 2) |
| **Any global constraint solve / forward-backward scan** | ✗ | — | — | — | **Reject** (constraint 2) |

**Conclusion:** the prior doc's family (value-noise carved corridor + noise walls) is the only candidate that
is simultaneously O(1)-random-access, trig-free, coherent, and difficulty-rampable. The survey doesn't
overturn it — it **confirms** it and tells us where to push (octaves, per-row movement, tighter curves) and
what to keep as secondary layers (pattern tiles for signature courses).

---

## 3. Recommended design — Goal #1 (more/harder coherent weave)

**Verdict: keep the prior doc's spine, push it three ways.** Same skeleton, improved.

### 3a. The racing line `L(row)` — value noise, O(1), slope-bounded *by construction*
Work in **global row index** `row = seg*ZCELLS + r` (5 rows/segment) so the weave moves **per row (denser)**,
not per segment.

- **Value noise, not a random walk.** A bounded random walk (`node = prev + clampedΔ`) is **sequential →
  O(i) → forbidden**. Value noise dodges this: node values are **independent hashes**, interpolated. Pick
  node spacing `Fz` so the interpolated slope is bounded *without* any chain:
  - node `n = floor(row/Fz)`, value `vₙ = u01(seed^K, n) ∈ [0,1)` (independent per node → O(1) random-access),
  - `center = margin + smoothstep((row−n·Fz)/Fz)·(v₀+(v₁−v₀)·…)·R` where `R = LANES − w` (amplitude range),
  - `smoothstep(t)=t·t·(3−2·t)` — polynomial, trig-free, IEEE-deterministic (same float trust the sim
    already relies on for `+−*/`).
- **Richness (fBm-lite):** sum 2 octaves `(Fz, amp R)` + `(Fz/2, amp R/2)` — still O(1), still slope-bounded
  (sum of bounded slopes). This gives the "busy line" feel without high-frequency un-threadable chatter.

### 3b. Meander-rate cap — DERIVED from the least-capable weaver (not hand-picked)
To hold lateral position offset by 1 lane (`CELL`) while advancing 1 row (`CELL`) at forward speed `vz`
needs lateral speed `= strafeClamp` iff `strafeClamp/vz ≥ 1 lane/row`. So the **max sustainable slope**:

```
s_max [lanes/row] = min over classes of (strafeClamp / maxCruise) · SAFETY
```

Per-class ratio `strafeClamp/maxCruise`: Interceptor 95/48=1.98 · Fighter 80/55=1.45 · Comet 85/70=1.21 ·
Phantom 75/50=1.50 · **Freighter 65/62=1.048 ← least-capable weaver.** With a `JUMP_SAFETY`-style 0.8 factor →
**`s_max ≈ 0.84 lanes/row`.** Peak smoothstep slope is `1.5·R/Fz`, so **`Fz ≥ 1.5·R / s_max`** guarantees the
line never demands more lateral speed than the Freighter has. (Sketch measured max `|ΔL|`=0.762 < 0.8 ✓.)

- **CRITICAL REFINEMENT the prior doc missed — cap *curvature*, not just slope.** `s_max` bounds top strafe
  *speed* but a high-frequency zigzag also demands fast **reversal** (governed by `strafeAccel`). Freighter
  `strafeAccel=105` → reversing −65→+65 takes ~1.24s ≈ 19 rows: a tight oscillation within the slope cap is
  **still un-threadable**. Value noise with `Fz ≥ 1.9·R` keeps curvature tiny (`~R/Fz²`), well inside
  `strafeAccel`; the fairness test must assert a **slope-change-per-row cap** too (§6), derived from
  `strafeAccel·SAFETY`. This is the real lever for "harder without unfair": raise density and tighten the
  corridor, keep `Fz` respectful of reversal.

### 3c. Corridor + wall-density model
- **Corridor:** clear a band `[center − w/2, center + w/2]` around `L`. `w` is the **difficulty dial**,
  ramped **8 lanes → MIN_LANE(2)** as `D→1` (clamp `w ≥ MIN_LANE` always). Clamp `center ∈ [w/2, LANES−w/2]`
  so the corridor never pushes off-edge.
- **Walls (outside the band):** `wall if valueNoise2D(lane,row) < density(D)` — low-freq 2-octave noise in
  `(lane,row)` → coherent flowing walls/channels, not scatter. `density` ramps ~0.35 → 0.70 with `D`.

### 3d. Same, improved, or replaced vs the prior draft?
**Improved, not replaced.** Kept: carved corridor (the load-bearing fairness trick), noise walls, D-ramp,
triangle-wave pacing. Added: **(i) per-row line movement** (5× denser weave), **(ii) fBm octaves** (richer
line), **(iii) derived slope AND curvature caps** (harder-but-fair, fixes the prior doc's slope-only gap),
**(iv) tighter corridor-width floor curve** (the prior proto was "too easy / min-open 5" — start the ramp
tighter). The corridor model is also what makes goal #2 *free* (next).

---

## 4. Recommended design — Goal #2 (block-width variety), fair BY CONSTRUCTION

**Key insight that unlocks it:** once a corridor is carved, **width variety costs nothing.** The corridor
guarantees `≥ w ≥ MIN_LANE` contiguous open lanes at **every z-slice**, *regardless of how the wall zone is
shaped*. So walls outside the band may be **any width, any merge, any run-length** and fairness still holds.
Width variety in the IID model needs a fresh fairness proof per width; in the corridor model it is automatic.
**This is a decisive argument for adopting the corridor spine over patching the scatter.**

### Placement rule (recommended: RLE-merged noise walls)
Per row, after computing the corridor band:
1. mark `isWall[lane] = (lane outside band) AND valueNoise2D(lane,row) < density`,
2. **run-length-encode contiguous wall lanes into ONE `Block`** spanning `[laneStart·CELL … laneEnd·CELL]`.

Coherent noise → contiguous runs of 1,2,3,4+ lanes emerge naturally. The sketch's width histogram (RLE over
8 seeds): widths **1:2131, 2:2622, 3:2284, 4:1494 …** up to 14 — the designer's 1/2/3-cell blocks dominate,
with occasional wide "flow walls." **Optional dial:** clamp max run-width (e.g. ≤3 lanes) if very wide walls
look like dead ends; purely cosmetic, fairness is already guaranteed by the corridor.

This makes goals #1 and #2 the **same mechanism**: the walls *are* the coherent noise; RLE just renders them
as fat blocks instead of cube columns.

### Weighing the alternatives for width
| Option | Coherent? | Width control | Fairness | Verdict |
|---|---|---|---|---|
| **RLE-merge contiguous noise-wall lanes** | ✓ (noise) | emergent (bias via noise freq) | free (corridor) | **Recommend** (unifies #1+#2) |
| **Explicit wall-run primitive** (hash start-lane + run W∈1..N, clamp to wall zone) | medium | **direct** (dial the W distribution) | free (clamp to wall zone) | Good alt if designer wants a precise width mix |
| **Merge adjacent same-lane cubes** (patch IID) | no | accidental | must re-prove | Reject (keeps the scatter root cause) |
| **New "wall" archetype** in the IID mix | no | canned | separate proof | Reject |

**Recommendation:** ship **RLE-of-noise** as primary; keep the **explicit wall-run** as a tuning escape hatch
if the emergent width distribution doesn't match taste. Both are O(1) and fair by the same corridor argument.

### Fairness proof (by construction)
At any row: corridor band `[center−w/2, center+w/2]` is *never* walled and has width `w ≥ MIN_LANE`; walls
exist only outside it. Therefore the max contiguous open run `≥ w ≥ MIN_LANE`. Independent of wall widths. ∎
(`center` clamped into `[w/2, LANES−w/2]` so the band is always fully on-track.) Sketch: **0 failures** across
8 seeds × 194 segs × 5 rows with walls up to 14 lanes wide.

---

## 5. Difficulty progression + pacing (keep — strengthens #1/#2, trig-free)
- **`D(i)` ramp:** Race → smoothstep ease-out to a cap at some segment; Survival → slow unbounded growth,
  **clamped so `w` never drops below MIN_LANE** and gap frequency never violates GAP-REACH. `D` drives
  corridor width (§3c), meander amplitude/`Fz` (§3b), and wall density.
- **Pacing wave:** deterministic triangle wave added to `D`: `tri(t)=2·|2·(t−⌊t+½⌋)|−1` (trig-free, prior
  doc) — tension(peak)→release(trough), ~20-row wavelength.
- **Gaps:** unchanged concept — sparse, frequency rises slightly with `D`, never in start-safe, **never two in
  a row** (existing O(1) local lookback → forced landing pad), each gated by GAP-REACH (≤ one segment). Gaps
  stay orthogonal to the weave.

---

## 6. Fairness / determinism test plan (must stay green + new asserts)
Existing assertions to keep green: mulberry32 reference stream, per-segment stability, byte-identical two
builds, start-safe flat, per-class one-segment gap clears, hole→pad, cubes grounded/tall/in-segment,
finish flat. New/changed:

1. **Per-SLICE MIN_LANE (changed helper).** `passableCorridorWidth(seg)` currently collapses ALL blocks in a
   segment onto one x-axis — with a corridor that **moves within the 5 rows**, that collapse can false-fail
   even though each z-slice is fair. **Refine the helper to evaluate min contiguous-open over each z-row
   (per-slice)** and assert `≥ MIN_LANE`. This is stricter/more-correct and the OLD generator still passes it
   (its cubes are already per-row). *Flag for humans: this changes the helper's semantics — call it out.*
2. **Meander slope cap:** over seeds × D, `max |L(row)−L(row−1)| ≤ s_max` (derived, §3b).
3. **Meander curvature cap:** `max |slope(row)−slope(row−1)| ≤ s'_max` (derived from `strafeAccel·SAFETY`) —
   the reversal-threadability guard.
4. **Corridor floor:** `w ≥ MIN_LANE` at every row for every D (incl. Survival D→large).
5. **Gaps:** every gap ≤ GAP-REACH of the least-capable class; **no multi-segment gaps**; none in start-safe.
6. **Determinism under the ramp:** byte-identical two builds across seeds **× many D values** (not just the
   uniform default), since D now varies geometry.

---

## 7. Open questions / risks + rough port outline

### Open questions for the humans
- **Q1 — per-slice test helper change (item 6.1):** OK to alter `passableCorridorWidth` semantics to per-row?
  (Necessary for a within-segment moving corridor; stricter, not weaker.) Or keep the corridor **constant per
  segment** (1 step / 5 rows) to avoid touching the helper — at the cost of a coarser, less-dense weave?
  Recommend: change the helper, keep per-row density.
- **Q2 — `mode` (race|survival) plumbing for `D(z)`:** needs a room-state field or a `makeTrack` param. Race
  now uses only the ease-out trend; full survival growth lands with S7. Where should `mode` live?
- **Q3 — max wall-run width:** cap emergent runs (e.g. ≤3 lanes) for readability, or allow wide "flow walls"?
  Purely cosmetic (fairness holds either way).
- **Q4 — starting difficulty:** prior proto was "too easy (min-open 5)". What's the seg-0 corridor width and
  the D cap? A feel-gate number, tune live.

### Risks / could-not-verify
- **Float determinism of `smoothstep`:** relies on IEEE-754 `*`/`−` being identical across V8 (Node) and the
  browser V8 — the **same assumption the existing sim + mulberry32 already make** (`/4294967296`, physics).
  No new transcendental introduced. Low risk, but **verify with the byte-identical property test across
  Node+browser** before trusting it in production (I verified the *algebra* is trig-free; I did NOT run it in
  a browser engine this session).
- **Curvature cap is a proxy** for true threadability. A full "simulate the least-capable ship's lateral
  controller and assert it stays in-corridor" test would be authoritative but heavy — recommend the
  slope+curvature proxies first, escalate to a sim-based test only if the feel-gate finds an un-threadable
  seed.
- **Instance-pool budgets:** RLE reduces block count vs per-cube (fewer, wider boxes) but denser walls raise
  it; re-check `BLOCK_LIMIT=128` against the new density at the visible window (~49 segs) before shipping.

### Rough port outline (files, order — NO code here)
1. **`packages/shared/src/sim/noise.ts` (NEW):** `valueNoise1D`, `valueNoise2D`, `smoothstep`, `tri` —
   trig-free, hash2-seeded; unit-tested for determinism first.
2. **`packages/shared/src/constants.ts`:** derive + comment `s_max` (slope cap), `s'_max` (curvature cap),
   corridor-width curve `w(D)`, density curve, `Fz`/octave params, `D(i)` per-mode trend, pacing amp/λ —
   every field commented ([[intuitive-tuning-surfaces]]); caps computed from `ALL_CLASS_TUNINGS`
   (least-capable), never hand-picked.
3. **`packages/shared/src/sim/track.ts`:** replace `buildSegment`'s IID archetype+scatter with
   corridor-carve + RLE noise-walls + gaps driven by `D(i, mode)`. **Keep `Segment`/`Block`/`FloorSpan`
   shapes unchanged** → renderer (`track-view.tsx`) and collision need **zero** changes (blocks just get
   wider `x0..x1`; `emitBlocks` already sizes from `x1-x0`). Keep the O(1) gap→pad local lookback.
4. **`packages/shared/src/sim/track.test.ts`:** refine `passableCorridorWidth` to per-slice; add slope,
   curvature, corridor-floor, no-multi-gap, and ramped byte-identical asserts (§6); property-test over
   seeds × D.
5. **Mode plumbing (defer w/ S7):** thread `mode` into `makeTrack`/room state; Race uses ease-out only now.

**No renderer change needed** — the single biggest de-risk: wider blocks fall out of the existing WYSIWYG
`emitBlocks` for free. The whole change is contained to `shared` sim + constants + tests.
