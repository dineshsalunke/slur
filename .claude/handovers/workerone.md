Agent: workerone · Lane: #273 netcode (review lane C) · Updated: 2026-09-26

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Fix the four #273 netcode faults: input-queue ratchet, float32 reconcile drift, fire without an input
seq, stale pending inputs across a phase change. Plan approved by the supervisor.

## Done

- 36b67f2 — server + shared half: `inputsThisTick` drain (1 + up to 2 extra while > 3 wait; stepped,
  never dropped), `froundSimShip` + `SIM_FLOAT_KEYS` in `shared/sim/types.ts` run at the end of each
  racing tick, fire intents queued per player in `room-input.ts` (`enqueueFire`/`takeFire`, cap 4) and
  fired after the input with that seq. `PowerSlotMessage.seq?` added. Commit body has the ≥5-option
  weighing.
- #269 is still open for the owner's sign-off (see the #269 comments). Not this lane.

## State

- Measured before the fix (hosted room on :5173/:2567, headless host + node bot): a 400 ms bot stall
  left 22–25 inputs queued from t 16 s to t 60 s. A steady client held 0–4. The host had one natural
  359 ms stall, and its floor went from 0–2 to 3–4. Logs: scratchpad of session c57c22c3
  (`run1.log`, `run2.log`, `q-host.mjs`, `q-bot.mjs`).
- At 36b67f2: server 52/52, shared 408/408, biome clean on the touched files, comment ratchet OK.
  Client suite and `pnpm typecheck` for the client were not run.
- A negative control without server rounding drifts dz −1.9e-6 after 120 replayed ticks.
- Re-measurement after the fix: [unmeasured].
- The tests ran with another worker's uncommitted `room-combat.ts` (#280) in the tree
  [not re-run against HEAD].

## Uncommitted

None of mine.

## Held files

Client half, cleared by the supervisor:
- apps/client/app/net/prediction.ts + prediction.test.ts (new)
- apps/client/app/net/attach-room-to-world.ts
- apps/client/app/game/ecs/net-systems.ts
- apps/client/app/game/input/current-input.ts
- apps/client/app/game/net-canvas.tsx
The server and shared #273 files are released.

## Next

1. `prediction.ts`: add `reset()` to `Predictor` (pending.length = 0). Call `froundSimShip(sim)` after
   each replayed `simulate()` in `reconcile`.
2. `attach-room-to-world.ts`: the phase listener calls `predictor.reset()`, next to
   `runPhase.value = v`.
3. `net-systems.ts` `netFlightSystem`: `froundSimShip(s)` after `simulate()`, before `sparkIfBounced`.
4. `current-input.ts`: `export function lastInputSeq() { return seq; }`.
5. `net-canvas.tsx`: the fire action sends `{ slot, dir, seq: lastInputSeq() }`. **Also fold in #284
   for workerfive** (supervisor-approved): remove `style={ { position: 'fixed', inset: 0 } }` from
   `<Canvas>`. Wrap only `<Canvas>…</Canvas>` in `<div className="fixed inset-0">…</div>`. NetHud,
   FinishFade and TuningPanelMount stay outside that div, inside WorldProvider. Send workerfive the SHA.
6. `prediction.test.ts` (vitest): reset clears pending; a reconcile replay with fround matches a server
   that rounds each tick.
7. Gates: `pnpm typecheck`, `pnpm lint`, client vitest, server, shared.
8. Re-measure with a scratchpad copy of `q-host.mjs` + `q-bot.mjs` (stall 400 ms at 15 s). Expect the bot's
   floor to return to ≤ 4 within ~10 ticks. Kill Chrome by PID.
9. Close #273 with both SHAs and the before/after numbers (`gh issue close 273 -c …`).

## Open questions

- None open. The supervisor was told that room-shield.test.ts took a one-line `Math.fround(STUN_SECONDS)`
  fix in 36b67f2.

## Lessons → memory

.claude/memory/fround-makes-float-asserts-fail.md
