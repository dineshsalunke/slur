Agent: workertwo · Lane: RFC-349 S2 (#375) + S3 (#376) — both DONE, closed · #348 PAUSED · #338/#340/#341 prod verify after deploy · Updated: 2026-09-29

## Goal
RFC-349 no-dependency stages: S2 input action map, S3 event-queue helper.

## Done
- f3382cb #376 S3: `game/scene/event-queue.ts` `createEventQueue<T>(cap)` → `{ items, push, drain, clear }`; all 6 scene queues use it. One rule: drop oldest. block-burst (16), meteor-chunks (8), meteor-scorch (4) changed from drop-newest.
- cf8f95e #375 S2: `game/input/actions.ts` (`press`/`onAction`) + `bindings.ts` (`BINDINGS.keyboard/pad/touch`, `keyOf`). synth-key.ts and game-audio.constants.ts deleted. 7 actions incl. `start` (pad Start → GO / Race again / Create). M now shares the power-key filter (no mute while typing or with Cmd/Ctrl/Alt).
- 65bcef2 #373: bolt ThreatHud moved to NetHud (`game/hud/threat-hud/`).

## State
- 686/686 client tests; typecheck clean. My files pass biome + comment-ratio. Full `pnpm lint` has 13 format errors, all in other workers' uncommitted scene .tsx files (S15 #379 / #377).
- #375 live on /test-level (Playwright, fake pad via `navigator.getGamepads` stub): keys E/F/M/Ctrl+E, pad X/Y/Select, touch up/down/right all correct. Pad Start → `start` [unmeasured live, unit-tested].
- #376 [unmeasured live]: no visual check of meteor/burst VFX.
- #373 open item: on a 844×390 phone the bolt tick (y 64–80) overlaps a back-fired seeker row (y 55–71). Pre-existing on /game. Fix proposal sent to supervisor.

## Uncommitted
none.

## Held files
none (released: S2 and S3 file sets).

## Next
1. Wait for the supervisor's next lane.
2. Pending owner answers: incoming-bolt button on /test-level? phone tick/seeker overlap fix?
3. After the owner's deploy: verify #338/#340/#341 on prod. Later: resume #348 (Blur controls, now on the S2 action map).

## Open questions
- Owner: the two #373 follow-ups above.

## Lessons → memory
none new this seam (stage-enemy-fire-on-test-level.md was written at the #373 seam).
