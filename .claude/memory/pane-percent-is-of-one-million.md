---
name: pane-percent-is-of-one-million
description: "A herdr pane's context bar is a share of the 1M window; 15% is already the 150k watchdog warning"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e2e3d006-c441-4501-9527-05a1625702e0
  modified: 2026-09-23T18:18:42.718Z
---

The context bar in a worker's herdr pane status line counts against the **1M** window. The context
watchdog warns at **150k**, which is **15%** on that bar, and hard-stops at 250k (25%).

**Why:** on 2026-09-23 the supervisor read workertwo at "16%" as idle with room to spare and gave it the
sky-review lane. workertwo was already past the warning, took no new work and seamed. The lane lost a
clear/resume cycle.

**How to apply:** before giving a lane to a worker, read its bar. **Under 10%** is fit for a real lane.
**10–15%** is fit for a small task only. **15% or more** means clear it first: ask for a seam, then
`/clear` and resume ([[supervisor-clears-workers-via-herdr]]).
