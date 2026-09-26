---
name: fround-makes-float-asserts-fail
description: The server rounds SimShip floats to float32 every racing tick (36b67f2); tests that assert a stun or timer equals a config constant must compare to Math.fround(constant)
metadata:
  node_type: memory
  type: project
  originSessionId: c57c22c3-4829-4256-b91b-cc68d412b06b
  modified: 2026-09-26T07:45:37.806Z
---

Since 36b67f2 (#273), `RunRoom.fixedStep` calls `froundSimShip` on every player at the end of each racing
tick. Every float32 field of SimShip (x..vz, timers, lastSafe*, stunTimer, boostTimer) then holds a
float32 value on the server as well as on the wire.

**Why:** the client decodes float32. A server that continued from float64 values made the replay in
`reconcile` drift (dz −1.9e-6 after 120 ticks, measured).

**How to apply:** in server tests, write `assert.equal( p.stunTimer, Math.fround( STUN_SECONDS ) )`,
never the bare constant. Two tests broke on this (run-room, room-shield). A new synced float field on
PlayerState must be added to `SIM_FLOAT_KEYS`; `fround.test.ts` fails if the list and the schema
disagree. Related: [[deprecated-breaks-reflection-decoding]].
