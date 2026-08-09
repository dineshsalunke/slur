# 2026-08-09 — Procedural generation: flow + progression (BRAINSTORM, validated proto)

**Decision (user, this session):** target = **flow + progression together**; role = procedural is the
**primary content path** (Survival core + Race per-seed variety), hand-authoring reserved for *signature*
Race courses. Both still feed the existing `Track.segmentAt()` (unchanged sim contract). **Post-S4 work.**

## Problem with today's generator (`track.ts`)
Provably *fair* but has **no design intent**: archetypes are IID per segment (same probabilities at row 5 and
row 195) → (1) no difficulty arc, (2) no pacing, (3) cubes placed one-per-row at a *random lane* → the weave
reads as **scatter**, not *a line to thread*. The cuberun feel comes from coherent obstacle **streams**, which
IID placement can't produce even when passable.

## The design — "carved corridor + noise walls" (validated headlessly)
Prototype: `scratchpad/procgen-proto.mjs` (ASCII-renders a track + audits fairness). Both RACE & SURVIVAL
**PASS** (min contiguous open ≥ MIN_LANE, gaps within reach). Key ideas, all trig-free/deterministic
(hash + smoothstep + abs/floor — obeys the `track.ts` no-sin/cos/sqrt rule):

1. **Carved racing line `L(z)`** — a low-freq value-noise meander, capped at **≤1 lane/row** (≤ strafe reach).
   A `MIN_LANE`-wide corridor is cleared around it. This is the load-bearing trick: it **guarantees a
   threadable path** (FIT by construction, no pigeonhole) AND *is* the readable weave line the player follows.
2. **Noise-decorated cube walls** OUTSIDE the corridor: `cube if valueNoise(lane,z) < density(D)`. Low-freq
   noise → coherent flowing walls + channels (not scatter). `density` rises with `D`.
3. **Difficulty `D(z)`** — Race: ease-out to a cap; Survival: unbounded slow growth. Drives **corridor width**
   (wide→MIN_LANE as D↑), **meander rate** (straighter→busier), and **wall density**.
4. **Pacing** — deterministic **triangle wave** added to `D`: `tri(t)=2|2(t−⌊t+½⌋)|−1` (no `Math.sin`).
   Tension (peak) → release (trough), ~20-row wavelength.
5. **Gaps** — sparse, freq rises slightly with D, never in start-safe, never clustered; each **gated by
   GAP-REACH** (≤ one segment, the existing jump-reach floor).

**Why this beats the alternatives:** the corridor makes "is there a path?" a *non-question* (fair by
construction, like today) while the noise walls + ramp + pacing add the flow/arc/rhythm today lacks. It keeps
the **playstyle-balance** principle ([[balance-at-playstyle-not-geometry]]): difficulty is "how tight/dense",
never "did the seed wall me in". Corridor-carve also composes with hand-authored signature courses (author =
override the corridor + walls for a stretch).

## Proto caveats → production must add
- **Hash parity:** proto uses a throwaway JS hash; production MUST reuse `track.ts` `hash2`/`mulberry32`
  byte-identically (client==server determinism — the whole reason collision auto-networks).
- **Meander/gap caps derived, not hand-picked:** cap L-step and gap length from `strafeClamp`/`jumpReach` of
  the **least-capable class** (shared track), mirroring the existing `MIN_LANE`/GAP-REACH derivations →
  difficulty stays a config edit.
- **Real gaps span a full segment** (5 rows); proto used single gap-rows. Ensure a full-segment gap ≤ GAP-REACH
  (already true for 1-segment gaps) and never emit multi-segment gaps.
- **Two-floor validator as a property test:** z-monotonic flood-fill FIT + per-gap GAP-REACH, asserted over
  many seeds AND many `D` values (not just today's uniform seeds) — the backlog validator, now with a ramp to
  stress.
- Tune: proto corridor is generous (min 5 open) → likely too easy; tighten `halfW` curve at the feel-gate.

## Port plan (post-S4, one slice)
1. `sim/noise.ts` (NEW, shared): `valueNoise(seed,x,z,fx,fz)` + `tri()` — trig-free, tested for determinism.
2. `sim/track.ts`: replace `buildSegment`'s IID archetype+scatter with corridor-carve + noise-walls + gaps
   driven by `Dof(i, mode)`; keep `Segment`/`Block`/`FloorSpan` shapes (renderer + collision unchanged).
3. `constants.ts`: `Dof` params (per-mode trend, pace amp/wavelength), corridor-width curve, meander cap
   (derived), density curve — every field commented ([[intuitive-tuning-surfaces]]).
4. `sim/track.test.ts`: extend determinism + fairness gates to the ramped generator (property test over
   seeds × D); assert no multi-segment gaps, corridor always ≥ MIN_LANE, byte-identical two builds.
5. Mode plumbing: `D(z)` needs a `mode` (race|survival) — a room-state field or track-build param when
   Survival (S7) lands. For Race now, only the ease-out trend is used.

## STATUS
Design validated by headless ASCII proto (RACE + SURVIVAL both fair). **Deferred to post-S4** (S7/Survival
or an earlier "level system" slice). Not started in code. Proto kept in scratchpad for reference.
