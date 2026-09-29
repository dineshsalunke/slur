---
name: herdr-send-keys-does-not-submit
description: herdr pane send-keys Enter did not submit a prompt already typed into a Claude pane; herdr agent prompt appends and submits
metadata:
  node_type: memory
  type: reference
  originSessionId: e4aeb333-55e9-44fc-ad07-db2ed1a9e60b
  modified: 2026-09-29T03:23:40.777Z
---

A worker pane had a prompt typed but never sent. `herdr pane send-keys <pane> enter` and `... Enter` both
left it sitting in the input box (2026-09-29). `herdr agent prompt <pane> "<text>" --wait --until working`
worked: it appended to the typed text and submitted both. Start the appended text with a separator so the
joined prompt still reads.

Related: [[supervisor-clears-workers-via-herdr]], [[queued-message-can-sit-unread]].
