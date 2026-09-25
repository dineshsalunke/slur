Agent: workerone · Lane: #255 groove track generator (follow-up to #253) · Updated: 2026-09-25

Older versions hold the /beat-deck and song-lab history (`git log -p -- .claude/handovers/workerone.md`).

## Goal

- A `'groove'` TrackGen: its move grammar comes from the owner's /beat-deck takes, and it keeps wide open space
  for combat. /test-level uses it by default.

## Done

- `20c9e02` groove generator, open-space metric, tests, extractor and the /test-level hook-up (#255).
  - `packages/shared/src/sim/groove/`:
    - `grammar.ts`: the frozen take table.
    - `line.ts`: sections, beat events, arenas.
    - `islands.ts`: islands and partial holes, with a separation rule.
    - `groove-track.ts`: segments and pickups on the line.
    - `open-space.ts`: the metric and its targets.
    - `groove.test.ts`: 7 tests.
  - `TRACK_GENS` has `'groove'`, and `makeProcgenTrack` has a branch for it.
  - /test-level: `clientLoader` reads `?gen=`, default `groove`.
  - `apps/client/beat-deck/extract-grammar.mjs`: the dev-only extractor.

## State (measured this session at HEAD + my files, in a scratch copy)

- Grammar is from 5 owner takes (not 4). Switch side 196/267 = 0.73. Jump share: low 2/75, mid 4/174,
  high 33/61. The high-band result is weak: 28 of the 39 jumps come from take 02-02.
- Open space, seeds 1–30, length 400:

  | Gen | ≥5 lanes | min lanes | longest <4 lanes | longest wall | longest gap between arenas (≥240u fully open) |
  |---|---|---|---|---|---|
  | groove | 0.980–1.000 | 3.03 | 20u | 48u | 1104u |
  | weave | 0.767–0.816 | 0 | 110u | 236u | 7880u |
  | score | 0 | 0 | 7880u | 7880u | 7880u |

  All groove targets pass: ≥0.8 · ≥2 · ≤60 · ≤60 · ≤1200.
- Density: about 29 islands and 8 holes per seed, one obstacle per 214u.
- Flyability, 30 seeds × 5 classes: a delayed-perception avoidance pilot finished 150/150 with 0 deaths.
  Bumps over 30 seeds: interceptor 8, fighter 9, comet 7, phantom 9, freighter 9. The line pilot
  (freighter) finished 30/30 with 0 deaths and 0 bumps.
- There are no roster pockets on seeds 1–10.
- Gates: typecheck green, lint green, shared 323/323 (scratch at HEAD), server 17/17, client 340/340.
- The in-tree uncommitted strafe-kick work (`step.ts`, `constants.ts`, `ship-classes.ts`, not mine) makes the
  freighter wedge on groove seed 13 under the test pilot. That is a pilot artifact
  (`.claude/memory/fractional-strafe-pilots-trip-strafe-kick.md`). `groove.test.ts` may fail when the kick lands.
- /test-level has no headless visual tap yet [unmeasured]. It typechecks and the owner has not playtested it.

## Uncommitted

- None.

## Held files

- `packages/shared/src/sim/groove/**` · `apps/client/beat-deck/extract-grammar.mjs` ·
  `apps/client/app/routes/test-level/route.tsx` · `apps/client/app/routes/test-level/test-level-canvas.tsx`.

## Next

1. The owner playtests `/test-level` (groove), and `?gen=weave` for comparison.
2. Tune from feedback. Density: `ISLAND_CHANCE`, `ISLAND_WIDTHS`, `ISLAND_DEPTHS` in `islands.ts`. Arenas:
   `GROOVE_ARENA_EVERY`/`_BEATS` in `line.ts`.
3. When the strafe kick lands, give the `groove.test.ts` pilot whole-key strafes with a deadband.
4. Push `20c9e02` (the supervisor decides).

## Open questions

- Is groove's obstacle density right (1 per ~214u, about 1.7 s at 124 u/s)? The owner judges in play.
- Push `archive/song-lab` to origin? This is still the owner's decision.

## Lessons → memory

- `.claude/memory/fractional-strafe-pilots-trip-strafe-kick.md`.
