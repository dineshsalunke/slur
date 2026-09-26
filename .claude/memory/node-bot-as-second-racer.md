---
name: node-bot-as-second-racer
description: "A remote-player check needs only one headless Chrome: a node @colyseus/sdk client joins by room id as the second racer"
metadata:
  node_type: memory
  type: reference
  originSessionId: d5260a53-9e7d-4a83-98c9-96e308861cf9
  modified: 2026-09-26T07:02:38.850Z
---

For a check that needs a **remote** racer (remote VFX, interp fields, sfx from another player), make the
second racer a node script, not a second Chrome. Verified 2026-09-26 (#269).

- Import `Client` from `apps/server/node_modules/@colyseus/sdk/build/index.mjs` and shared from
  `packages/shared/dist/index.js`, both by absolute path. `joinById(roomId, { name })` before the host
  sends `START_MESSAGE`, because the field locks at GO. Reflection decoding needs no schema import.
- Track: `resolveTrack(toDescriptor(room.state.descriptor))` after `descriptorReady`.
- Each 1/60 s tick: send `INPUT_MESSAGE` `{ inputs: [{ seq, throttle: 1, brake: 0, strafe, jump }] }`, steer
  to the next untaken pickup, jump when `segmentAtZ(z+12).floors` has no span under x, drop unwanted
  powers with `DROP_POWERUP_MESSAGE` so slots refill. The bot reached z 1900 and fired two boosts in 20 s.
- Warning `onMessage() not registered for type 'bounce'` on stderr is harmless.

The host tab gets the room from `session.ts` over CDP ([[drive-a-hosted-room-over-cdp]]). Count sfx with a
logpoint ([[two-client-check-needs-two-chromes]]). To prove an instanced VFX drew, wrap
`three.Object3D.prototype.onBeforeRender` and match the mesh by a unique geometry attribute.

**Why:** a second Chrome doubles the GPU load on the owner's machine ([[headless-game-tabs-starve-the-gpu]]).
A node client uses none.

**How to apply:** the remote ship is often out of frame, so assert on data (Interp field, instance count),
not on a still.
