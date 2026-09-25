---
name: koota-universe-reaches-the-page-world
description: "Over CDP, koota's exported `universe.worlds` gives the page's live ECS world; inject combat objects into module maps to stage a still"
metadata:
  node_type: memory
  type: reference
  originSessionId: 879e0b3a-18a7-40b8-9b86-032f9600de1e
  modified: 2026-09-25T13:26:48.938Z
---

To read or move the ship in a driven `/test-level` tab, import koota by the **exact** URL the page
loaded (`/node_modules/.vite/deps/koota.js?v=<hash>`, from `performance.getEntriesByType('resource')`)
and take `universe.worlds.find(w => w && w.queryFirst(LocalPlayer, Sim))`. The world lives in React
context, so there is no other handle to it from outside.

**The resource list is capped at 250 entries** (verified 2026-09-25, #264). Vite dev loads more modules
than that, so the traits URL can be missing, or only a stale `?t=` copy can be there. Then the query
finds no ship, with no error. Before the reload, send
`Page.addScriptToEvaluateOnNewDocument({source:'performance.setResourceTimingBufferSize(10000)'})`, then
take the **last** `ecs/traits.ts` entry.

To stage a seeker (or any local combat object) for a still: freeze with KeyP, then write entries
straight into `localCombat.seekers` and move them from an in-page `requestAnimationFrame` loop. The
render fields read those maps in their own `useFrame`, which still runs while the sim is frozen.

**Why:** a solo `/test-level` has no lock target, so a real seeker cannot be fired at a chosen pose.
Staging gave nose-on, side and going-away views in one session (2026-09-23, #219).

**How to apply:** same exact-URL rule as [[drive-the-live-module-not-a-reload]] and
[[cdp-import-of-tuning-hits-an-hmr-orphan]]; teleport the ship by setting `Sim` and `Prev`, unfreezing
~0.9s, re-freezing ([[freeze-the-sim-to-ab-a-light]]). Use a private port + headless Chrome
([[headless-chrome-for-frame-taps]]) and kill both after.
