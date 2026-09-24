---
name: open-islands-can-wedge-a-ship
description: "Thin island blocks can form a corner pocket that traps a late ship forever, because no pilot reverses; a corridor wall cannot"
metadata:
  node_type: memory
  type: project
  originSessionId: d7cfaa3b-4b3f-4075-b8b2-e20a6fb487b9
  modified: 2026-09-24T17:53:40.637Z
---

When walls become thin islands (song-lab `open.ts`, #253), a ship that is late for a strafe can slide past a
4u gate post on the wrong side, then hit the next rail head-on. It is then wedged between the post (side) and
the rail (front). Bumps push it back less than 1u, strafing hits the post, and the lab pilots only throttle
forward. A rookie comet sat at z 2587 for the full 450 s with 1359 bumps.

**Why:** a corridor wall fills out to the track edge, so a late ship meets a front face in open space and
strafes free. An island leaves a gap beside it, and that gap can be a dead end.

**How to apply:** after any change that thins or breaks up blocks, scan the human runs for DNFs with a static
final z and a high bump count. The fix in `open.ts` widens the near gate post back across the previous
line's calm tube (`CALM_TUBE_HALF + |before − edge|`). The general rule: no island may leave a pocket that is
narrower than the ship and closed at the front. Related: [[escape-sweep-pilot-must-stop]],
[[measure-a-homing-rule-on-procgen]].
