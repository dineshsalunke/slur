Agent: workerone · Lane: #253 song lab — song sync to the freighter · Updated: 2026-09-24 23:45

Older versions of this file hold earlier #253 and #250 history (`git log -p -- .claude/handovers/workerone.md`).

## Goal

- Owner: sync the song to the freighter only. The song starts when the ship reaches cruise, not at GO. Other
  classes are out of scope. No per-class maps. No physics change.

## Done

- `bcbc3d5` Groove, groove-tight, groove-open variants; open emitter; tap-jump pilot mode.
- `61063be` `songClock`: t0 = 0, z0 = `cruiseZ(freighter)` = 257.3, zPerSecond 124. `LabSong.clock`
  `{ z0, t0, zPerSecond }` in the bundle. Placement starts at `gridStart(c)` = 260 (next 20u line).
  New test: the recorded freighter reaches cruise at exactly `clock.z0`.

## State

- The freighter reaches 124 u/s at tick 248 (4.1333 s), z 257.3. It is the same on all 13 variants (replayed).
- Bundle `apps/client/.songs/lab/believer-s1.json` rebuilt (ignored file): 13 variants, 65 perfect +
  195 human runs, all 5 classes. 260/260 replay the same, 13/13 digests match. Build takes 14 s.
- Drift on the perfect freighter, ship bar minus song bar: 0.000 beats at bars 8, 28, 60, 96, at the finish, and at
  the maximum over the run, on every variant. The audio starts at the fractional tick where the ship crosses z0.
- The probe sees real drift in human freighter runs (bumps slow the ship). Pro: groove −5.0 beats by bar 96,
  envelope −0.45. Rookie: −350 to −520 beats at the finish.
- The freighter finishes at 208.7 s; the song is 204.4 s long.
- Tests: song-lab 7/7 + route 10/10. Client tsc clean, biome clean, comment ratchet passes.
- Probe scripts are in the session scratchpad: `drift.ts` and `replay.ts` (not in the repo).

## Uncommitted

- None.

## Held files

- `apps/client/song-lab/**` · `packages/shared/src/sim/score/*` · the pacing/score lines in shared `index.ts`.

## Next

1. workerfour does the live drift check in the viewer (it starts audio at song.clock.z0).
2. Owner review of the freighter sync. If it is good: plan the other classes (out of scope now).

## Open questions

- Owner: keep the register gap (groove) or the backbeat grid (groove-tight)?
- Owner: is the Believer curve lateral (built) or height (ramp, then drop)?
- Human runs drift behind the song on every bump. Should the viewer re-sync the audio to the ship, or keep a
  fixed clock? [inferred issue, not asked yet]

## Lessons → memory

- none (the CLI writes `<analysis-basename>-s<seed>.json` unless you pass `--name believer-s1`; the handover
  records it).
