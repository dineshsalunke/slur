Agent: workerthree · Lane: #300 phrase generator — S3 weave landed · Updated: 2026-09-27

## Goal

Build the approved #300 RFC (`.claude/phases/2026-09-26-unified-generator-rfc.md`) slice by slice. S3 = weave
phrase, parallel weave, per-kind open-space exemptions.

## Done

- `b90f436` S2 close.
- `4ca02e7` S3 weave, owner option B: **straight sealed lanes** (20/16/14u by act; walls do not follow
  `weaveRaw`) with a **post slalom inside each lane**. Parallel = two straight lanes, each with its own
  slalom (own phase from `hash2(salt, k)`), hole or wall divider 4/6/8u. 40u funnel in/out (straight taper).
  Slalom: gap 8u (`MIN_LANE`), post 4u, pitch keyed by lane width `WEAVE_PITCH` {20: 52, 16: 36, 14: 24}.
  `weaveLanesAt` = lane walls; `weaveBandsAt` = the open run per row (lane minus post).
  Avoid pilot: dense `sidestep()` check (see memory). Phrase digests re-frozen. `line.ts` removed.

## State

- Class speed (highest capped speed, 0 bumps, line pilot `weaveTarget`, 5 salts, `speeds.mjs` in this
  session's scratchpad):

  | lane | Int 84 | Fig 96 | Com 112 | Pha 90 | Fre 124 |
  |---|---|---|---|---|---|
  | single 20 | 84 | 96 | 112 | 90 | 100 |
  | single 16 | 84 | 96 | 100 | 90 | 86 |
  | single 14 | 84 | 80 | 72 | 72 | 60 |
  | par 20\|16: 20 lane | 84 | 96 | 112 | 90 | 100 |
  | par 20\|16: 16 lane | 84 | 96 | 98–100 | 90 | 86 |
  | par 16\|14: 16 lane | 84 | 96 | 98–100 | 90 | 86 |
  | par 16\|14: 14 lane | 84 | 80 | 72 | 72 | 60 |

  Parallel is no longer toothless: each lane bites like a single lane of its width.
- Pitch is sensitive: act-keyed {40,32,24} gave Freighter 72 on 20u; {64,44,28} gave no bite on 20u.
- `pnpm --filter @slur/shared test` 501/501; `pnpm typecheck` clean; `pnpm lint` exit 0.
- Owner look on `/test-level?gen=phrase` [unmeasured by me — dist confirmed rebuilt with `weaveLanesAt`].

## Uncommitted

none.

## Held files

`packages/shared/src/sim/phrase/*`, `sim/avoid-pilot.test.ts`, `sim/track-digest.test.ts` (phrase row),
`docs/DECISIONS.md` (ADR-023 only).

## Next

1. Owner look test on /test-level?gen=phrase; tune `WEAVE_PITCH` if the slalom reads too soft/hard.
2. ADR-023: S3 numbers + departures (straight lanes + slalom replaces RFC §1.3/§2.3 "band on weaveRaw";
   pitch keyed by width; hole-divider pocket exemption; masked open-space; pilot sidestep check).
3. S4 per the RFC.

## Open questions

- Owner: Freighter pin-bump cost (from S2, pending).
- Owner: is Comet 72 on a 14u lane (RFC had 102–112 for the curved band) acceptable class identity?

## Lessons → memory

`.claude/memory/avoid-pilot-sidestep-needs-dense-check.md`
