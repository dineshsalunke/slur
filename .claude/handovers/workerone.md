Agent: workerone · Lane: #288 one run path · Updated: 2026-09-26 (slice 1 done)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

/test-level and hosted rooms differ only in netcode. Shared `stepCombat()`, and no `Local*` duplicates.

## Done

- 57ec8d0: plan sent. The OWNER APPROVED option A, the in-process loopback room.
- dab29d4: slice 1. room-combat/room-bounce/room-input moved to packages/shared/src/run/{combat,racer,input-queue}.ts. `stepCombat(ctx: CombatContext, dt)` (CombatContext = FireContext + mutable broken + pickups + pickupRespawn). mirrorBreaks stays in RunRoom, after stepCombat.

## State

- Owner answers: /test-level goes straight to GO (no countdown). The HUD shows the real 1-racer roster (the fixture goes). Shift+1-5 restarts the run with the new class.
- OWNER CONDITION 1: the loopback room is normal game code, NOT dev-gated. A future single-player mode will run on it without a server.
- OWNER CONDITION 2: the dev extras (auto-start, auto-restart after the finish curtain, Shift+1-5, KeyP freeze) sit in a SEPARATE dev layer on top of the loopback room.
- Verified: sdk `getStateCallbacks(room)` reads only `room.serializer.decoder` (sdk src/serializer/SchemaSerializer.ts:15-19). `MapSchema implements Map<K,V>` (schema 4.0.30).
- Room surface used under NetCanvas + HUD: state, sessionId, onMessage, send, and serializer.decoder through getStateCallbacks. onDrop/onLeave/onReconnect/onStateChange are used only in net/matchmaking.ts.
- [unmeasured] Encoder/Decoder API names in schema 4 (`new Encoder(state)`, `encode()`, `discardChanges()`, `new Decoder(state)`, `decode(bytes)`). Verify in the installed `.d.ts` before slice 3.

## Plan (approved)

- Shared `stepCombat(state: CombatState, ctx: CombatContext, dt)` in packages/shared/src/run/combat.ts.
  - CombatState: players/projectiles/seekers/mines/pickupTaken Maps.
  - CombatContext: track, broken, pickups, pickupRespawn, config, broadcast.
  - Order: shields → stepBolts → stepSeekers → stepMines → stepPickups, exactly as `RunRoom.stepWorld` does it. Also `firePower`.
- Slice 1: move server room-combat.ts, room-bounce.ts and room-input.ts (+ their tests) to packages/shared/src/run/{combat,racer,input-queue}.ts. Export them from shared index.ts. run-room.ts calls stepCombat. No behaviour change.
- Slice 2: shared `RunSim` class (phase machine, queues, fire, stepRace, stepCombat, mirrorBreaks, start/reset, join/leave/host). Its constructor takes (descriptor, broadcast, onMeta). RunRoom becomes a thin Colyseus adapter. The server tests stay green.
- Slice 3: client net/loopback-room/ (NOT dev-gated). It holds a RunSim, an Encoder and a Decoder, and patches every 50 ms. It ticks from R3F `addEffect` and exposes {state, sessionId, onMessage, send, serializer:{decoder}}. Narrow Room<RunState> to a structural `RunRoomLike` in room-context, the stores, bind-room-audio, attach-room-to-world and net-loop. Add a vitest test: join → start → fire a bolt → a decoded projectile and a HIT message.
- Slice 4: /test-level mounts NetCanvas (plus a children slot for FrameTap) on the loopback room. The dev layer is a separate module in dev/ or routes/test-level/ (auto-start with no countdown, auto-restart, Shift+1-5 restart, KeyP freeze). NetLoop honours simFreeze. Delete: local-combat(.test).ts, local-ship.tsx, local-loop/, local-*-field/, test-level-hud.tsx, hud-fixture.ts, run-clock.ts. Update the CDP memories (place-the-ship, koota-universe, stage-a-mine). Verify on /test-level.
- The PR body or commit weighs ≥5 tick-clock options: addEffect (chosen) · setInterval · useFrame ticker · own rAF · the NetLoop callback.

- Slice 1 gates: typecheck + lint clean; shared 418/418, server 38/38 (measured).
- Server tests reach RunRoom privates by cast: `fixedStep` (run-room.test, room-shield.test) and `clearCombat` (room-shield.test). Slice 2 must keep them or update the tests.

## Uncommitted

None.

## Held files

None. Slice 2 claim sent to slur-supervisor.

## Next

1. On "clear": build slice 2 (shared `RunSim` in packages/shared/src/run/run-sim.ts; RunRoom becomes a thin adapter). Server tests stay green.
2. Slices 3–4 in order, each with a claim and a SHA report. Close #288 with the final SHA.

## Open questions

- None.

## Lessons → memory

none
