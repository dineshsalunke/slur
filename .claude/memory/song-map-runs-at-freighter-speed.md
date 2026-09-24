---
name: song-map-runs-at-freighter-speed
description: "The song→distance map uses registerCruise 124 u/s, which only the freighter reaches; every other class falls behind the music"
metadata:
  node_type: memory
  type: project
  originSessionId: 17ed390a-6e30-4eaf-ac48-05a96c61a360
  modified: 2026-09-24T17:26:07.082Z
---

`apps/client/song-lab/map.ts` `songClock` sets `zPerSecond = TRACK_CONTRACT.registerCruise` (124). Only the
freighter has `maxCruise: 124`. The others are 84–112. With the song on the sim clock (/song-lab, ab88019), the ship
falls behind the music all race.

Measured from believer-s1.json finish times (song ends at 204.6 s): perfect freighter finishes 2.1 s after the song,
comet 22.7 s, fighter 60.4 s, phantom 78.0 s, interceptor 97.9 s. Rookies are 100–195 s behind.

**Why:** a note placed at song time t sits at z = zAt(t), so it lines up only for a ship that flies at 124 u/s.
**How to apply:** any "does the track feel like the song" judgement holds only for the freighter until the map or
the class speeds change. Read the readout's "song bar · ship bar" line, not the audio alone.
