---
name: sdk-buffers-sends-while-dropped
description: Colyseus SDK 0.17 queues room.send during a drop and flushes it on reconnect; no auto-reconnect in the first 5 s
metadata:
  node_type: memory
  type: reference
  originSessionId: 0461d801-060a-40fb-8698-2b3c93bcc95e
  modified: 2026-09-27T13:58:17.636Z
---

`@colyseus/sdk` 0.17.43 `build/Room.mjs`: a `room.send` made while the connection is dropped goes into
`reconnection.enqueuedMessages`, and the SDK flushes the whole queue after the reconnect JOIN_ROOM
(lines 247–253). Auto-reconnect is skipped when the room was joined less than `minUptime: 5000` ms ago
(line 323). In that case the drop goes straight to onLeave.

**Why:** our 30 Hz input timer keeps sending during a drop. The server then gets a burst of stale inputs
for a ship it froze, and replays them after the reconnect.

**How to apply:** gate input sends on the connection status, and reset prediction on reconnect. Do not
rely on the SDK to drop stale messages. To test a reconnect, drop the connection more than 5 s after the
join. Related: [[simulate-a-room-drop-over-cdp]].
