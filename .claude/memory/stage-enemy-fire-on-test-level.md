---
name: stage-enemy-fire-on-test-level
description: "Fake an enemy bolt or seeker on /test-level: fire your own, then rewrite ownerId (and targetId) on room.sim.state every rAF and pin its z to the ship"
metadata:
  node_type: memory
  type: reference
  originSessionId: ea3ec010-c0af-49d6-9976-6b85feb7e4f1
  modified: 2026-09-29T06:24:11.467Z
---

/test-level has only you, and the threat HUDs ignore your own shots. To stage enemy fire without a repo
edit (verified 2026-09-29, #373):

1. Put powers in the server slots: `s.slots[0] = 1` (bolt), `s.slots[1] = 2` (seeker). See
   [[place-the-ship-over-cdp]] for reaching `room.sim.state`.
2. Fire with keys: `KeyD` fires back, `KeyF` moves to the next slot, `KeyE` fires.
3. In a `requestAnimationFrame` loop, rewrite each projectile (`ownerId = 'enemy'`, `z = s.z - 30`,
   `x = s.x + 4`, `ttl = 5`). Rewrite each seeker too (`ownerId = 'enemy'`, `targetId = me`, `ttl = 5`).
   For a seeker behind you, set `dir = 1` and `z = s.z - 60`. For one ahead, set `dir = -1` and `z = s.z + 60`.

The pinning loop keeps the shot from hitting you or expiring, so the HUD stays up for a screenshot.
The seeker chevron blinks, so read its `opacity` before you trust a single screenshot.
The Playwright driver is `threat-check.mjs` in the #373 session scratchpad.
Related: [[stage-a-mine-on-test-level]], [[headless-game-tabs-starve-the-gpu]].
