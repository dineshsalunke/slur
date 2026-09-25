---
name: aim-tests-need-a-clear-approach
description: "A room test that aims at \"the first block of kind X\" fails on seeds where another block butts onto it; check the approach lane"
metadata:
  node_type: memory
  type: project
  originSessionId: b9eadd13-fe42-4564-88a4-cb221a0792dd
  modified: 2026-09-25T12:42:14.804Z
---

On 2026-09-25 (#262) the "a bolt breaks a fractured block" flake (about 1 in 12) was traced with a seeded
`Math.random` preload (`node --import seed.mjs --test …`) over the whole run-room test file. On weave seed
1828783983 the first fractured block butted onto a sealed block that ended at its z0. The ship was placed at
z0 − 5, which is inside the sealed block. The bolt hit the sealed block first. A second hidden assumption was
that the first pickup is always a bolt. That held only because the ids were fixed.

**Why:** the seed is random per room, so a test that relies on one track shape fails on a small share of
seeds, and a name-filtered single-test run does not reproduce it because the Math.random call count differs.

**How to apply:** when a test places a ship relative to generated geometry, pick a target whose approach
lane is clear (`approachClear` in `run-room.test.ts`). Derive expected powers from `pickupPower(id)`.
Reproduce a room flake by seeding Math.random and running the WHOLE file. Related:
[[fixtures-must-be-width-relative]].
