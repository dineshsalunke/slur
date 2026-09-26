---
name: simulate-a-room-drop-over-cdp
description: Fake a network drop with session.room.connection.close(4010) after 5 s uptime; disable reconnection first to reach the lost path; count seats with a node lobby client
metadata:
  node_type: memory
  type: reference
  originSessionId: f7d3153f-df4c-4ebb-84eb-060bf6b9a4e2
  modified: 2026-09-26T07:27:59.310Z
---

To live-check the client's drop and lost paths (#271, 2026-09-26) without restarting the owner's server:

- **Drop then reconnect:** wait more than 5 s after the join (`reconnection.minUptime` is 5000 in
  `@colyseus/sdk` 0.17.43). Then `session.room.connection.close(4010)`. Code 4010 is `MAY_TRY_RECONNECT`,
  so the SDK fires `onDrop` and reconnects to the same room.
- **Lost:** set `session.room.reconnection.enabled = false` first, then close with 4010. The SDK fires
  `onDrop`, then `onLeave` at once.
- **Server seats:** join `lobby` from node with `@colyseus/sdk` (import the absolute path under
  `apps/client/node_modules`). Track `rooms`/`+`/`-`; `clients` per roomId is the seat count.
- `Runtime.evaluate` needs `replMode: true` for a top-level `await import('/app/net/session.ts')`.
- The leave-guard modal renders **before** the HUD Leave button in DOM order. Click the modal's button
  through its panel, not by "last button named Leave".

The #271 driver lived in a session scratchpad and is gone; rebuild it from this note. Related: [[drive-a-hosted-room-over-cdp]],
[[leave-guard-blocks-cdp-navigate]], [[node-bot-as-second-racer]].
