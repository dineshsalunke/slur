Agent: workerone · Lane: #253 song lab step 2 (variants → tracks → runs → bundle) · Updated: 2026-09-24 20:15

Older versions of this file hold #250 history: 4571c5f and earlier.

## Goal

- Map a song to several track variants, fly each with a pilot for all 5 classes, and write one lab bundle
  for workerfour's `/song-lab` viewer. Throwaway experiment (`.claude/memory/song-tracks-are-a-throwaway-experiment.md`).

## Done

- `0734e06` TASK 1: `gen:'score'` switch applied over #244 (`-C1`). shared 316/316, server 17/17.
- `c3d2a63` Optional intensity curve on `composeScore(seed, length, motifs, curve?)`. It rides on
  `score.curve`, and `freeReach` reads it (supervisor-approved). No curve: sha256 over compose+emit for
  seeds 1–30 unchanged. shared 318/318.
- `0099d73` `apps/client/song-lab/bundle.ts`: the LabBundle v1 type + the shared replay loop (`labStep`,
  `replayRun`, `labTrack`, `labDigest`, `expandInputs`/`packInputs`, `sameResult`). workerfour accepted it.
- `b5b7b3c` The pipeline: `map.ts` (song clock, curves, event placer), `variants.ts` (10 variants),
  `mine.ts` (n-gram motif mining), `pilot.ts`, `record.ts`, `song-lab-build.ts`, `song-lab-cli.ts`,
  `song-lab.test.ts`; `bumps`/`bumpZ` in the result; `LAB_MAX_TICKS` 27000; vitest include; `song-lab` script.

## State

- Bundle: `apps/client/.songs/lab/believer-s1.json` (2.5 MB, gitignored), 10 variants × 5 classes.
- All 50 runs finish with 0 deaths and 0 bumps. Every run is replay-verified before it is written.
  Times per class: interceptor 302.1 s · fighter 264.6 · comet 226.9 · phantom 282.2 · freighter 206.3.
- Played notes: envelope 131 · section-energy 151 · bar-energy 148 · breaths 150 · snare-jump 65 ·
  sweep 65 · kick-jump 70 · triplet-grid 104 · hat-density 139 · mined 126 (12 mined motifs, 51 JJ).
- Direct variants drop most drum events: a note lasts 2–4 beats (120–220u at ~59.5u/beat), so events
  inside the previous note are dropped. `build.params` records events/placed/dropped.
- Song clock: z = 120 + (t − bars[0]) × 124 u/s; track length 1270 segments for Believer.
- song-lab vitest 9/9; client tsc clean for song-lab; biome clean; comment ratchet passes.

## Uncommitted

None.

## Held files

- `apps/client/song-lab/**` · `packages/shared/src/sim/score/*` · the pacing/score lines in shared `index.ts`.

## Next

1. Wait for workerfour's viewer feedback on the bundle; fix any type mismatch in `bundle.ts`.
2. The pilot is perfect, so runs do not tell variants apart. Consider a harder pilot (reaction delay or
   input noise) or a per-class result such as time spent off the line, if the owner wants a signal.
3. Direct variants: try shorter note spacing (drop the `REGISTER_GAP` calm for song notes) or quantise
   to the triplet grid for placement, per workertwo's measurement (86% of snares sit on triplet slots).
4. More seeds / songs: `pnpm --filter @slur/client song-lab <analysis.json> --seed N`.

## Open questions

- Owner: is "all variants fly clean" the result you want, or should the pilot be human-like so the
  bundle shows which mapping is harder?

## Lessons → memory

- `.claude/memory/score-pilot-must-not-lead-the-note.md`.
