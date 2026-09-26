Agent: workerfour · Lane: server input validation (#252, closed) · Updated: 2026-09-26

## Goal

Clamp and validate client inputs on the server before they reach the queue.

## Done

- `84a2ff7` (pushed): #252. New `apps/server/src/rooms/room-input.ts` `sanitizeInputs()` + `MAX_QUEUED_INPUTS` (moved from run-room.ts). `run-room.ts` INPUT_MESSAGE handler queues only sanitized inputs. 8 tests in `room-input.test.ts`. #252 closed.
- `107413c` (pushed): dropped dead `RearView.featherX/Y` tunables.

## State

- Gates at 84a2ff7: server 33/33, `pnpm typecheck` clean, `pnpm lint` clean (7 biome warnings, all line-count warnings from before; run-room.ts is 342 lines at HEAD and after).
- jump is `jump === true`, so the string "true" becomes false. The client sends a real boolean [unmeasured on the wire; read from `PlayerInput`].

## Uncommitted

- none.

## Held files

- none.

## Next

1. Wait for the supervisor.

## Open questions

- none.

## Lessons → memory

none
