Agent: workertwo · Lane: RFC-349 S8 (#383) — DONE, closed · #348 PAUSED · #338/#340/#341 prod verify after deploy · Updated: 2026-09-29 17:10

## Goal
RFC-349 S8: send input on the sim tick; delete the input setInterval.

## Done
- 8681e05 #383 S8: `net.send-input` system (phase `simulate`, after `net.flight`) in `game/net-loop/net-loop.constants.ts`; `netSendInput` + `NetFrame.unsentTicks` in `net-loop.utils.ts`; `INPUT_SEND_TICKS = 2` in `net/input-chunks.ts`. setInterval + `INPUT_SEND_MS` deleted from `net/attach-room-to-world.ts`. Test: `net-loop.utils.test.ts`.
- Earlier: f3382cb #376 S3, cf8f95e #375 S2, 65bcef2 #373.

## State
- 2 ticks, not 1: server kicks above 60 msgs/s (`apps/server/src/limits.ts:8`). Supervisor accepted.
- Hosted room on :5173/:2567, before → after: 30.3 → 30.0 sends/s; 60 → 60 inputs/s; 1–3 → 2 inputs/msg; reconcile > 1 cm 0/198 → 0/198.
- /test-level after: 30 sends/s, 60.3 inputs/s, 2/msg.
- Hidden tab (rAF held): same before and after. Server z frozen, not kicked, 0 corrections on return; 60 s → solo race ended by stall rule. Real hidden-tab timer throttling [unmeasured].
- Client 695/695 tests; typecheck clean; biome + comment ratchet clean on touched files.
- Scratch drivers: session scratchpad `s8-measure.mjs`, `s8-testlevel.mjs`.

## Uncommitted
none.

## Held files
none (S8 files released to supervisor at 8681e05).

## Next
1. Wait for the supervisor's next lane.
2. Pending owner answers from #373: incoming-bolt button on /test-level? phone tick/seeker overlap fix?
3. After the owner's deploy: verify #338/#340/#341 on prod. Later: resume #348 (Blur controls, on the S2 action map).

## Open questions
- Owner: the two #373 follow-ups above.

## Lessons → memory
- `.claude/memory/simulate-a-hidden-tab-over-cdp.md` (headless keeps background pages visible; hold rAF; hidden racer freezes, stall rule).
