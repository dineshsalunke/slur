---
name: song-tracks-are-a-throwaway-experiment
description: "The #253 song/tapper work is a disposable experiment; only a distilled generator survives if the theory works"
metadata:
  node_type: memory
  type: project
  originSessionId: ae3e81c7-4a75-4a73-b692-4950c0c58040
  modified: 2026-09-24T18:21:01.054Z
---

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
