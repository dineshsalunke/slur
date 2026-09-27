Agent: workerthree · Lane: #300 phrase generator — ADR-023 amended · Updated: 2026-09-27

## Goal

Build the approved #300 RFC (`.claude/phases/2026-09-26-unified-generator-rfc.md`) slice by slice. This seam:
derive obstacle spacing from ship physics (owner decision, supersedes `WEAVE_PITCH`).

## Done

- `b90f436` S2 close.
- `4ca02e7` S3 weave: straight sealed lanes with a post slalom.
- `afcc66c` derived pitch (owner GO on all four calls):
  - `phrase/pitch.ts`: lead = ACT_SPEED × maxCruise × (REACTION_S 0.3 + crossSeconds) + 2·halfL, max over
    the 5 classes, ceil to CELL. crossSeconds = real `simulate()` + `strafeToward` until `isSettled`.
  - Weave pitch = 4u post + lead(lane − 8u). End margin = one post (was one pitch).
  - Motif gate = pin + lead(|to−from|); `noteBeats` spaces step/held notes by the lead; a motif after a
    weave gets lead-in = lead(act, max |lane centre − x0|).
  - `phraseSegments(seed)`: 5 sections at minimum length with full 480u weaves. `procgenDescriptor` and
    `/test-level` use it.
  - Phrase digests re-frozen.
- `97692ad` ADR-023 amendment: S3 lanes, derived pitch numbers, five departures.
- `8d3abdb` ADR-023 re-measured after #305 (b6e3372): lead/pitch tables, posts 2 / 2–3 / 4, length 744–766,
  flight unchanged.

## State

- After #305: lead (u) by offset 4/6/8/12: act1 120/120/140/136 · act2 108/108/128/120 · act3 92/88/108/104.
- After #305: weave pitch 20/16/14u lanes: act1 140/144/124 · act2 124/132/112 · act3 108/112/92.
- Seeds 1–30 × 5 classes: avoid and line pilot 0 bumps, 0 deaths, 30/30 finish. Speed (avoid): Int 83.7,
  Fig 95.5, Pha 89.5, Com 111.3, Fre 121.7. Before: Freighter bumps avoid 792, line 211.
- Phrase length 744–766 segments on seeds 1–30 (after #305). Always 5 sections: low, low, mid, mid, high.
- Posts per lane: 20u 2, 16u 3, 14u 3 (before: 2.4 / 4.2 / 7.2).
- `pnpm test` (shared) 501/501; `pnpm typecheck` 0; `pnpm lint` 0 (7 pre-existing line-count warnings).
- Owner look on /test-level [unmeasured by me].

## Uncommitted

none.

## Held files

`packages/shared/src/sim/phrase/*`, `sim/avoid-pilot.test.ts`, `sim/track-digest.test.ts` (phrase row),
Released: `docs/DECISIONS.md` (to workertwo for a #305 ADR, 2026-09-27). Released to workertwo (#304): `sim/track-provider.ts`, test-level
route files, `src/index.ts`.

## Next

1. IDLE. Owner decision 2026-09-27: #300 S4 is on HOLD. The owner hand-authors tracks with the #304 editor
   first; generator design resumes from those. Take no work until slur-supervisor assigns it.
2. Readability (post glow, lower posts) is a separate owner question. Do not build it unasked.
3. S4 per the RFC — only after the hold lifts.

## Open questions

- Owner: Comet 72 on a 14u lane is gone (Comet now 111). Does class identity need another lever?

## Lessons → memory

`.claude/memory/phrase-length-is-per-seed.md`
