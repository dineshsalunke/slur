---
name: place-the-ship-over-cdp
description: "To look at a specific block on /test-level, import the live koota world over CDP and write the ship's Sim x/z — no flying, no aiming"
metadata:
  node_type: memory
  type: reference
  originSessionId: 3d988b1b-080e-4846-ab16-4f25afcbebee
  modified: 2026-09-23T15:04:49.394Z
---

On a **freshly loaded** `/test-level` tab (no HMR yet), this reaches the page's own ECS and moves the
ship (verified 2026-09-23, #222):

```
const w = await import('/app/game/ecs/world.ts');
const t = await import('/app/game/ecs/traits.ts');
const e = w.world.queryFirst(t.LocalPlayer, t.Sim);
const s = e.get(t.Sim); s.x = X; s.z = Z; s.vz = 0;
const p = e.get(t.Prev); p.x = X; p.z = Z;
```

Then wait about 3s for the chase camera to settle, send `KeyP` to freeze, and screenshot the tab over
CDP.

**Finding the target:** the track is deterministic. Resolve it in node from
`packages/shared/dist/index.js` with the descriptor in `routes/test-level/test-level-canvas.tsx`
(seed 20260921, length 420, blockDensity 0.6, gapChance 1). The first fractured block is id 3392,
x −29.8…−25.3, z 1064.2…1068. That track has 37 fractured and 256 sealed blocks.

**To trigger a break on purpose:** `(await import('/app/game/block-state.ts')).blockWorld.broken.add(id)`
on a block that is in view. That is untested as of #222.

**Why:** flying into a chosen block by input is not repeatable ([[freeze-the-sim-to-ab-a-light]]),
and aiming a smash is harder still. The HMR caveat in [[cdp-import-of-tuning-hits-an-hmr-orphan]]
applies here too: reload before you import.
