# Handover — closing the corridor, and de-quantising the blocks

Session of 2026-09-23. Follows [[HANDOVER-corridor-composition-done]]. Everything below is
committed on `dev`. Gates green at each commit: `pnpm typecheck`, `pnpm test` (305 tests), `pnpm
lint` at the nine pre-existing warnings.

| Commit | What |
|---|---|
| `1fc678c` | split `track.ts` 649 -> 216 lines into six modules |
| `716b67e` | phase note: the split, and the session collision during it |
| `8592d4e` | memory: claim a handover item before writing the first file |
| `c47c532` | **the corridor closes** — open band, pinch gates, re-phrasing |
| `3562406` | ADR-006 as-built: the pinch is built, the +1-lane buffer is retired |
| `7e27250` | **block width and depth are continuous**, not three sizes |

## The finding that mattered

The owner flew the 420-segment track and said it was boring — *"some major places it's pretty open,
I didn't even have to lift any strafing finger for nearly 25% of the track."*

Measured, seed 20260921: narrowest non-gap corridor over 420 segments was **16u** against a 2.6u
ship; median **44u**; **125 of 420** segments empty across the full 64u; only **3 of 420** under
24u. Walking the racing line: **90%** of segments needed no lateral input, longest coast **29s**.

Cause was `laneState` in `sim/track.ts`: every lane of the weave's row-union, plus `CORRIDOR_BUFFER`
either side, was unconditionally open, so deadly blocks could only land at the track edges. **Blocks
were scenery.** That is why the five earlier corridor-composition changes all measured green and
changed nothing on screen — every one of them varied what happens *beside* the flown lane.

ADR-006 had specified the fix and nobody built it: `rg -in pinch` found "the chorus **pinch**
accent" only in `DECISIONS.md`. So this completes ADR-006 rather than reversing it.

## What the corridor is now

- **Open band**, weave-anchored, narrowing 48u -> 24u with intensity. 24u is the floor because the
  weave shifts up to 13.8u between segments and 24 - 13.8 clears `MIN_CLEAR` 7u (GDD §0).
- **Pinch gates**: solid wall, one 12u hole, 2-4 segments, above intensity 0.45, hole **frozen** for
  the gate's length, **funnelled 3 segments on both sides**, built at **full segment depth**.
- `WALL_DENSITY_MAX` 0.4 -> 0.9; `SECTIONS` 16 -> 10 (phrases were ~9.5s, now 10-25s);
  `REST_INTENSITY` 0.15 -> 0.08; gaps get a rest floor so a breather still asks for one jump.
- Block **width and depth continuous** (785 / 1473 distinct values); **height stays 8u**.

Results, seven seeds: longest coast **29s -> 8.4-13.8s**; peak lateral demand **110 u/s (above the
80 u/s clamp — the old track had an unfair moment) -> 58-82**; narrowest corridor 16u -> 12u.
Blocks per streaming window 111 -> 224, so `BLOCK_LIMIT` 160 -> 320.

## Three things measurement caught that reasoning got wrong

1. A weave-following 12u slot has **negative** overlap segment-to-segment — unthreadable. The hole
   must be frozen.
2. The gate **exit** needs a funnel as much as the entry. Without one the band snapped back 26u in
   one segment against 16.8u of reach — a real dead end, caught by `track.test.ts`'s row-level
   REACH-and-FIT test, not by anything I predicted.
3. A gate built from varied-depth blocks had **two ways through** at some z-slices.

**Lesson worth keeping: every design belief here was wrong until measured.** Build the metric first.
`.claude` has no home for these; they were scratchpad scripts and are gone. Rebuilding the
racing-line walk is ~40 lines — `sim/corridor.test.ts` has it as `walkLine`.

## Tests changed metric, not intent — read this before trusting them

Four assertions were rewritten because the thing they measured stopped meaning what it meant:

- `phrasing.test.ts` `busy()` counted "has a block anywhere across 64u". That equalled "has a
  demand" **only** while blocks were confined outside the corridor. Now measures passable corridor
  width. Under the honest metric rest/spike separation is **14.6x** against the 3x asked for.
- `block-depth.test.ts` pinned the exact three depth tiers this work removed. Now asserts 200+
  distinct widths and depths.

New `sim/corridor.test.ts` asserts no stretch lets the player coast without input (the playtest
complaint as a regression guard), that gates close, never below the threadable floor, and have
exactly one way through.

**The greedy walker is NOT a fairness proof.** Two seeds now want 81-82 u/s from the greedy line
against an 80 u/s `strafeClamp`. That is the greedy line choosing badly, not unfairness — a greedy
mid-slice walker cannot distinguish the two. REACH-and-FIT propagates reachable intervals at row
resolution and passes on every seed; that is the real guarantee. Do not "fix" the walker number by
loosening the generator.

## Left undone

- **The playtest.** None of this is verified on screen. The numbers say the corridor closes;
  whether 12u at 55 u/s is exciting or infuriating needs hands. Knobs if gates feel wrong:
  `PINCH_LANES` (3), `PINCH_RATE_MAX` (0.3), `PINCH_INTENSITY_MIN` (0.45), `PINCH_FUNNEL_SEGS` (3).
- **Vertical-reach check still missing from the validator.** Unchanged from the previous handover.
  It now blocks a specific thing: block height is the one axis still fixed (8u, deliberately — GDD
  §0, "above double-jump reach on purpose"), and varying it needs that check first.
- **`BLOCK_LIMIT` is 320 against a measured worst case of 224.** Headroom is thinner than it looks
  because phrasing concentrates blocks into spikes. Watch it if `PINCH_RATE_MAX` or
  `WALL_DENSITY_MAX` rise.
- `CORRIDOR_W_START`/`CORRIDOR_W_MIN` now only feed `gapFloors` deck width. `CORRIDOR_BUFFER` is
  deleted. Neither is a problem; both are worth a look if gap decks feel off.

## Note for whoever is coordinating sessions

`slur-supervisor` and this session both started the `track.ts` extraction off the same "Left
undone" list and it cost two untracked files. Memory written: [[claim-the-lane-before-the-first-write]].
Other sessions had `tuning-panel`, `track-materials`, `track-texture` and `monolith-group` dirty in
this checkout throughout; every commit here used explicit pathspecs.
