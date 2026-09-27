---
name: procgen-seed-zero-reads-as-unset
description: "A procgen descriptor with seed 0 counts as \"no descriptor\" in the schema; seeds must be >= 1"
metadata:
  node_type: memory
  type: project
  originSessionId: 0731d296-cde4-4ce9-9ea2-d7864f331606
  modified: 2026-09-27T14:42:09.344Z
---

`packages/shared/src/schema.ts` treats a procgen descriptor as present only when `state.seed !== 0`
(uint32 field). A seed of 0 reads as "no track", so any seed input or random roll must produce 1..2^31-1.

**Why:** found while adding the editor seed field (#321, 4012255); `seedOf`/`randomSeed` in
`test-level-canvas.utils.ts` clamp to >= 1 for this reason.

**How to apply:** when you add a new seed source (URL param, lobby option, roll), reject 0.
Related: [[phrase-length-is-per-seed]].
