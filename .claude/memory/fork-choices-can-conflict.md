---
name: fork-choices-can-conflict
description: "A route-graph fork's split node is not a dominator; per-fork arm choices can be mutually unreachable, so force routes with a soft bar"
metadata:
  node_type: memory
  type: project
  originSessionId: e85beb10-2fa6-45e5-be78-aeeb240f3ad2
  modified: 2026-09-24T07:47:41.595Z
---

In `packages/shared/src/pacing/route-graph.ts` a fork is split node → post-dominator merge. The merge
post-dominates, but the split does **not** dominate: another corridor can join an arm mid-fork, or
bypass the fork entirely (`armOf` returns -1 on seed 42). So choosing one arm per fork independently
can give a combination no single route can fly. Seed 20260921: 2 of 19 hardest-arm picks conflict.

**Why:** a hard mask (barred = 1e6, above `PATH_STUCK_COST`) made the Viterbi fly through a wall
rather than a barred cell — 23 "stuck" samples that were really choice conflicts.

**How to apply:** force a route with `PATH_BARRED_COST` below `PATH_STUCK_COST` (1000 vs 10 000), and
report `barred` apart from `stuck`. Read a route's arm per fork from the path (`choice`), never from
the per-fork pick. Related: [[measure-a-homing-rule-on-procgen]].
