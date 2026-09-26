---
name: doors-cannot-force-a-one-cell-step
description: "Two MIN_LANE doors 4u apart share a lane for the 4u pacing hull; force small steps with one-sided pins, and check adherence on a wide deck"
metadata:
  node_type: memory
  type: project
  originSessionId: 1f63abaa-38ab-451f-a0fb-9a5dfe46f57d
  modified: 2026-09-26T19:02:03.073Z
---

A post or door the width of `MIN_LANE` (8u) cannot force a 1-cell (4u) lateral note. The pacing hull
is 4u wide (`PACING_HULL` 2), so the centre has 4u of play in each door, and doors 4u apart overlap.
The easiest route flies straight through with no move (the minimum counted step is 3.4u).

On the 96u deck, small posts and 16u holes force nothing: the route held x = 22.5 past them all.
Adherence read 0.000 (#300 S2, 2026-09-27).

**Why:** `referencePath` takes the least travel, so any geometry it can go round is ignored.

**How to apply:** force a lateral note with one-sided pins, as in `SCORE_PIN_HALF` (2.5u) from the
line: a wall on the move side before the onset, and a wall on the far side after the move. Force a
jump with a hole across the full deck width. Measure `scoreAdherence` before you claim a motif "reads".
Related: [[easiest-route-moves-early]], [[rate-clamp-is-not-flyability]].
