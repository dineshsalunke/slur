---
name: leave-the-browser-tab-open
description: Never close the Chrome tab after a browser-automation pass in this project; reuse it
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 312174a7-856e-4c22-a987-2649e1bf59c0
  modified: 2026-09-21T19:40:40.074Z
---

Do not call `tabs_close_mcp` when finished with a browser task here. Reuse the existing
`/test-level` tab across passes instead of creating a new one.

**Why:** each tab Claude creates is the only tab in its window, so closing it closes the window and
Chrome reads as having quit. The owner is watching the same page, and reopening costs them more than
a stray tab costs anyone. Observed twice on 2026-09-22 — both closes reported "Group is now empty
(auto-removed)".

**How to apply:** at the start of a browser pass call `tabs_context_mcp` and navigate an existing
tab; leave it open at the end. The generic browser-tool guidance to clean up self-created tabs is
overridden for this project.
