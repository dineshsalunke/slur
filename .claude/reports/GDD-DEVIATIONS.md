# GDD deviations — doc against code

Audit of `docs/GDD.md` against the shipped code, 2026-09-23. Every finding quotes the doc wording it
relies on and the file and line that contradicts it. Nothing here is fixed — this is the list.

Verified this session by reading the code. Where a finding is inference rather than a direct
contradiction, it says so.

## Summary

| Severity | Count |
|---|---|
| The doc describes a contract that does not exist | 3 |
| The doc describes behaviour the code no longer has | 4 |
| Stale pointer or number | 4 |

---

## 1. The doc describes a contract that does not exist

### 1.1 `MIN_CLEAR`, `MAX_SHIP_WIDTH` and `CLEARANCE_MARGIN` are not in the code

GDD §0 presents these as the single load-bearing spatial invariant:

> *"The ONE load-bearing spatial invariant is threadable clearance: At every z-slice, the widest
> contiguous lethal-free floor run must be ≥ `MIN_CLEAR`, where `MIN_CLEAR = MAX_SHIP_WIDTH +
> CLEARANCE_MARGIN`, `MAX_SHIP_WIDTH = CELL` (4u, the ship-size contract) and `CLEARANCE_MARGIN = 3u`
> → `MIN_CLEAR = 7u`."*

None of the three identifiers occurs anywhere in `packages/shared/src` or `apps`. What ships is a
single derived constant — `packages/shared/src/sim/space.ts:10`:

    export const MIN_LANE = 2 * CELL;

That is **8u**, not the documented 7u, and it is an axiom rather than a derivation. GDD §0 explicitly
forbids exactly this shape: *"Any `MIN_LANE`-style constant is *derived*, **not an axiom**."*

**Impact:** the clearance number the whole §0 argument is built on is not the number the generator
uses, and the tunable the doc offers (`CLEARANCE_MARGIN`, *"the **only** clearance tunable"*) does not
exist, so the documented way to make tracks easier or harder is not available.

### 1.2 The roster-conformance guard is a test, not a module-load assertion

GDD §0:

> *"**Module-load guard (dev):** `assert 2·max(halfW over ALL_CLASS_TUNINGS) ≤ MAX_SHIP_WIDTH`."*

There is no such assertion. `ALL_CLASS_TUNINGS` is exported at
`packages/shared/src/ship-classes.ts:132` and consumed in exactly two places: `sim/weave.ts:15-16`
(the slope/curvature caps) and `sim/track.test.ts`. The only width check is in the test file —
`packages/shared/src/sim/track.test.ts:36`:

    const WIDEST_HALF_W = Math.max( ...ALL_CLASS_TUNINGS.map( ( t ) => t.halfW ) );

**Impact:** a new or resized ship does not fail at module load as designed. It fails a test run, if
one is run.

### 1.3 Clearance tracks the live roster — the exact failure §0 exists to prevent

This is the sharpest finding, and it is an inversion rather than an omission. GDD §0 argues for a
fixed ceiling *because* roster-derived clearance is unsafe:

> *"Why a **fixed contractual ceiling**, not roster-max: a track seed must generate the **same
> geometry forever**. If clearance tracked the live roster, adding/resizing a ship would silently
> mutate every existing seed's track."*

In code, the caps the generator is bound by are derived from the live roster —
`packages/shared/src/sim/weave.ts:15-16`:

    export const SLOPE_CAP = deriveWeaveSlopeCap( ALL_CLASS_TUNINGS );
    export const CURV_CAP = deriveWeaveCurvatureCap( ALL_CLASS_TUNINGS, CELL );

`ALL_CLASS_TUNINGS` is `Object.values( SHIP_CLASSES ).map( c => c.tuning )` — the live roster. Adding
or retuning a ship changes `SLOPE_CAP`/`CURV_CAP`, which changes the corridor, which changes the
geometry a given seed produces.

**Impact:** the determinism promise — *"a track seed must generate the same geometry forever"* — does
not hold across a roster change. Ship balancing silently reshapes every existing seed. This is worth
deciding deliberately: either the doc's fixed ceiling gets built, or §0's rationale is rewritten to
admit that seeds are roster-versioned.

---

## 2. The doc describes behaviour the code no longer has

### 2.1 Slow blocks are gone from the sim; the GDD still ships them

GDD §5.2:

> *"**Slow blocks stay live in the generator until that ADR is accepted.**"*

and, describing the generator:

> *"The core game is **three primitives only: gaps + deadly blocks + slow blocks**"*

There is no slow or drag block in the simulation. The only matches for "drag" in
`packages/shared/src` are the unrelated flight constant `coastDrag`
(`constants.ts:9`, `constants.ts:68`, `sim/step.ts:13`). `Block.lethal` was removed and one lethal
family remains. ADR-009 in `docs/DECISIONS.md` still describes the family as live.

**Impact:** two of the three documented core primitives are one primitive in code. Any design
reasoning that counts on a speed-tax primitive is reasoning about something that does not exist.

### 2.2 `tier` is in the descriptor but wired to nothing

GDD §5.2 describes the descriptor as carrying difficulty: *"procgen `{seed, tier}`"*.

`tier` exists on the wire — `packages/shared/src/schema.ts:56`, `@type( 'uint8' ) tier = 0;` — and is
copied in and out of room state at `schema.ts:67` and `schema.ts:81`. No generator code reads it.
`packages/shared/src/sim/track-provider.ts:16` hardcodes it:

    return { kind: 'procgen', seed, tier: 0, length: TRACK_SEGMENTS };

**Impact:** a synced field that costs wire bytes and implies a feature that is not built.

### 2.3 `/env-lab` is listed as a surviving art route; it was deleted

GDD §5.6:

> *"**Art review instruments** — `/art-lab`, `/art-gallery`, `/iso-*` … **REMOVED 2026-09-21** …
> What is left: `/env-lab` and a hosted room."*

`apps/client/app/routes/` contains exactly three entries: `game`, `home`, `test-level`. `/env-lab` was
deleted 2026-09-22 with the lighting strip (issue #196), as CLAUDE.md records. The row is also
missing `/test-level`, which is the route that actually replaced them.

### 2.4 The flight-stats table is stale, and says so

GDD §5.5 carries its own warning: *"⚠ **STALE — do not code against this table.** … playtest tuning
moved **strafe power and grip** past these numbers on every class."*

Listed here for completeness because it is a known, self-declared divergence with a parked
reconciliation, not an unknown one. The footprint table immediately above it **is** accurate —
verified: Fighter is `DEFAULT_TUNING` with `halfW: 1.3` (`constants.ts:74`) → 2.6u, and the
Interceptor/Comet/Phantom/Freighter `halfW` values 1.0 / 1.1 / 1.2 / 1.25 in `ship-classes.ts` match
the documented widths.

---

## 3. Stale pointers and numbers

| GDD says | Reality | Where |
|---|---|---|
| `MIN_CLEAR = 7u` per-slice floor | `MIN_LANE = 8u` | `sim/space.ts:10` |
| "Any `MIN_LANE`-style constant is derived, not an axiom" | `MIN_LANE` is the axiom | `sim/space.ts:10` |
| `/env-lab` survives | route deleted; `/test-level` is the survivor | `apps/client/app/routes/` |
| ADR-009 slow blocks "stay live" | removed from the sim entirely | `packages/shared/src/sim/` |

---

## What to do with this

None of it is fixed. Three of the findings are design decisions rather than typos — 1.1, 1.3 and 2.1
each need a call on which side moves, the doc or the code. 1.3 is the one worth taking first: it is a
correctness promise about seed stability that the code does not keep, and the GDD already contains
the argument for why that matters.
