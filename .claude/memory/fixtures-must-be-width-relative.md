---
name: fixtures-must-be-width-relative
description: Test fixtures with hand-typed ±32 deck edges pass silently at another width; write them as HALF_WIDTH ± n
metadata:
  node_type: memory
  type: feedback
  originSessionId: fa79a9b2-55c2-40c5-827b-da1c3bdd0409
  modified: 2026-09-25T03:45:22.701Z
---

At `HALF_WIDTH = 40` (#257 trial), 7 shared tests failed on hand-typed x values: a wall ending at 32 (the old
edge) left an 8u slot, and block edges at 20/26/28/29 widened every measured run. Two more
(`route-graph.test.ts`, ±32 walls and floors) still passed but tested a different track.

**Why:** a literal edge silently stops touching the rail when the width moves. The test still runs and
checks the wrong thing.

**How to apply:** write deck-relative x as `HALF_WIDTH - n` or `-HALF_WIDTH`. Keep fixtures that depend on
one seed's geometry (the pocket fixture) to a minimum; they must be re-found after any width change.
Weave amplitude is `LANES`, so a width change also reshapes every weave seed (`track-contract.test.ts`).
Related: [[measure-a-homing-rule-on-procgen]], [[fractional-strafe-pilots-trip-strafe-kick]].
