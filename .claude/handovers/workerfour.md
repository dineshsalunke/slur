Agent: workerfour · Lane: typed messages, RFC-349 S12, issue #413 · Updated: 2026-10-20

## Goal

Server → client events typed through `ctx.broadcast` (a6). Client → server commands through the 0.17
`messages` table with hand-written `StandardSchemaV1` validators (a3, Q7: no library). Wire bytes unchanged.

## Done

- none (plan stage).

## State

- 22 `*_MESSAGE` constants in 12 shared files (`rg "_MESSAGE\s*=" packages/shared/src`).
- S→C: `hit` (bolt-run, mine-run, seeker-run → attach-room-to-world:254), `bounce` (racer.ts → attach:258,
  flight-recorder.state.ts:69), `tug`, `mineBurst`, `shieldPop`, `portalHop`, `portalFizzle` (feature `net`
  slots; mine/shield/portal also bind-room-audio), `seekerHit`/`seekerMiss` (bind-room-audio only), room-only
  `chatLine`, `chatHistory`, `kicked`.
- C→S: 8 sim commands (`input setClass setColor start restart endRace usePowerUp dropPowerUp`) registered
  twice — run-room.ts:87–98 and loopback-room.ts commands map. 3 room commands (`kick chat chatHistory`),
  server only.
- The sim `messages: [...]` slot (5 features) has no consumer (grep of `.messages` is empty).
- Colyseus 0.17.47 `Room.mjs` `_onMessage`: a validator that returns `issues` throws, and the catch runs
  `client.leave(CloseCode.WITH_ERROR)`. Today every handler silently ignores a bad payload. The `messages`
  table registers in `__init` through the same `onMessage( type, format, handler )`.
- Payload shapes: `start/restart/endRace/chatHistory` = `undefined`; `setClass/kick/chat` = bare string;
  `setColor` = bare number; room-hardening.test.ts sends `{ inputs: [], pad }` (extra keys must pass).

## Uncommitted

- none.

## Held files

- none yet (claim sent with the plan).

## Next

Plan sent to slur-supervisor 2026-10-20, waiting for approval. Plan summary:

- **P1 (shared, neutral):** `run/standard-schema.ts` (hand-written `StandardSchemaV1` type) +
  `run/run-commands.ts` (one validator + one `run( sim, sessionId, msg )` per sim command; validators
  normalise, never return issues). Typecheck early that server `validate()` accepts the type structurally.
- **P2 (shared, neutral):** typed event ids (mechanism chosen from ≥5, weighed in the PR body), typed
  `Broadcast` in `run/combat.ts`, typed constants; the sim `messages` slot gets a consumer (clash check).
- **P3 (client):** loopback-room.ts uses the shared table (drop silently); additive typed `onMessage`
  overload on `RunRoomLike`, so attach-room-to-world.ts needs no edit.
- **P4 (waits for run-room.ts):** server `messages = { ...RUN_COMMANDS via validate, kick, chat,
  chatHistory }`. S6 adds its lobby override command to the same table after.
- Proof: RunSim A/B 6×3600 + negative control; new SDK room test: every command valid + malformed, client
  still connected, state asserted; broadcast capture identical before/after.

## Open questions

- Owner: should a malformed command disconnect the client (validator returns issues) or stay a silent no-op
  (today)? Default in the plan: silent no-op.

## Lessons → memory

- none yet.
