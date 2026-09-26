Agent: workerthree · Lane: #300 phrase generator — S3 in progress (weave shape ON HOLD) · Updated: 2026-09-27

## Goal

Build the approved #300 RFC (`.claude/phases/2026-09-26-unified-generator-rfc.md`) slice by slice. S3 = weave
phrase (band 20/16/14u by act), parallel weave, per-kind open-space exemptions.

## Done

- `b90f436` S2 close (see git log). Nothing from S3 is committed yet.

## State

- **HOLD (supervisor, 2026-09-27):** the owner saw the curved `weaveRaw` corridor live and was surprised. The
  supervisor is asking: curved corridor / straight walls with a slalom inside / other. **Do not commit the
  weave-emit shape until the supervisor relays the answer.**
- S3 code is written, compiles, and is uncommitted (list below). Design:
  - `phrase/weave-emit.ts`: `rollWeave(seed, act, slot)` → `WeaveSpec {bands, divider, gap, salt}`. Act low =
    single 20u; mid = single 16u or parallel [20,16] (1 in 3); high = single 14u or parallel [16,14] (1 in 2).
    Divider = hole or wall, gap 4/6/8u. Each 4u row emits sealed walls around the bands; rows with equal x
    merge. A 2-segment funnel (`WEAVE_FUNNEL` 40u) lerps from the open deck. A hole divider is a hole only at
    full openness; in the funnel it is a wall nose.
  - `plan.ts`: new `PhraseKind` `'weave'`, `Phrase.weave: WeaveSpec | null`, seed passed to `sectionPhrases`.
  - `phrase-track.ts`: no groove line any more; weave obstacles plus motif obstacles.
  - `phrase/line.ts` deleted (`git rm`, staged). The weave slot was the only free groove motif.
    `index.ts` swaps its export for `weave-emit.js` (supervisor cleared).
  - `phrase/open-space.ts`: `exemptWeaves()` masks W phrases (full floor, no blocks). Failures: wideShare
    outside W ≥ 0.8, whole ≥ 0.6 (`PHRASE_WHOLE_WIDE_SHARE`), min/narrow/wall on the masked track, arena gap
    on the whole track (RFC §5.3).
  - `avoid-pilot.test.ts`: `reachable()` diagonal-path check (hold `DELAY_TICKS`, then strafe at
    0.7 × strafeClamp). Candidates are ranked, and the pilot takes the best reachable one. Fixes a wedge: the
    pilot aimed at the far band across the splitter nose and pushed into it forever.
  - `weave.test.ts`: act dials, band open on every slice, and the contract ship (27.5u/s) threads 7 shapes ×
    5 salts with 0 bumps. It exports `weaveTarget` (a line pilot on the band ∩ the ship length + lead) and
    `phraseWeaves`.
  - `phrase.test.ts`: the line pilot follows weave bands; the obstacle test covers weave; the pocket test
    exempts pockets over a hole divider (a "fall" zone, RFC §2.3 "drift across = fall").
- Measured before the `pace` edit: avoid pilot, 5 classes × seeds 1–30 on phrase: all finish, 0 deaths.
  Seeds 1–5 and 17: Freighter bumps 21–24.
- Weave tests pass: 3/3. Phrase tests were run before the pilot fix and the pocket exemption. The last full
  run had 2 failures, both addressed since. [not re-run]
- Class speed per band (highest capped speed, 0 bumps, line pilot, 5 salts, `speeds.mjs` in the scratchpad):

  | shape | Int 84 | Fig 96 | Com 112 | Pha 90 | Fre 124 |
  |---|---|---|---|---|---|
  | single 20 | 84 | 96 | 112 | 90 | 100–102 |
  | single 16 | 84 | 88–96 | 104–110 | 84–88 | 70–82 |
  | single 14 | 84 | 80–86 | 92–96 | 70–76 | 64–68 |
  | any parallel band | 84 | 96 | 112 | 90 | 124 |

  Single bands match RFC §1.3. **Parallel bands are toothless.** The last edit (`pace` = √(single amp /
  half amp) row rate in `weaveBandsAt`) changed nothing. Cause not found.
- Digests not re-frozen. Typecheck and biome not run.

## Uncommitted

`packages/shared/src/index.ts`, `sim/avoid-pilot.test.ts`, `sim/phrase/{plan,phrase-track,open-space,phrase.test}.ts`,
new `sim/phrase/{weave-emit,weave.test}.ts`, and `sim/phrase/line.ts` (deleted, staged).

## Held files

`packages/shared/src/sim/phrase/*`, `sim/avoid-pilot.test.ts`, `sim/track-digest.test.ts` (phrase row),
`src/index.ts` (one export line), `docs/DECISIONS.md` (ADR-023 only).

## Next

1. Wait for the owner's weave-shape answer from the supervisor. If the answer is "straight walls + slalom",
   rewrite `weaveBandsAt` and keep the rest.
2. Parallel bands: find why the paced line is still easy. Check `pace` is applied (print raw per row), then
   try a full-deck amplitude per half. Keep the pace edit or revert it.
3. Run `pnpm test` (shared), re-freeze the phrase digests, typecheck, `pnpm lint`.
4. ADR-023: S3 numbers plus departures (row-rate pace, hole-divider pocket exemption, masked open-space,
   pilot reachability).
5. Commit by pathspec, push, and close nothing (S3 is not the whole of #300).

## Open questions

- Owner: weave shape (via the supervisor, pending).
- Owner: Freighter pin-bump cost (from S2, pending).

## Lessons → memory

none this seam. Candidate: "an avoid pilot needs a reachability check at a splitter nose" (write it once S3 lands).
