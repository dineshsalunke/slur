---
name: weave-pilot-must-use-the-run-up
description: A band pilot that aims at a lane only at the weave face bumps the flat face; aim from z0 − weaveRunUp
metadata:
  type: project
---

Since #327 (`7d52b75`) a weave has no funnel. Its lane walls start as one flat face at `z0`. The fair
entry is the open run-up before the face, `weaveRunUp(spec)` (from `simulate()`, edge of deck to the
nearest lane centre, max over classes).

A test pilot that starts steering to a lane only when its nose reaches `z0` hits the face or the
parallel divider: 3 bumps on phrase seeds 1–30 before the fix. `weaveTarget` in `weave.test.ts` now
returns the nearest lane centre from `z0 − weaveRunUp` on. Use it, or do the same, in any new weave pilot.

**Why:** the old funnel steered the ship into the lane for it, so an entry at the face was enough. A flat
face does not.

**How to apply:** when you count weave bumps, check the pilot steers during the run-up before you
blame the geometry. See [[obstacle-spacing-from-ship-physics]], [[measure-a-homing-rule-on-procgen]].
