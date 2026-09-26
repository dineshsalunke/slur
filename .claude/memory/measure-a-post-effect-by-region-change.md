---
name: measure-a-post-effect-by-region-change
description: A post effect that looks fine in one still can be invisible in play; measure % of pixels changed per region vs an off frame and a noise frame
metadata:
  node_type: memory
  type: feedback
  originSessionId: b9fd2a7a-358f-40cd-89ff-0c34c287de70
  modified: 2026-09-26T13:38:44.815Z
---

The #269 boost blur passed review from a single still (sky corners streaked), and the owner then
reported it was invisible in play. It was live at full strength but changed only 1.5% of deck pixels by
more than 8 luma. The deck is where the eye sits, and the sky change barely beat asteroid-drift noise.

**Why:** a still invites you to look where the effect is strongest. The owner looks at the deck and
the ship.

**How to apply:** freeze at the effect's peak (KeyP), then swap the effect's `defines` on the live
EffectPass (`blur.defines.set(...)`, `setChanged()`, `pass.recompile()`). Capture an off frame, a
second off frame (noise floor), and each variant. Report % of pixels changed by more than 8 luma per
region (sky, deck centre, deck edge). Driver: the #269 fix session's scratch `blur-ab.mjs`. Related:
[[time-a-post-effect-without-repo-edits]], [[freeze-does-not-stop-asteroid-drift]].
