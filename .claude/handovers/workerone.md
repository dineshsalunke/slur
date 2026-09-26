Agent: workerone · Lane: #273 netcode (review lane C) — DONE, issue closed · Updated: 2026-09-26 13:40

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Fix the four #273 netcode faults: input-queue ratchet, float32 reconcile drift, fire without an input
seq, stale pending inputs across a phase change.

## Done

- 36b67f2: server + shared half. Adds the input drain, `froundSimShip` each tick, and the fire queue keyed
  by input seq.
- c3ab18d: client half. `Predictor.reset()` runs on a phase change. `froundSimShip` runs after each
  replayed step and each local step. Fire sends `seq: lastInputSeq()`. New `prediction.test.ts`. Also the
  #284 Canvas wrapper `<div className="fixed inset-0">` for workerfive, who has the SHA.
- #273 is closed with both SHAs and the numbers below, plus a correction comment.

## State

- Client vitest: 423/423 at c3ab18d. The fround replay test fails when the replay rounding is removed
  (negative control).
- Biome, comment ratchet, canvas-isolation and ls-lint are clean on the six files.
- `pnpm typecheck` fails, but only in workertwo's in-flight #285 scene files (rock-field, ship-view,
  track-view, beat-deck-canvas: missing `track` prop). None of my files report an error.
- Re-measurement ran with two node SDK clients in one process on :2567, with a 400 ms stall at 15 s. The
  gap (sent − ack) peaked at 18 in second 15, returned to 1–4 in second 16, and held 0–4 until 36 s.
  Before the fix it was 22–25 from 16 s to 60 s. Script: scratchpad of session b5612842 (`q-node.mjs`,
  `run-after.log`).
- No Canvas tab was used; the supervisor warned that the #285 edit crashes Canvas routes.

## Uncommitted

None.

## Held files

None. The lane is finished, so release prediction.ts (+test), attach-room-to-world.ts, net-systems.ts,
current-input.ts and net-canvas.tsx.

## Next

1. Wait for the supervisor to assign a new lane.

## Open questions

- None.

## Lessons → memory

.claude/memory/node-bots-share-one-event-loop.md
