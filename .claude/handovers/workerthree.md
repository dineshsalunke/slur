Agent: workerthree · Lane: #300 phrase generator — S2 part 1 built, adherence + line pilot next · Updated: 2026-09-27

## Goal

Build the approved #300 RFC (`.claude/phases/2026-09-26-unified-generator-rfc.md`) slice by slice. S2 = per-run
motif vocabulary, teach/repeat/twist, gate posts; done when adherence ≥ 75% and a line pilot is no slower than
the avoid pilot.

## Done

- `7b696f3` ADR-023: S1 draw calls + build time at 600 segments measured.
- `0ae9967` S2 part 1: `sim/phrase/vocabulary.ts` (drawVocabulary, twists, isFlyable memo, noteBeats on a
  half-beat grid), `sim/phrase/motif-emit.ts` (snapCell moved here, placeMotif, emitMotif: gate posts / holes /
  smash), `plan.ts` (planPhrases(seed, length), sections = largest count that fits), `line.ts` (random groove
  events only in the `weave` slot), `phrase-track.ts` (PhraseBuild.notes), tests, phrase digest re-frozen,
  ADR-023 sizing bullet (owner option A).

## State

- Measured: draws 127 for phrase@600 and 127 for groove@420; JS 1.3–1.4 ms per frame; first scene frame ~1.5 s
  for both (headless Playwright, DPR 1).
- Owner ruling (option A): 3-note motifs in every act. Seeds 1–30 at 600 all plan 5 sections (low, low, mid,
  mid, high). Section min 2,204–2,372u; usable 11,580u.
- 494/494 shared tests pass; typecheck clean; biome clean on my files. weave and groove digests unchanged.
- The 30-seed open-space test, roster pockets (10 seeds) and the avoid-pilot flight test (6 seeds × 5 classes,
  0 deaths) all pass with the new gates.
- Adherence on motif phrases: [unmeasured]. Line pilot vs avoid pilot: [unmeasured].
- Twist "compress" is dropped (the teach phrase is already at the register-gap minimum). "Post → hole on a
  jump note" is not built.
- The owner has been asked (via supervisor) to fly `/test-level?gen=phrase` and send finish times; none yet.

## Uncommitted

None.

## Held files

`packages/shared/src/sim/phrase/*`, `docs/DECISIONS.md` (ADR-023 only). Release the digest-test claim —
done with it.

## Next

1. Adherence: for each seed, build expected ScoreNotes from `buildPhrase(seed).notes` (k0 = z, since
   PACING_DZ = 1; see `expected()` in `sim/score/emit.test.ts`). Compare with
   `analyzeTrack(track).score.notes` using `scoreAdherence`, restricted to teach/repeat/twist z ranges.
   Target ≥ `SCORE_ADHERENCE_FLOOR` (0.75). If jump notes fail (the path goes round a 16u hole instead of
   jumping), flank holes with posts or widen them.
2. Line pilot: a `Steer` that targets the placed-note line (x = `to` from each onset, lead ~ move time). Compare
   `fly(...).ticks` with the avoid pilot per class × seeds 1–5, 17. Accept: line ticks ≤ avoid ticks.
3. Put both into `phrase.test.ts`, record the numbers in ADR-023, commit, close S2.
4. Then S3 (weave band 20/16/14u + parallel weave + per-kind open-space exemptions), S4–S7.

## Open questions

None.

## Lessons → memory

none (the sizing lesson is in ADR-023: score note durations plus the 0.5 s calm make a 3-note motif ~500u).
