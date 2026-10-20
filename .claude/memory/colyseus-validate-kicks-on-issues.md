---
name: colyseus-validate-kicks-on-issues
description: Colyseus 0.17 drops the client when a message validator returns issues; silent-ignore validators must normalise
metadata:
  node_type: memory
  type: reference
  originSessionId: d615ab36-a3ca-41d1-b46b-7e00617a8e77
  modified: 2026-10-20T04:24:27.400Z
---

In `@colyseus/core` 0.17.47, `Room.mjs` `_onMessage` runs `standardValidate( format, message )`. If the result
has `issues`, or `validate` returns a Promise, it throws. The catch calls `client.leave( CloseCode.WITH_ERROR )`
and prints the error. So a `validate( format, handler )` entry in the `messages` table is a disconnect gate,
not a filter.

**Why:** before S12 every handler silently ignored a bad payload. The owner kept that (2026-10-20): a
malformed command is a no-op and the client stays connected.

**How to apply:** our hand-written StandardSchemaV1 formats never return `issues`. They normalise a bad
payload to a no-op value (`null` / `undefined`), and the handler ignores it. The `messages` table registers
in `__init` through `onMessage( type, format, handler.bind( this ) )`. Related: [[deprecated-breaks-reflection-decoding]].
