Agent: workerfour · Lane: /song-lab song starts at freighter cruise, #253 · Updated: 2026-09-25 00:10

## Goal

The /song-lab song starts when the replayed ship passes the bundle's song start z (freighter cruise), not at GO.
Verify it live against workerone's bundle (61063be).

## Done

- `ab88019`: the song plays behind the replay, at 1× only, re-seeking on drift > 80 ms. Mute, volume, M key.
- `fab0267`: the 13-variant bundle (bcbc3d5) passes: 13/13 digests MATCH, 260/260 runs MATCH.
- `9b3ab59`: song start at cruise from LabSong.clock { z0, t0, zPerSecond }; crossTick; readout clamps at the end.
- `b0be2cc`: the loader reads the typed `bundle.song.clock`; the structural helper is gone.

## State

- tsc clean; vitest song-lab 17/17 (with 61063be).
- Live check, headless Chrome :9474 + scratch Vite :5194, believer-s1.json at 61063be, freighter.
  Drift = ship time − the LIVE audio playhead (playheadAt(elapsedAtPerf(now))), sampled when ship time passes the bar.
  - groove perfect: bar 8/28/60/96 = −10/−8/−5/−1 ms; last audible −16 ms. 0 re-seeks.
  - groove-tight perfect: −10/−8/−5/−3 ms; last −1 ms. 0 re-seeks.
  - envelope perfect: −14/−13/−11/−8 ms; last −7 ms. 0 re-seeks.
  - All three: silent (status ready, not playing) until tick 248; crossTick 248.0; first playhead ≈ 0.09 s.
    Finish at tick 12521, ship time 204.55 s; the song (204.43 s) ends first; readout "song ended · bar 106.4".
  - envelope pro (8 bumps): each bump adds ≈ −25 ms. Drift −15/−68/−119/−197 ms at bars 8/28/60/96, −214 ms
    (analytic) at finish. Audio never re-seeks: song time is tick-based, so the song keeps tempo and leads the ship.
  - Digest line: "track digest MATCH · 20 / 20 runs MATCH" for groove, groove-tight, envelope.

## Uncommitted

- none.

## Held files

`apps/client/app/routes/song-lab/**`, `apps/client/app/routes/tapper/**`, `apps/client/tapper/tapper-plugin.ts`,
the song-lab line in `apps/client/app/routes.ts`. workerone owns `apps/client/song-lab/**`.

## Next

1. Idle. When the supervisor sends the SHA of workerone's `conductor` bundle, repeat the live check on
   conductor × perfect freighter: bars 8/28/60/96 + finish, silence until crossTick, digest MATCH, re-seek count.
   Recreate the driver if the scratchpad is gone. It imports the page modules by resource URL
   (song-sync, tapper-clock, replay-state, /app/game/ecs/traits.ts, the koota dep), calls restartReplay, and samples
   ship time − playheadAt(elapsedAtPerf(now)) on each rAF. Run it with `node drift.mjs conductor perfect`.
   The variant id is passed as `variant=` in the URL.

## Open questions

- none. Re-seek after a bump is DROPPED: the song keeps tempo (owner decision).

## Lessons → memory

`.claude/memory/song-keeps-tempo-not-a-rhythm-game.md`.
