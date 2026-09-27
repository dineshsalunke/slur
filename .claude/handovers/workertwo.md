Agent: workertwo · Lane: lobby engine hum #316 (DONE) · Updated: 2026-09-27

## Goal
Stop the engine hum in the lobby after a race.

## Done
- #316 filed (bug).
- b3965f7 engine loops play only in countdown + racing. bind-room-audio phase listener starts/stops the local loop; RemoteEngineAudio detaches remote emitters off-track; GameAudio no longer starts the loop at mount.

## State
- Client typecheck, biome, comment ratchet, 508 vitest tests pass.
- Live hosted-room check not run by me [unmeasured]; owner verifies (race, finish, lobby, silence).
- Results phase is silent too (supervisor-approved default).

## Uncommitted
none

## Held files
none

## Next
1. Lane finished. Await a new lane from slur-supervisor.

## Open questions
- Owner may want the hum through results; change is `ON_TRACK_PHASES` → include `PHASE.finished` in both gates.

## Lessons → memory
none
