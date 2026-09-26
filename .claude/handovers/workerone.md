Agent: workerone · Lane: #288 one run path · Updated: 2026-09-26 (slice 2 done)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

/test-level and hosted rooms differ only in netcode. Shared `stepCombat()`, and no `Local*` duplicates.

## Done

- 57ec8d0: plan sent. The OWNER APPROVED option A, the in-process loopback room.
- dab29d4: slice 1. room-combat/room-bounce/room-input moved to packages/shared/src/run/{combat,racer,input-queue}.ts. `stepCombat(ctx: CombatContext, dt)` (CombatContext = FireContext + mutable broken + pickups + pickupRespawn).
- 268dcb2: slice 2. Shared `RunSim` (packages/shared/src/run/run-sim.ts): `new RunSim(descriptor, { broadcast, onMeta })`, `advance(seconds)`, `fixedStep(dt)`, one method per message (input, setClass, setColor, start, restart, usePower, dropPower), join/drop/reconnect/leave, public `queues`, `clearCombat()`, `resetToLobby()`. mirrorBreaks now runs at the end of stepCombat. RunRoom is a 76-line adapter with a public `sim`. Server tests use `room.sim.*` and do not cast.

## State

- Owner answers: /test-level goes straight to GO (no countdown). The HUD shows the real 1-racer roster (the fixture goes). Shift+1-5 restarts the run with the new class.
- OWNER CONDITION 1: the loopback room is normal game code, NOT dev-gated. A future single-player mode will run on it without a server.
- OWNER CONDITION 2: the dev extras (auto-start, auto-restart after the finish curtain, Shift+1-5, KeyP freeze) sit in a SEPARATE dev layer on top of the loopback room.
- Slice 2 gates (measured): typecheck + lint clean; shared 421/421, server 38/38.
- Verified: schema 4.0.30 has `new Encoder(state)`, `encode()`, `discardChanges()`, `new Decoder(root)`, `decode(bytes)`, and `getDecoderStateCallbacks(decoder)`.
- Verified: sdk `getStateCallbacks<T>(room: Room<any, T>)` is typed NOMINALLY. Its body is `getDecoderStateCallbacks(room.serializer.decoder)`. A structural room must use its own helper that calls getDecoderStateCallbacks.
- Verified: the client uses only `room.state` (45), `sessionId` (17), `send` (9), `onMessage` (7) and `roomId` (1) outside net/matchmaking + lobby/. About 30 client files annotate `Room< RunState >`.
- The client has NO direct `@colyseus/schema` dependency. Slice 3 adds `"@colyseus/schema": "catalog:"` (the same single 4.0.30 copy) and changes pnpm-lock.yaml.

## Plan (approved)

- Slice 3: client net/loopback-room/ (NOT dev-gated). It holds a RunSim, an Encoder and a Decoder, and patches every 50 ms. It ticks from R3F `addEffect` and exposes {state, sessionId, roomId, onMessage, send, serializer:{decoder}}. Replace `Room< RunState >` with a structural `RunRoomLike` in every client file that uses it, and `getStateCallbacks` with a local helper. Add a vitest test: join → start → fire a bolt → a decoded projectile and a HIT message.
- Slice 4: /test-level mounts NetCanvas (plus a children slot for FrameTap) on the loopback room. The dev layer is a separate module in dev/ or routes/test-level/ (auto-start with no countdown, auto-restart, Shift+1-5 restart, KeyP freeze). NetLoop honours simFreeze. Delete: local-combat(.test).ts, local-ship.tsx, local-loop/, local-*-field/, test-level-hud.tsx, hud-fixture.ts, run-clock.ts. Update the CDP memories (place-the-ship, koota-universe, stage-a-mine). Verify on /test-level.
- The commit weighs ≥5 tick-clock options: addEffect (chosen) · setInterval · useFrame ticker · own rAF · the NetLoop callback.

## Uncommitted

None.

## Held files

Slice 3 claim CLEARED by slur-supervisor (not started, nothing written): apps/client/app/net/loopback-room/*, net/run-room-like.ts, net/state-callbacks.ts, apps/client/package.json, pnpm-lock.yaml, and every client file that annotates `Room< RunState >` or calls getStateCallbacks (list: `rg -l "Room<\s*RunState\s*>|getStateCallbacks" apps/client/app`, about 32 files, including net/matchmaking(.test).ts and game/overlays/test-room.ts).
Supervisor conditions: (1) the lockfile diff adds ONLY the catalog @colyseus/schema link, with no other version moves; confirm one 4.0.30 copy with `pnpm why @colyseus/schema`. (2) Re-claim any released file before editing it, even when you expect "clear". (3) ast-grep drops semicolons on whole-statement rewrites; grep after -U. Seam early in this wide slice.

## Next

1. Build slice 3 (claim already cleared). Start with RunRoomLike + the state-callbacks helper (typecheck-only change), then loopback-room + its vitest.
2. Slice 4 with a claim and a SHA report. Close #288 with the final SHA.

## Open questions

- None.

## Lessons → memory

none
