---
name: ab-bench-needs-a-negative-control
description: "A bit-equal A/B hash bench must be shown to fail on a known reorder before its \"identical\" counts"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 9a159aac-be56-424a-9650-fa76ee0cbafc
  modified: 2026-10-17T08:48:27.727Z
---

Before trusting an A/B bench that says "identical", break the new build on purpose (e.g. edit the copied
dist to wire a hook in the wrong slot) and confirm the hashes diverge. Also check which fields `toJSON()`
emits: non-`@type` fields (`shieldTimer`, `bestZ`) are missing and must be hashed by a plain read.

**Why:** F4c (#403) — the "seeker + mine + shield in one tick" case fired only twice in 6 seeds; without
the control the bench could have been blind to the very order rule the move had to keep.

F4e (#405): moving the shield step from first-in-combat to `run.strike` did NOT diverge with full 5 s
shields (244 pops, 0 diffs) — a hit must land on the exact expiry tick. Seeding many short shields
(`shieldTimer = r() * 0.08`, 3% per player per tick) made it diverge on 4 of 6 seeds. If the control
passes, densify the boundary event; don't accept the bench.

**How to apply:** every feature-move A/B (F-stages). Edit only the scratch dist copy, never source.
Related: [[run-hooks-run-in-feature-id-order]], [[ab-an-old-sim-from-git-in-scratch]].
