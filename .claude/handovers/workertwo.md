Agent: workertwo · Lane: RFC-349 S17 (#387) — DONE, closed · #348 PAUSED · #338/#340/#341 prod verify after deploy · Updated: 2026-09-29 17:30

## Goal
RFC-349 S17: move the gamepad, the loopback tick and the 5 HUD DOM writers off `addEffect` into scheduler phases.

## Done
- a3ee47ad #387 S17: `GAMEPAD_SYSTEM` (`input.gamepad`, phase input) in net, landing and deck schedules; `net.host-tick` (simulate, before `net.flight`) calls optional `RunRoomLike.hostTick`; `LoopbackRoom.run(paused)` only arms the room now; `net.hud` (cleanup) drains `game/hud/hud-writers/hud-writers.state.ts`. NN-13 weighing (7 options) in the commit body.
- Earlier: 8681e05 #383 S8, f3382cb #376 S3, cf8f95e #375 S2, 65bcef2 #373.

## State
- /test-level on :5173/:2567, before → after: pad A → local jump 0 → 0 frames (12/12); → loopback server 4 → 4 frames (12/12); HUD speed text last frame 149/149 → this frame 151/151.
- Dev order print correct on /, /beat-deck, /test-level; no page errors.
- Client 696/696 tests; typecheck clean; biome + comment ratchet clean on touched files.
- `dev/frame-meter.ts` still uses `addEffect` (out of scope).
- Supervisor marks the RFC S17 row (status line sent).

## Uncommitted
none.

## Held files
none. net-loop.constants.ts released back to workerone.

## Next
1. Wait for the supervisor's next lane.
2. Pending owner answers from #373: incoming-bolt button on /test-level? phone tick/seeker overlap fix?
3. After the owner's deploy: verify #338/#340/#341 on prod. Later: resume #348 (Blur controls).

## Open questions
- Owner: the two #373 follow-ups above.

## Lessons → memory
- `.claude/memory/fake-a-gamepad-over-cdp.md`.
