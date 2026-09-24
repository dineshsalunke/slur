---
name: score-pilot-must-not-lead-the-note
description: A pilot flying an emitted score track must not strafe before the note onset; the preview pin holds the line
metadata:
  node_type: memory
  type: project
  originSessionId: 1f6de622-adb2-4038-848a-1dfa1cbbf05f
  modified: 2026-09-24T14:41:22.860Z
---

On an emitted score track (`sim/score/emit.ts`), the last `SCORE_PIN_Z` (4u) of a calm before a lateral note is
a **preview** span. Its near side sits `SCORE_PIN_HALF` from the old line. A pilot that looks ahead and starts
the strafe early clips that pin. Measured 2026-09-24 (#253 song lab): a 0.15 s look-ahead gave the freighter
73 bumps on one track. Zero look-ahead (target = the line of the span under the ship's centre) gave 0 bumps
for all 5 classes on 10 tracks.

**Why:** the pin is by design. It holds the ship on its line until the onset, so the move reads as a note.

**How to apply:** any bot, pilot or test that flies a score track steers to `span.line` at `ship.z`, with no
lead. For jumps, pick the takeoff by forward simulation (`apps/client/song-lab/pilot.ts`), not by a fixed
lead. Related: [[escape-sweep-pilot-must-stop]], [[song-tracks-are-a-throwaway-experiment]].
