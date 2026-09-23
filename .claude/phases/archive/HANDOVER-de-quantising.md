# Handover — de-quantising the silhouette

Session of 2026-09-23. Follows [[HANDOVER-corridor-closing]]. Everything below is committed on `dev`.
Gates green at each commit: `pnpm typecheck`, `pnpm test` (139 shared + 4 server + 174 client), `pnpm
lint` at the eight pre-existing warnings.

| Commit | What |
|---|---|
| `fbd1165` | **wall blocks carve into continuous 4–20u chunks**, not a lane-wide picket |
| `4d938d1` | backlog: the four layers of this bug, and what each measured |
| `568c523` | **every monolith gets its own size**, and the two sides stop mirroring |

## The finding

The owner flew the track and said the blocks read as *"a vertical grid with a block and space"* — a 4u
block, a 4u gap, repeating. It was one bug appearing at four layers, in four different files. The
previous session had de-quantised block **depth** and stopped there, so width was untouched.

Measured, seed 12345 over 400 segments: **44% of blocks fell in 2.6–4u**, the ceiling was 12u, and
the range 4–5.1u was empty. Three stacked quantisers produced that:

1. `WALL_NOISE_FZ_LANE` was **1.0**, so `valueNoise2D` sampled the lane axis exactly on its lattice
   nodes — `smoothstep(0) === 0` — and adjacent lanes were uncorrelated. Wall runs came out
   geometric, mostly one lane long.
2. `buildWalls` chopped any run at `BLOCK_MAX_LANES`, a hard 12u ceiling that also emitted repeated
   max-width chunks side by side.
3. `blockWidthInset` shrank a run by at most 18% per side, so widths clustered in three bands with
   dead space between them.

## What the walls are now

Lane frequency **4.0**, no chop, and `carveRun` splits a run into continuous 4–20u chunks separated
by continuous 2–9u gaps, each chunk taking its own `blockZSpan` so a run does not read as one slab.
Runs under `WALL_RUN_LANES_MIN` are dropped. A **pinched** segment still emits one solid uncarved
wall — the pinch is meant to be a wall, not a colonnade.

Measured after: widths span **4–20u continuously**, no single width holds more than **3.4%** of the
field, and **21.6%** of blocks reach 12u or wider, from 0%.

**The clamp was the last quantiser and the one that nearly got missed.** Taking `min(want, remaining)`
piles every oversized draw onto the run width itself, so a 4u run always produced exactly 4.0u —
22.5% of the field after the first two fixes. `carveRun` draws from the *narrowed* range instead.
Any future width code that clamps rather than re-ranges will re-introduce this.

## What the monoliths are now

`monolith-config.ts` carried one shape and `monolith-field.ts` pushed `{ z, side: -1 }, { z, side: 1 }`
together — every monolith stood opposite an identical twin, at a spacing that was a pure function of
intensity with no jitter, each at the same distance from the rail.

Each side now walks its own sequence, the right phase-offset by ~half a spacing. Spacing takes a
0.55–1.6 jitter, one in seven placements is dropped, and each monolith draws its own width, height
and depth multiplier plus a push back off the rail. The `obelisk` shape was defined but never used;
the mix now carries both.

Sizing rides the instance transform through a new `placedShape`, which composes the multipliers into
a shape config — so `bodyTransform` and `seamTransform` needed no changes and the seam follows the
resized face. Geometry stays one unit box per shape, so instancing is unchanged; only its UV `size`
is nominal, which spreads the texture slightly at the extremes. The base stays buried at the
configured `below` depth, so a half-height monolith sinks rather than floats.

## Budget

The carve **freed** headroom rather than spending it: worst case per streaming window went
**224 → 136** against `BLOCK_LIMIT` 320 (measured, 9 seeds), because wide blocks replace several
narrow ones. The previous handover's warning that the headroom was thin no longer holds. If the
field wants to be denser, `WALL_DENSITY_MAX` and a smaller `BLOCK_SPLIT_GAP_MIN` are affordable.

## Left undone

- **Gap-deck blocks never got the carve.** `packages/shared/src/sim/gap-blocks.ts:39` —
  *"const lanes = 1 + Math.floor( r() * BLOCK_MAX_LANES );"* and line 44
  *"x0: -HALF_WIDTH + start * CELL"*. Measured, 9 seeds: 157 blocks, **exactly 3 distinct widths —
  4, 8, 12**. Same fix as the walls, but it must re-check `passableCorridorWidth` because gap decks
  are narrow to begin with and `gapBlockCandidate` already retries against that floor. **This is the
  next task**, and it is small.
- **Block height is the last fixed axis** — every block exactly 8u. Gated on the vertical-reach check
  still missing from the validator; GDD §0 puts 8u *"above double-jump reach on purpose"*. Carried
  from [[HANDOVER-corridor-closing]], unchanged.
- **The flythrough gate.** The headless frame tap proves the monolith field renders with the two
  sides visibly independent, but `/test-level` does not fly itself, so that is the **start-line view
  only**. Neither the new wall widths nor the monoliths have been judged in motion. The owner called
  the wall change *"coming out well"* from screenshots; the monoliths have had no such look yet.
- The pinch-gate playtest from [[HANDOVER-corridor-closing]] is still open and still unrelated to
  width.

## Method

Measure the histogram before touching anything. Every quantiser here was invisible to reasoning and
obvious to a histogram — the same lesson as the previous handover's *"every design belief here was
wrong until measured."* The scripts were scratchpad one-liners over
`packages/shared/dist/sim/track.js` and are gone; rebuilding one is about fifteen lines.

Extension-driven Chrome was **not connected** this session. The headless frame tap in
[[headless-chrome-for-frame-taps]] worked first try and is the thing to reach for.
