---
name: believer-is-on-a-triplet-grid
description: "Believer's drums sit on triplet subdivisions, so a straight-16th grid check reads real onsets as random; test against thirds of a beat too"
metadata:
  node_type: memory
  type: project
  originSessionId: 7abca49e-ba89-4b9b-ba86-175c488c871d
  modified: 2026-09-24T14:38:39.158Z
---

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

Related: [[song-tracks-are-a-throwaway-experiment]].
