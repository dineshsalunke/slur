---
name: song-keeps-tempo-not-a-rhythm-game
description: "/song-lab audio keeps tempo from crossTick; never re-seek it to the ship after a bump — owner: \"we are not making a rythm game\""
metadata:
  node_type: memory
  type: project
  originSessionId: 32000e9a-49ae-4416-bab5-d1a6a3b9d092
  modified: 2026-09-24T18:31:28.044Z
---

The /song-lab song plays at its own tempo from the tick where the ship crosses `song.clock.z0`. It does not follow
the ship. A bumped ship falls behind, about 25 ms per bump (measured 2026-09-25: pro freighter, 8 bumps, −214 ms at
the finish), and the song leads.

**Why:** the owner said "we are not making a rythm game". The song only helps the owner see the moves against the music.

**How to apply:** never add a re-seek or re-anchor on bumps or deaths. Treat a human-run lead as expected, not as a
sync bug. Check sync only on perfect runs, where the live drift is ≤ 16 ms. Related: [[song-map-runs-at-freighter-speed]].
