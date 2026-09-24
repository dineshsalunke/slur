Agent: workerone · Lane: #253 song lab → wind-down + new "fly-and-record" tapper · Updated: 2026-09-25 00:30

Older versions of this file hold the conductor and earlier #253 history (`git log -p -- .claude/handovers/workerone.md`).

## Goal

- Owner, 2026-09-25: "this is not really working out". Archive all song-lab work on a branch. Keep the
  **replay-related code** on `dev`.
- Then a new experiment. A route with a plain empty deck: no blocks, no gaps. The owner picks any mp3 and plays
  it, then flies and strafes on the beats. The inputs are recorded. We analyse them to learn what the owner
  means by moving to a song.

## Done

- `db8cd1e` conductor variant · `b64766f` handover.
- Branch **`archive/song-lab`** → `b64766f` (the tip of `dev`). Made with `git branch`, no checkout, so HEAD
  stays on `dev`. **Not pushed.**

## State

- `/tapper` **already exists** (`7f397d0`, `apps/client/app/routes/tapper/`). It is a 2D key-tap recorder
  (takes, note lane, song grid, `recorder.ts`, `takes-store.ts`). It is dev-only, registered in
  `apps/client/app/routes.ts:10` beside `song-lab`.
- `apps/client/tapper/` holds the beat analysis: `beat-analysis.ts`, `drum-onsets.ts`, `tapper-plugin.ts`.
  `song-lab` imports its types.
- Song-lab footprint on dev: `apps/client/song-lab/*` (generators + CLI), `apps/client/app/routes/song-lab/*`
  (viewer), plus references in `routes.ts`, `package.json`, `vitest.config.ts` and `tapper-plugin.ts`.
- The bundle swap never happened. It is moot now.

## Uncommitted

- None.

## Held files

- `apps/client/song-lab/**` · `apps/client/app/routes/song-lab/**` · `packages/shared/src/sim/score/*`.

## Next — wait for the owner's answers first

1. Owner decides what "replay-related" means. Proposal: **keep** `song-lab/bundle.ts` (labStep, replayRun,
   pack/expandInputs, LabRun and LabResult types), `record.ts`, `pilot.ts` and `human.ts`, plus the viewer's
   `replay-*` files, `song-sync.ts` and `lab-check.ts`, moved to a neutral home. **Remove** the generators:
   `conductor.ts`, `groove.ts`, `variants.ts`, `map.ts`, `mine.ts`, `open.ts`, `song-lab-cli.ts`, `-build.ts`.
   Also remove the `/song-lab` route UI.
2. Owner decides the name clash. The existing `/tapper` is the 2D recorder. Choose: replace it, extend it with a
   3D deck, or give the new route another name.
3. Push `archive/song-lab` to origin? This needs the owner's say. It is outward-facing.
4. Then file an issue, claim files with the supervisor and build the deck route. Reuse `/test-level` rendering,
   the song playback from `song-sync.ts`, and `packInputs` to record inputs with the song time per tick.

## Open questions

- The 3 items above (replay scope, route name, push).

## Lessons → memory

- none this seam.
