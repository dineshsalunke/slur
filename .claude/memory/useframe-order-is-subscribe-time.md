---
name: useframe-order-is-subscribe-time
description: "Equal-priority useFrame callbacks run in subscribe (layout-effect) order, not JSX order; late mounts go to the end"
metadata:
  node_type: memory
  type: reference
  originSessionId: 0d3fc7eb-5258-41c5-9fdb-fa023637930f
  modified: 2026-09-28T16:59:42.024Z
---

R3F 9.7 subscribes a `useFrame` in a layout effect (`events-*.esm.js:1229`) and stable-sorts by priority
(`:1129`). So at equal priority the order is the time the component mounted. A component that mounts
later — a ship view that spawns after the loop, a `QualityGate` that remounts on step-down — runs at the
END of its priority band, even if its JSX sits before the writer.

**Why:** reading "Ships is before NetLoop in world-scene.tsx, so ships read stale Render" was wrong for
ships that spawn later. JSX position proves nothing about frame order.

**How to apply:** to reason about a same-frame read/write, check mount time, not JSX order. To force an
order, use distinct priorities (RFC-349 §5 proposes named phases). Related: [[removing-the-composer-blacks-the-canvas]].
