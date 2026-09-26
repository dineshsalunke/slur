Agent: workerone · Lane: #288 one run path · Updated: 2026-09-26 (slice 3 done)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

/test-level and hosted rooms differ only in netcode. Shared `stepCombat()`, and no `Local*` duplicates.

## Done

- 57ec8d0: plan sent. The OWNER APPROVED option A, the in-process loopback room.
- dab29d4: slice 1. room-combat/room-bounce/room-input moved to packages/shared/src/run/{combat,racer,input-queue}.ts.
- 268dcb2: slice 2. Shared `RunSim` (packages/shared/src/run/run-sim.ts). RunRoom is a 76-line adapter with a public `sim`.
- d39de1c: slice 3a. `RunRoomLike` (apps/client/app/net/run-room-like.ts) replaces `Room< RunState >` in 28 client files. `stateCallbacks(room)` (net/state-callbacks.ts) replaces the SDK `getStateCallbacks`. Overlay tests mock the helper (test-room.ts `callbacksMock`). Client gains `"@colyseus/schema": "catalog:"`.
- a79bfc3: slice 3b. `LoopbackRoom` (net/loopback-room/loopback-room.ts): `new LoopbackRoom(descriptor, name?)`, public `sim`, `step(seconds)`, `run()` → addEffect unsubscribe. sessionId `'local'`, roomId `'loopback'`. Test in loopback-room.test.ts. The commit body holds the 5-option tick-clock weighing.

## State

- Owner answers: /test-level goes straight to GO (no countdown). The HUD shows the real 1-racer roster (the fixture goes). Shift+1-5 restarts the run with the new class.
- OWNER CONDITION 1: the loopback room is normal game code, NOT dev-gated.
- OWNER CONDITION 2: the dev extras (auto-start, auto-restart after the finish curtain, Shift+1-5, KeyP freeze) sit in a SEPARATE dev layer on top of the loopback room.
- Measured: a real `Room<RunState>` satisfies `RunRoomLike` structurally (typecheck clean with route.tsx passing `loaderData.room`).
- Measured: lockfile diff is 3 lines (the catalog link only); `pnpm why` shows one @colyseus/schema 4.0.30.
- Measured: slice 3 gates — typecheck + lint clean (6 pre-existing warnings, none mine); client 448/448.
- Kept on the real `Room`: net/matchmaking(.test).ts, net/session.ts, lobby/lobby-store.ts (they use leave/onDrop/onReconnect/onStateChange).
- LoopbackRoom has no countdown skip. `sim.start()` goes through COUNTDOWN_SECONDS. Slice 4 "straight to GO" needs a way in: either a RunSim option or the dev layer stepping the countdown out. [undecided]
- LoopbackRoom `onMeta` is a no-op.
- Commits are local on dev, not pushed (origin/dev is 10 behind, including other workers' commits). [push left to the supervisor, as for slices 1–2]

## Uncommitted

None (after this handover commit).

## Held files

Slice 3 claim is finished. I release every slice 3 file. Nothing held.

## Next

1. Claim slice 4 with the supervisor. Expected files: routes/test-level/* (route, test-level-canvas, local-combat(.test).ts, local-ship.tsx, local-loop/, local-*-field/, test-level-hud.tsx, hud-fixture.ts, run-clock.ts), game/net-canvas.tsx (children slot), game/net-loop/net-loop.tsx (simFreeze), a new dev layer module, packages/shared/src/run/run-sim.ts if the countdown skip goes there, and the CDP memories (place-the-ship, koota-universe, stage-a-mine).
2. Build slice 4: /test-level mounts NetCanvas on a LoopbackRoom (room.run() from a module singleton, not a useEffect cleanup). Dev layer: auto-start with no countdown, auto-restart after the finish curtain, Shift+1-5 restart with the class, KeyP freeze. Delete the Local* files. Verify on /test-level (owner rule) with headless Chrome at DPR 1, then kill it.
3. Close #288 with the final SHA.

## Open questions

- Countdown skip for /test-level: a `RunSim` option (shared, e.g. `start(id, { countdown: 0 })`) or the dev layer stepping the sim through the countdown. I lean to a RunSim option; it is one line and testable. For the supervisor to confirm in the slice 4 claim.

## Lessons → memory

- .claude/memory/ast-grep-type-patterns-need-context.md
- .claude/memory/short-bolts-skip-the-patch.md
