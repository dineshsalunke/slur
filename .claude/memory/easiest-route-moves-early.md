---
name: easiest-route-moves-early
description: "the pacing referencePath takes the least lateral travel and moves as early as walls allow; a one-sided wall forces only the clearance, not the step"
metadata:
  node_type: memory
  type: project
  originSessionId: 7d9dd2c2-b803-439e-b68a-8915d24affd4
  modified: 2026-09-24T13:09:05.252Z
---

`pacing/reference-path.ts` minimises lateral distance plus reversal and jump costs. On a tie, relaxation
keeps the first predecessor in the order `[0, -1, 1, …]`, so traced back from the end, the path takes a new
column as **early** as the walls allow. Two effects on generated geometry (measured 2026-09-24, R4 S3):

- A wall on one side forces only enough travel to clear it. With a ±5u tube and a 2u hull, a 4u step made
  the path move 1u.
- Slack ahead of a note gets used early. The path drifted 3u right after the previous gate. Both runs
  were under `NOTE_MIN_STEP_U` (3.4u), so the transcriber dropped the note (adherence 0.67–0.74).

**Why:** adherence and the transcribe round-trip measure this path, not a centred player.
**How to apply:** to force a note, pin the path at the note itself. Use a short preview wall just before
the onset on the move side and a gate behind, each at hull + 0.5u from the line. A pin makes an early drift
cost a reversal, so the path stays on the line. Related: [[rate-clamp-is-not-flyability]].
