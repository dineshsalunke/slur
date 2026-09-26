---
name: short-bolts-skip-the-patch
description: a bolt (900 u/s) that hits within ~45 u lives less than one 50 ms patch and never reaches decoded client state
metadata:
  node_type: memory
  type: project
  originSessionId: 66dbe386-268d-46c7-b5ce-1c9e9159f8e5
  modified: 2026-09-26T14:27:43.583Z
---

A bolt flies at `BOLT_SPEED` 900 u/s and the room patches every 50 ms. A target 20 u ahead is hit in
~22 ms, so the bolt is added and removed inside one patch. The client decoder never sees it; only the
HIT message arrives.

**Why:** #288 slice 3b — the loopback-room test saw zero projectile onAdd at 20 u; at 120 u it saw one.
Server-side tests read `room.state` directly and do not show this.
**How to apply:** a test that asserts a decoded projectile must place the target ≥ ~60 u away. A client
effect that needs the bolt entity for a close hit must key off the HIT message, not the projectile.
Related: [[node-bot-as-second-racer]].
