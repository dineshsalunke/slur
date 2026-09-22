---
name: shared-tunables-storage
description: "The tuning panel's localStorage is shared between the owner's window and the extension tab — agree who drives before A/B testing"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e5d74fce-6c51-496f-8050-309f116acb94
  modified: 2026-09-22T08:41:22.859Z
---

`localStorage['slur.tunables']` is one store shared by the owner's browser window and the
Claude-driven extension tab. During a re-dial both sides were writing it: `tone.exposure` moved from
1 to 3 under the agent mid-A/B, and the chain had to be restarted.

**Why:** an A/B is only readable if exactly one hand is on the knobs. A value that changes for an
unseen reason gets attributed to the change under test, and the conclusion is wrong.

**How to apply:** before starting A/Bs, ask who drives and say it out loud. Read the store rather
than trusting an in-memory value, announce each write, and restore anything touched that wasn't the
subject of the test. `reset` is not an undo — it restores every key to spec default and has already
destroyed a full set of hand-dialled numbers once. Land dialled values into `NUMBER_SPECS`, or at
minimum write them into a phase note, before any session that might reset.

Related: [[leave-the-browser-tab-open]], [[browser-extension-throttles-fps]].
