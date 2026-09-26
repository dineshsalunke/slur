---
name: node-bots-share-one-event-loop
description: Two SDK clients in one node process share the event loop; a busy-wait stall in one stalls the other too
metadata:
  node_type: memory
  type: feedback
  originSessionId: b5612842-847b-42a6-b327-ed53d6fdaab1
  modified: 2026-09-26T07:50:20.081Z
---

Two `@colyseus/sdk` clients in one node script share one event loop. A busy-wait injected into one
client stalls the other as well, so the "steady" control client shows the same spike.

**Why:** the #273 re-measure (2026-09-26) reported that the host "held 0–4 throughout". The host
actually peaked at 18 in the stall second, and the issue needed a correction comment.

**How to apply:** for a clean control, run the stalled client in its own process (spawn it), or
read the control's stall second as contaminated. Related: [[node-bot-as-second-racer]].
