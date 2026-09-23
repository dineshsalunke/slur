---
name: deprecated-breaks-reflection-decoding
description: "@colyseus/schema @deprecated() on a field shifts later indexes for our reflection-decoding client — keep dead fields plain"
metadata:
  node_type: memory
  type: project
  originSessionId: 3b84e64d-abb5-4ea6-985e-7ed4b0644d10
  modified: 2026-09-23T15:18:51.633Z
---

`@deprecated()` on a Schema field breaks hosted rooms in this project. The client joins with
`joinById< RunState >( roomId, … )` and passes no root class, so it decodes by **reflection**. In
@colyseus/schema 4.0.30 the reflected class leaves the deprecated field out. Every later field then
sits one index too low on the client. The client logs `field not defined at index N` and `definition
mismatch`, and the player stops decoding. (Measured 2026-09-23, #223: `heldPower` deprecated, `slots`
at 26 on the server, 25 on the client. Fixed in c362fab.)

**Why:** server-side unit tests that only read `room.state` cannot see it. A decode error is logged,
not thrown, so even the SDK-connected tests in `run-room.test.ts` passed.

**How to apply:** keep a dead field as a plain `@type` field that nothing writes. Never delete it or
insert before it. After any change to `schema.ts`, assert on the **client-decoded** state through
`@colyseus/sdk` (`host.state…`). See the rack test in `apps/server/src/rooms/run-room.test.ts`. The
rule "dead fields get `@deprecated()`" in `.claude/rules/colyseus-state.md` is wrong for this client.
