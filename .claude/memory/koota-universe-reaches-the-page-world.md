---
name: koota-universe-reaches-the-page-world
description: "Over CDP, koota's exported `universe.worlds` gives the page's live ECS world (client render/prediction only; game state lives on the room)"
metadata:
  node_type: memory
  type: reference
  originSessionId: b0f5f26f-a904-449c-ae79-bfcb620951e7
  modified: 2026-09-26T14:41:17.006Z
---

To read the client ECS in a driven tab, import koota by the **exact** URL the page loaded
(`/node_modules/.vite/deps/koota.js?v=<hash>`, from `performance.getEntriesByType('resource')`) and take
`universe.worlds.find(w => w && w.queryFirst(LocalPlayer, Sim))`. The world lives in React context, so
there is no other handle to it from outside.

**The resource list is capped at 250 entries** (verified 2026-09-25, #264). Vite dev loads more modules
than that, so the traits URL can be missing, or only a stale `?t=` copy can be there. Set
`performance.setResourceTimingBufferSize(10000)` in an init script before the load, then take the
**last** `ecs/traits.ts` entry.

**Since #288 slice 4 the ECS is read-mostly.** `/test-level` runs on a loopback room, so writes to
`Sim`, `Held` or `localCombat` (deleted) are overwritten by the next server patch. To move the ship or
stage a power, write the room's server state: [[place-the-ship-over-cdp]],
[[stage-a-mine-on-test-level]]. Use the ECS only to read predicted/render state.

**How to apply:** same exact-URL rule as [[drive-the-live-module-not-a-reload]] and
[[cdp-import-of-tuning-hits-an-hmr-orphan]]. Use headless Chrome ([[headless-chrome-for-frame-taps]])
and kill it after.
