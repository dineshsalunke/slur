---
name: song-tracks
description: "The #253 song/tapper work is a disposable experiment (owner: not a rhythm game); the song keeps its own tempo and never re-seeks, the song→distance map only matches freighter speed, and Believer's drums sit on a triplet grid"
metadata:
  node_type: memory
  type: project
  originSessionId: ae3e81c7-4a75-4a73-b692-4950c0c58040
  modified: 2026-09-29T04:04:25.697Z
---

### Song tracks are a throwaway experiment

The song-shaped-track work (#253, started 2026-09-24: beat analysis, /tapper, song lane in /pacing) is an
experiment to test a theory about level building. It is not a feature.

- If the theory fails, delete all of it and explore other ideas.
- If it works, distil the result into a track generator that gives the same feeling (for example motifs
  and intensity bands in `sim/score/`), then delete the song tooling.

**Why:** the owner said so (2026-09-24). The song is only a lens for finding how strafing and jumping
should feel across a track's progression. It is not a rhythm game.

**How to apply:** build the tooling cheap and isolated: its own folders, dev-only, no changes to the
room contract or the sim, no ADR. It must be removable by deleting its folders plus a few one-line
hooks. Never let the rest of the code depend on it.

The owner watches the PERFECT pilot to see and feel the moves against the music. Human-pilot drift from the
song (bumps, braking) is not a problem to solve. Never propose re-syncing the audio, scoring timing, or other
rhythm-game mechanics (owner, 2026-09-25: "we are not making a rythm game"). Related: [[owner-may-waive-issue-filing]].

### Song keeps tempo, not a rhythm game

The /song-lab song plays at its own tempo from the tick where the ship crosses `song.clock.z0`. It does not follow
the ship. A bumped ship falls behind, about 25 ms per bump (measured 2026-09-25: pro freighter, 8 bumps, −214 ms at
the finish), and the song leads.

**Why:** the owner said "we are not making a rythm game". The song only helps the owner see the moves against the music.

**How to apply:** never add a re-seek or re-anchor on bumps or deaths. Treat a human-run lead as expected, not as a
sync bug. Check sync only on perfect runs, where the live drift is ≤ 16 ms.

### Song map runs at freighter speed

`apps/client/song-lab/map.ts` `songClock` sets `zPerSecond = TRACK_CONTRACT.registerCruise` (124). Only the
freighter has `maxCruise: 124`. The others are 84–112. With the song on the sim clock (/song-lab, ab88019), the ship
falls behind the music all race.

Measured from believer-s1.json finish times (song ends at 204.6 s): perfect freighter finishes 2.1 s after the song,
comet 22.7 s, fighter 60.4 s, phantom 78.0 s, interceptor 97.9 s. Rookies are 100–195 s behind.

**Why:** a note placed at song time t sits at z = zAt(t), so it lines up only for a ship that flies at 124 u/s.
**How to apply:** any "does the track feel like the song" judgement holds only for the freighter until the map or
the class speeds change. Read the readout's "song bar · ship bar" line, not the audio alone.

### Believer is on a triplet grid

Believer (`apps/client/.songs/`, #253) has a triplet feel. Its snare onsets land on thirds of a beat:
86% on a triplet-8th grid (random is 37.5%), but only 60% on a straight-16th grid (random is 50%).
Measured 2026-09-24 with `drum-onsets.ts`.

**Why:** a first grid check on 16ths made good detections look like noise and nearly sent the tuning
the wrong way.

**How to apply:** when you judge onset quality or quantise `inBar` for a song, test both grids
(quarters and thirds of a beat) before you call a stream noisy. Other things measured on Believer:
- The kick band (40–130 Hz) also catches bass. Only ~50% of kick onsets are on the triplet grid, but
  74% of those with `strength >= 0.5` are.
- Kick onsets land about +15–19 ms late against the grid. Snare and hats land at 0 ms.
- The beat tracker's intervals drift 0.418–0.534 s around a mean of 0.480 s.
- `barPhase` puts the downbeat on the loudest beat. On a synthetic kit that is the snare, so the kick
  reads `inBar` 1 and 3, not 0 and 2.
