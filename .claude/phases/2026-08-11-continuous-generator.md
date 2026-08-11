# Continuous-x track generator (ADR-007 candidate) — PREP note

**Date:** 2026-08-11 · **Branch:** feat/adr-006-rhythm-paced-track (continues) · **Phase:** Prep → Align
**Depends on:** ADR-006 (rhythm-paced generator, committed `8ddc9d8`). This SUPERSEDES ADR-006's
lane-space generation internals; it does NOT change the load-bearing contract (ADR-000) or anchors (ADR-002).

## Goal

Decouple hazard-block geometry from the `CELL` grid. Blocks become **arbitrary continuous size** (`5.5×5.5×8u`,
`3.5×5×8u`, …). `CELL` remains an authoring convenience only. Two selectable block-placement strategies, and a
**roster-derived clearance floor** replacing the hand-typed `MIN_LANE = 8u`.

Codified in **GDD §0** (spatial model). The sim/collision/render/anchor layers already operate in continuous
`u` (`step.ts overlapsBlock`, `Block`/`FloorSpan` = floats) — **only the generator changes.**

## What's changing (and what isn't)

| Layer | Change? | Why |
|---|---|---|
| `step.ts` collision | **none** | already continuous float-AABB |
| `Block` / `FloorSpan` / `Track` types | **none** | already floats |
| client renderer (instanced blocks) | **verify only** | reads `x0..z1` generically; RLE already emits variable widths → expected no-op |
| pickup anchors / `openCenterX` | **none** | read built blocks in floats |
| `track.ts` generator internals | **REWRITE** | lane-space → continuous-x, pluggable placer |
| `constants.ts` | **new constants** | `MIN_CLEAR`, per-strategy ranges, selector |
| `track.test.ts` | **update + extend** | `MIN_LANE`→`MIN_CLEAR`; per-strategy fairness across seeds |

## Design decisions (locked with user, 2026-08-11)

1. **Both block models, switchable** via a single constant `BLOCK_PLACER: 'pillars' | 'noise'`. Flip it to
   change feel "when we want." Both sit behind one `BlockPlacer` interface.
2. **Clearance floor = FIXED contractual ceiling** (revised 2026-08-11 — supersedes the earlier roster-derived
   pick): `MIN_CLEAR = MAX_SHIP_WIDTH + CLEARANCE_MARGIN`, where `MAX_SHIP_WIDTH = CELL = 4u` (the "widest
   class ≤ 1 cell" contract, GDD §5.5) and `CLEARANCE_MARGIN = 3u` → **`MIN_CLEAR = 7u`**. Ceiling is the
   CONTRACT, not roster-max, so a seed's geometry is **stable across roster edits**. A module-load assertion
   `2·max(halfW over ALL_CLASS_TUNINGS) ≤ MAX_SHIP_WIDTH` enforces roster conformance (kills the stale-number
   failure mode without making geometry roster-dependent). `CLEARANCE_MARGIN` is the single tunable.
3. **Prep/Align first** (this note) → greenlight → implement → 71+ tests green → feel-gate in a hosted room.

## Architecture — everything in continuous `x ∈ [-HALF_WIDTH, HALF_WIDTH]`

### The corridor (fairness device — unchanged principle, now in `u`)
- `weaveLineU(seed, row)` — racing-line center in `u` (today `weaveLineLanes`). Trig-free (tri+smoothstep+noise).
- `corridorWidthU(intensity) = clamp(lerp(CORRIDOR_W_START_U, CORRIDOR_W_MIN_U, intensity), MIN_CLEAR, TRACK_W)`.
  **Clamped ≥ MIN_CLEAR** → the corridor alone satisfies the invariant at every slice.
- `corridorUnionU(seed, i, wU)` → `[loU, hiU]`: the min/max corridor edges swept across the segment's rows.
- **Off-corridor region** = two intervals `[-HALF_WIDTH, loU - BUFFER_U]` and `[hiU + BUFFER_U, HALF_WIDTH]`.
  Blocks live ONLY here → corridor stays clear → **fairness holds by construction, independent of strategy.**

### `BlockPlacer` strategy interface
```ts
interface PlacerCtx {
  seed: number; i: number; z0: number;
  offLeft: [number, number] | null;   // off-corridor interval in u (null if too small)
  offRight: [number, number] | null;
  intensity: number; density: number;  // density = wallDensity(intensity)
}
type BlockPlacer = (ctx: PlacerCtx) => Block[];  // lethal blocks in continuous u, height BLOCK_HEIGHT
```

**Strategy A — `pillars` (Poisson-ish, fully arbitrary size):** walk each off-interval, alternate
hashed gap (dodge-space) / hashed block:
```
x = interval.start
while x < interval.end:
  gap = lerp(GAP_MAX_U, GAP_MIN_U, density) jittered   // denser → smaller gaps
  w   = rand(BLOCK_W_MIN_U .. BLOCK_W_MAX_U)
  d   = rand(BLOCK_D_MIN_U .. BLOCK_D_MAX_U)            // centered in segment z
  if x+gap+w ≤ interval.end: push block [x+gap, x+gap+w] × BLOCK_HEIGHT × d
  x += gap + w
```
Deterministic via `mulberry32(hash2(seed ^ SALT_WALL, i*STRIDE + n))`. Truly arbitrary widths/depths; no grid.

**Strategy B — `noise` (continuous field threshold, ADR-006 slalom feel preserved):** sample coherent
`valueNoise2D` along continuous x at `SAMPLE_STEP_U` resolution; contiguous samples `< density` RLE-merge into
one block of naturally-varied width (edges snap to `SAMPLE_STEP_U`, e.g. 0.5u → effectively continuous, NOT
CELL-locked). Depth = `BLOCK_DEPTH` centered. Same "organic slalom" as today, but in `u`.

### Flick / drag / gaps (all → continuous `u`)
- **Flick:** a `FLICK_WIDTH_U` lethal pillar intruding from one corridor edge; fires only if it leaves
  `≥ MIN_CLEAR` on the other side (was `MIN_LANE`). Side alternates, no two in a row. Unchanged logic, u-based.
- **Drag (slow grace-note):** small `SLOW_WIDTH_U` amber block at a hashed x on the line, occasional. Passable
  → never counts against clearance (fairness ignores non-lethal blocks — already true in `wallsOnSlice`).
- **Gaps:** `gapFloors` → strip width `corridorWidthU` at the weave line (partial) or `[]` (full). Keep
  `FULL_GAP_FRAC`, `rolledGap` no-two-in-a-row.

## Constants (constants.ts) — add / change

```
MAX_SHIP_WIDTH   = CELL         // 4u — ship-size contract (widest class ≤ 1 cell, GDD §5.5)
CLEARANCE_MARGIN = 3            // u — the ONE clearance tunable
MIN_CLEAR        = MAX_SHIP_WIDTH + CLEARANCE_MARGIN   // = 7u; replaces MIN_LANE
// module-load assertion: 2*max(halfW over ALL_CLASS_TUNINGS) <= MAX_SHIP_WIDTH  (roster conformance guard)
BLOCK_PLACER     = 'noise'      // | 'pillars' — flip to switch feel (default 'noise' = closest to ADR-006)

// corridor (u; were lanes: 5→20u start, 4→16u min)
CORRIDOR_W_START_U = 20 ; CORRIDOR_W_MIN_U = 16 ; CORRIDOR_BUFFER_U = 4

// pillars strategy
BLOCK_W_MIN_U = 3 ; BLOCK_W_MAX_U = 7 ; BLOCK_D_MIN_U = 6 ; BLOCK_D_MAX_U = 10
GAP_MIN_U = 3 ; GAP_MAX_U = 10

// noise strategy
SAMPLE_STEP_U = 0.5   // (WALL_NOISE_FZ_* reinterpreted in u)

FLICK_WIDTH_U = 4 ; SLOW_WIDTH_U = 4    // (were 1 lane)
BLOCK_HEIGHT = 8 (unchanged) ; BLOCK_DEPTH → default for 'noise'; range for 'pillars'
```
Every field carries a `u`/unit comment ([[intuitive-tuning-surfaces]]). Remove `MIN_LANE` and its lane-based
siblings (`CORRIDOR_W_*` lanes, `CORRIDOR_BUFFER` lanes, `FLICK_WIDTH` lanes, `BLOCK_MAX_LANES`), updating refs.

## Determinism (ADR-000 invariant #4) — preserved
Only hashed PRNG + `valueNoise1D/2D` + `smoothstep` + `tri` + `clamp` + `+-*/`/compare/floor in the per-segment
path. `Math.max(...halfW)` runs ONCE at module load (like `jumpReach`/weave caps), never per-segment. No
transcendentals added → byte-identical both engines.

## Fairness (ADR-000 fairness floor) — preserved & strengthened
Corridor clamped `≥ MIN_CLEAR`; lethal blocks only OUTSIDE corridor+buffer → `passableCorridorWidth(seg) ≥
MIN_CLEAR` at every z-slice, for BOTH strategies. `track.test.ts` assertion flips `MIN_LANE`→`MIN_CLEAR` and
runs across N seeds × both `BLOCK_PLACER` values.

## Files & verify gate
- `packages/shared/src/constants.ts`, `.../sim/track.ts`, `.../sim/track.test.ts`
- `docs/DECISIONS.md` — ADR-007 entry ; `CLAUDE.md`/memory `rhythm-paced-generation` — note the internals swap
- **Gate:** `pnpm typecheck && pnpm lint && pnpm -F @slur/shared test && pnpm build` → then hosted-room
  feel-gate, flipping `BLOCK_PLACER` between `pillars`/`noise`. Verify client renderer handles arbitrary widths
  (expected no-op).

## Align — RESOLVED (2026-08-11, user)
1. **Ceiling:** `MAX_SHIP_WIDTH = 1 cell (4u)` + roster-conformance assertion. ✓
2. **`CLEARANCE_MARGIN = 3u`** → `MIN_CLEAR = 7u`. ✓
3. **Default `BLOCK_PLACER = 'noise'`** (closest to tuned ADR-006 feel; validate feel-preservation first, then
   explore `pillars`). ✓
4. Block-model **both, switchable** via `BLOCK_PLACER`. ✓
5. Constant starting ranges (widths/gaps/depths) = first guesses, **tune live at the feel-gate.** ✓

**→ Greenlit for Implement.**
