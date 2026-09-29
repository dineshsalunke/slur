---
name: node-bots
description: "A remote-player check needs only one headless Chrome plus a node @colyseus/sdk client as the second racer, since a second Chrome doubles GPU load; but two SDK clients in one node process share the event loop, so a busy-wait stall in one contaminates the other"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d5260a53-9e7d-4a83-98c9-96e308861cf9
  modified: 2026-09-29T04:08:06.805Z
---

### Node bot as second racer

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
logpoint ([[headless-game-tabs-starve-the-gpu]]). To prove an instanced VFX drew, wrap
`three.Object3D.prototype.onBeforeRender` and match the mesh by a unique geometry attribute.

**Why:** a second Chrome doubles the GPU load on the owner's machine ([[headless-game-tabs-starve-the-gpu]]).
A node client uses none.

**How to apply:** the remote ship is often out of frame, so assert on data (Interp field, instance count),
not on a still.

### Node bots share one event loop

Two `@colyseus/sdk` clients in one node script share one event loop. A busy-wait injected into one
client stalls the other as well, so the "steady" control client shows the same spike.

**Why:** the #273 re-measure (2026-09-26) reported that the host "held 0–4 throughout". The host
actually peaked at 18 in the stall second, and the issue needed a correction comment.

**How to apply:** for a clean control, run the stalled client in its own process (spawn it), or
read the control's stall second as contaminated.
