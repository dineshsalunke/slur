Agent: workertwo · Lane: #341 race always ends (A stall + B cap + C host End race, owner-approved) · #338/#340 open until final deploy · Updated: 2026-09-28

## Goal
A race must always end. Stall rule 30 s (warn 20 s), cap 3 × finishZ ÷ slowest cruise (84), host End race with a two-step confirm. ADR-027.

## Done
- 26cc118 shared helpers (STALL_SECONDS, raceCapSeconds, noteProgress, isStalled, …); PlayerState progressAt + bestZ.
- 4be2e39 docs: ADR-027, GDD round end, TDD.
- 7eb2da0 HUD: IdleWarning, RaceDeadline, roster IDLE; RunState.raceCap.
- 9b0c726 RunSim: raceCap from track (raceLimits option, default true), noteProgress + stalledCount into raceShouldEnd, host-only endRace (countdown|racing), spawnAt resets bestZ/progressAt. RunRoom + LoopbackRoom route END_RACE_MESSAGE. /test-level raceLimits false. EndRace button (two-step) in the HUD. TDD raceCap line; ADR-027 Consequences.
- #341 commented with SHAs; left OPEN until the owner's final deploy.
- #340 cf922f8 and #338 282428f: leave open until the owner's final deploy, then verify prod and close.

## State
- 9b0c726: shared 570/570, client 615/615, server 89/89, typecheck 0, comment ratchet clean. Biome warns run-sim.ts > 300 lines (was 334 at HEAD before this change).
- Live on :2567 (node @colyseus/sdk client, no Chrome): End race → finished at elapsed 1.98 s; idle solo racer → finished at elapsed 30.03 s; raceCap synced 285.7 s.
- The End race button click was not driven in a browser; covered by 3 vitest tests only. [unmeasured live]

## Uncommitted
none of mine (ship-view.tsx and tracks/phrase-20260921.json are other agents').

## Held files
none — release run-sim.ts, run-sim.test.ts, run-room.ts, loopback-room.ts, test-level-room.ts, end-race/*, overlays.tsx, overlays.test.tsx, docs/TDD.md, docs/DECISIONS.md.

## Next
1. After the owner's final deploy: verify #338, #340, #341 on prod, then `gh issue close` each with its SHA.
2. Otherwise idle; take the next lane from the supervisor.

## Open questions
none

## Lessons → memory
none new.
