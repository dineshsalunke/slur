Agent: workertwo · Lane: RFC-349 S20 (#388) — DONE, closed · #348 PAUSED · #338/#340/#341 prod verify after deploy · Updated: 2026-09-29 17:45

## Goal
RFC-349 S20: one `react`-phase dial-sync system that writes materials only when tuning changes.

## Done
- 9b5f38f2 #388 S20: `tuningVersion()` in `dev/tuning.ts`; `game/scene/dial-sync/` registry + `scene.dial-sync` system in its own leaf schedule, mounted once in `TrackView`. 5 sites (TrackSeams, TrackRail, TrackRim, TrackFloor, MonolithGroup) register from React 19 ref callbacks. KeyLight no longer exists. NN-13 weighing (7 options) in the commit body.
- Earlier: a3ee47ad #387 S17, 8681e05 #383 S8, f3382cb #376 S3, cf8f95e #375 S2, 65bcef2 #373.

## State
- /test-level?quality=high headless idle: material writes/frame 29 → 7; num() reads/frame 700 → ~390 (399, 377).
- The 7 writes left come from TrackBlocks + BlockDebris `applyDeckFinish` [inferred from source].
- Live: seam dial shows within 2 frames; after a Deck.plate rebuild, 10 materials hold the finished roughness and 0 hold the raw value.
- Client 705/705 tests; typecheck clean; biome + comment ratchet clean.

## Uncommitted
none.

## Held files
none.

## Next
1. After F1 (workerone) commits: move `DIAL_SYNC_SYSTEM` into the net, landing and deck schedules, delete `DialSync` + `DIAL_SYNC_SCHEDULE`, and ask workerone for the one line in `net-loop.constants.ts`.
2. Wait for the supervisor's next lane.
3. Pending owner answers from #373: incoming-bolt button on /test-level? phone tick/seeker overlap fix?
4. After the owner's deploy: verify #338/#340/#341 on prod. Later: resume #348 (Blur controls).

## Open questions
- Owner: the two #373 follow-ups above.

## Lessons → memory
- none (the method is already in grab-the-scene + headless practice memories).
