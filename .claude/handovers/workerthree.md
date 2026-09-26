Agent: workerthree · Lane: #300 phrase generator — S2 closed, S3 next · Updated: 2026-09-27

## Goal

Build the approved #300 RFC (`.claude/phases/2026-09-26-unified-generator-rfc.md`) slice by slice. S2 is
closed. S3 = weave band 20/16/14u + parallel weave + per-kind open-space exemptions.

## Done

- `0ae9967` S2 part 1: vocabulary, teach/repeat/twist, gate posts.
- `b90f436` S2 close:
  - `motif-emit.ts`: a 4u pin before each lateral onset (`SCORE_PIN_HALF`), a gate near-wall running to
    the deck edge, a far post at `MIN_LANE − 2.5`, and full-width J/JJ holes.
  - `phrase/open-space.ts`: `bridgeAirSlices` counts no-floor slices as open deck.
  - `avoid-pilot.test.ts` `fly()`: speed-scaled double-jump pick (`nextJump`), and the avoid pilot reads a
    no-floor slice as air.
  - `phrase.test.ts`: an adherence test, plus a motif-line-vs-avoid test that replaces the avoid-only test.
  - Phrase digests re-frozen. ADR-023 has the S2 acceptance numbers and the three RFC departures.
  - Pushed to origin/dev.

## State

- Adherence on motif notes, seeds 1–30: 1.000 (1,350/1,350). It was 0.000 before `b90f436`.
- Motif-line pilot vs avoid pilot, 5 classes × seeds 1–5 and 17: faster in all 30 measured runs, 0 deaths.
  The test asserts ≤.
- Avoid pilot: 30/30 finish, 0 deaths. The Freighter takes 19–23 pin bumps per run (~25% slower). The
  supervisor has taken this to the owner as a playtest item. **Do not tune until the owner answers.**
- A pure groove-line pilot is up to 66 ticks slower than avoid in the `weave` slot (S3 scope).
- 495/495 shared tests pass; typecheck clean; biome clean on my files (3 pre-existing size warnings
  elsewhere).
- Owner flight times on `/test-level?gen=phrase`: none received. [unmeasured]

## Uncommitted

None.

## Held files

`packages/shared/src/sim/phrase/*`, `docs/DECISIONS.md` (ADR-023 only). Released:
`track-digest.test.ts`, `avoid-pilot.test.ts`. Re-claim them from the supervisor if S3 needs them.

## Next

1. Claim S3 files with the supervisor.
2. S3: weave band 20/16/14u by act; parallel weave (owner addition: L/R halves, or two weaves split by a
   4–8u hole strip); per-kind open-space exemptions, folding `bridgeAirSlices` in. Accept: the pure line
   pilot is no slower than avoid in the weave slot too.
3. S4–S7 per the RFC table.

## Open questions

- Owner: is the Freighter pin-bump cost acceptable? (via supervisor)

## Lessons → memory

`.claude/memory/doors-cannot-force-a-one-cell-step.md`
