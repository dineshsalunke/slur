Agent: workerone · Lane: #253 song lab step 2 (variants → tracks → runs → bundle) · Updated: 2026-09-24 20:25

Older versions of this file hold #250 history: 4571c5f and earlier.

## Goal

- Map a song to several track variants, fly each with a pilot for all 5 classes, and write one lab bundle
  for workerfour's `/song-lab` viewer. Throwaway experiment (`.claude/memory/song-tracks-are-a-throwaway-experiment.md`).

## Done

- `0734e06` TASK 1: `gen:'score'` switch applied over #244 (`-C1`). shared 316/316, server 17/17.
- `c3d2a63` Optional intensity curve on `composeScore(seed, length, motifs, curve?)`.
- `0099d73` `apps/client/song-lab/bundle.ts`: LabBundle v1 type + shared replay loop. workerfour accepted it.
- `b5b7b3c` The pipeline: map, variants (10), mine, pilot, record, build, CLI, tests.
- `f98f9e5` Human-pilot runs (supervisor answer to the pilot question): `LabVariant.humanRuns?: LabHumanRun[]`,
  `LabHumanRun = LabRun & { pilot: LabPilotSpec }`, skills pro/club/rookie in `human.ts`. `runs` unchanged.
  CLI `--skills pro,club,rookie|none` (default all three).

## State

- Bundle: `apps/client/.songs/lab/believer-s1.json` (16.7 MB, gitignored; built with `--name believer-s1`).
  50 perfect runs + 150 human runs.
- Perfect runs are byte-identical to the pre-f98f9e5 bundle: sha256 over `[.variants[].runs[] | {inputs,result}]`
  = `f10e9316…` before and after.
- All 200 runs replay to the same result from the JSON; every track digest matches (scratch check with
  `bundle.ts` replayRun/sameResult).
- Human model: steers to the line where it was reactTicks ago (9/15/21), OU aim wobble σ 0.4/0.9/1.6 u held
  15 ticks and clamped to [a+halfW, b−halfW], takeoff jitter ±6/12/20 u. Planner predictions stay perfect.
- Summed deaths, pro/club/rookie: envelope 0/17/75 · section-energy 1/30/80 · bar-energy 0/24/78 ·
  breaths 0/21/67 · snare-jump 1/15/38 · sweep 1/19/64 · kick-jump 5/17/42 · triplet-grid 1/14/39 ·
  hat-density 2/29/74 · mined 12/44/103. Drum-driven variants are easiest; mined is hardest.
- One seed per cell, so single cells are noisy [unmeasured: variance across seeds].
- Freighter is the rookie outlier: DNF at the 450 s cap on 5 variants.
- song-lab vitest 10/10 (incl. seeded + replay + perfect-unchanged test); client tsc clean; biome clean;
  comment ratchet passes.
- workerfour was told the type change before the commit; no reply yet.

## Uncommitted

None.

## Held files

- `apps/client/song-lab/**` · `packages/shared/src/sim/score/*` · the pacing/score lines in shared `index.ts`.

## Next

1. Wait for workerfour: the viewer ignores `humanRuns` until it shows them (key by classId/skill).
2. If the owner wants firmer numbers: several seeds per skill, report mean ± spread per variant.
3. Bundle size: the human inputs dither (5.5k RLE entries per run vs 831 perfect). A strafe dead-band in the
   human driver would cut it if 16.7 MB is too heavy for the viewer.
4. Direct variants: shorter note spacing or triplet-grid placement (see git history of this file).

## Open questions

- Owner: are the skill numbers (reaction 150/250/350 ms, aim σ, jitter) the right calibration?

## Lessons → memory

- `.claude/memory/delay-the-perception-not-the-loop.md`.
