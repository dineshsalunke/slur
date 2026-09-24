---
name: fractured-blocks-rarely-have-a-clear-lane
description: "At today's wall density most fractured blocks have another block right behind them; a post-hoc demotion rule costs ~76%"
metadata:
  node_type: memory
  type: project
  originSessionId: 5b01310f-b416-48d1-9545-3f558ecad7fb
  modified: 2026-09-24T09:48:57.082Z
---

On 2026-09-24 (#248) the fracture-shadow rule was measured on 30 procgen seeds. The rule: a block or floor gap within 55.8u behind a fractured block, padded 2u each side. It would seal 76% of fractured blocks (1656 → 392 on the #244 geometry). All blocking hazards start at or behind the rear face. Even a 14u zone costs 46%. The hull pad barely matters (1.3u vs 2u: 1 point).

**Why:** the noise wall generator places blocks densely and rolls the fracture per block. Nothing reserves space behind a fractured block. So a rule applied after generation removes most of them. The owner held the hook-up and moved the problem into the R4 score generator.

**How to apply:** do not propose a demotion or filter pass over the current generator without sweeping its cost first. Reserve the clear space when the block is placed (R4: SMASH carries its own rest). `sim/fracture-shadow.ts` (`b0a3977`) stays as a checker. Related: [[rate-clamp-is-not-flyability]].
