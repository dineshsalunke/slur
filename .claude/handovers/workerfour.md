Agent: workerfour · Lane: /song-lab replay viewer + background song, #253 step 3 · Updated: 2026-09-24 23:40

## Goal

A dev-only /song-lab route that replays recorded runs over the rebuilt track. The song now plays behind the
replay so the owner can feel it. Throwaway, like /tapper.

## Done

- `790c6cb`, `bf70803`, `67a2dfa`, `ddf5bfe`, `63b8014`: the viewer, results, and perfect/pro/club/rookie pilots.
- `ab88019`: the song plays behind the replay. song time = tAt(songClock(analysis), spawn z) + ticks × FIXED_DT
  (0.380 s at tick 0). It plays at 1× only and is silent at other speeds. It re-seeks on drift > 80 ms and on
  every pause, restart, class switch and speed change. Mute button + volume slider + M key. The readout shows
  the song bar and the ship bar with the lead in seconds.

## State (verified this session)

- 13-variant bundle check (workerone bcbc3d5, believer-s1.json 21.9 MB), viewer at HEAD with no code change:
  all 13 track digests MATCH, 260/260 runs MATCH (13 × 20 per variant). Load 583–672 ms warm, 1320 ms cold.
  Full live replays at 8× all MATCH: groove-open × freighter × rookie (403.35 s, 195 bumps), groove-tight ×
  comet × club (239.38 s), groove × interceptor × perfect (302.13 s). At 8× the song never started (0 starts).
  Client tsc clean, song-lab vitest 9/9.
- Cosmetic: after the song ends, the readout's song bar keeps counting past bar 106 (e.g. "song bar 210.3").
  The audio is correct. Not fixed.

- Headless (fighter, mined, perfect, scratch :5194/:9474): 1 source start in 20 s of steady play. Exactly one
  start each for pause→play, 2×→1× and restart. At 2× the readout shows "muted at 2×".
- Drift is real and comes from the map, not the sync. zPerSecond = registerCruise 124 = the freighter's
  maxCruise. The ship's lag behind the song at the finish (perfect pilot): freighter 2.1 s, comet 22.7,
  fighter 60.4, phantom 78.0, interceptor 97.9. Live fighter at 21 s: song bar 11, ship bar 8 (−5.4 s).
- The song ends at 204.6 s. Slower ships fly the rest of the course in silence.
- vitest song-lab + tapper 15/15. Client tsc clean. biome and the comment ratchet pass.
- [unmeasured] Real speakers: the headless run used --mute-audio. The owner has not listened yet.
- Scratch Vite and Chrome were killed by PID. The owner's :5173/:2567 stack was not touched.

## Uncommitted

- none.

## Held files

`apps/client/app/routes/song-lab/**`, `apps/client/app/routes/tapper/**`, `apps/client/tapper/tapper-plugin.ts`,
the song-lab line in `apps/client/app/routes.ts`. workerone owns `apps/client/song-lab/**`.

## Next

1. Wait for the supervisor or owner feedback on the sound.
2. Candidates: a per-class zPerSecond option in the map (workerone's lane); an intensity strip per variant.

## Open questions

- Owner: should the song→distance map follow each class's cruise speed, not registerCruise? Today only the
  freighter lines up with the music.

## Lessons → memory

`.claude/memory/song-map-runs-at-freighter-speed.md`
