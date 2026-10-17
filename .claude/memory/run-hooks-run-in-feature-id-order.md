---
name: run-hooks-run-in-feature-id-order
description: "Sim feature run hooks sort by feature id, so a newly moved feature can land between two others and change the tick order"
metadata:
  node_type: memory
  type: project
  originSessionId: 2dc20bc4-69a7-4c8c-a4fa-fda3d860d794
  modified: 2026-10-17T07:22:48.692Z
---

`sortFeatures` (`packages/shared/src/features/sim-hooks.ts`) orders every sim hook (`run.strike`, `run.tick`, the ship hooks) by feature id, alphabetically. A feature moved into the registry joins by its name, not at the spot its old code ran.

**Why:** in F4c (#403), mine on `run.strike` would have run bolt → mine → seeker. Today the tick runs bolt → seeker → mines. A mine could then pop a shield before a seeker hit, which is not bit-equal. The fix approved for this was a separate fixed hook, `run.settle`, called right after strike.

**How to apply:** before you put a moved feature on an existing hook, write out the sorted id order and compare it with the old call order in `stepCombat` / `step()`. When the order differs, use a fixed hook point, and prove the result with a per-tick hash A/B against HEAD. Related: [[feature-registry-import-cycle]].
