---
name: measure-frame-order-over-cdp
description: "Measure useFrame order and one-frame camera lag with no repo edit: take fiber._roots, wrap each internal.subscribers[i].ref, compare camera seen vs after the frame"
metadata:
  node_type: memory
  type: reference
  originSessionId: d751d1d5-a677-4404-9e35-1a15c7111ff8
  modified: 2026-09-29T10:32:53.110Z
---

To see the live `useFrame` order and which callbacks read a stale camera (#379, 2026-09-29):

- In Playwright, import the page's `/node_modules/.vite/deps/@react-three_fiber.js` URL (from
  `performance.getEntriesByType('resource')`, with the buffer raised in an init script).
- `[...fiber._roots.values()][0].store.getState().internal.subscribers` is the sorted list R3F runs.
  Each entry is `{ ref, priority, store }`.
- Replace each entry's `ref` via `Object.defineProperty` with a getter object whose `current` returns a
  wrapper around the live `inner.current`. This survives re-renders, because R3F writes the original ref.
  Re-wrap in `fiber.addEffect` each frame to catch late mounts (ship views).
- Label a callback by `String(fn).includes(<unique token>)`, for example `updateNetCamera` for NetLoop.
  Dev sources are not minified.
- In `fiber.addAfterEffect`, compare the camera each callback saw with the final camera.

**Why:** it gave the #379 before/after numbers (9 readers 1.96 u stale → 0) with no repo edit.

**How to apply:** script `lag-probe.mjs` is in the #379 session scratchpad. Run it headless at DPR 1
and close the browser ([[headless-game-tabs-starve-the-gpu]]). Related:
[[useframe-order-is-subscribe-time]].
