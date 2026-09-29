---
name: leva-onchange-fires-on-mount
description: "leva 0.10.1 calls a control's onChange once on mount (initial true) — startup side effects can live in onChange"
metadata:
  node_type: memory
  type: reference
  originSessionId: bfe28b4d-7c7e-41ba-a792-ecf82032901d
  modified: 2026-09-28T17:13:38.615Z
---

leva 0.10.1 `useControls` calls every `onChange` once when the panel mounts, with `{ initial: true }`
(`leva/dist/leva.esm.js` ~2276), then on each change. So a dial's `onChange` also covers the startup sync
of a restored value — no separate init hook is needed (the #351 accent dial relies on it to paint
`--color-marigold`). It also means `onChange` runs with leva's normalised value (hex may come back in a
different case), so compare colours case-insensitively.

Only on /test-level, where the tuning panel mounts. See [[tuning-over-cdp]].
