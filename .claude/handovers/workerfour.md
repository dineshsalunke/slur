Agent: workerfour · Lane: typed messages, RFC-349 S12, issue #413 · Updated: 2026-10-20

## Goal

Server → client events typed through `ctx.broadcast` (a6). Client → server commands through the 0.17
`messages` table with hand-written `StandardSchemaV1` validators (a3, Q7: no library). Wire bytes unchanged.

## Done

- Plan approved by slur-supervisor (P1–P3; P4 lands before S6). Handover plan commit 66465f50.
- **Owner answer:** a malformed command is ignored silently. The client stays connected. Validators never
  return `issues`.

## State

- 22 `*_MESSAGE` constants in 12 shared files (`rg "_MESSAGE\s*=" packages/shared/src`).
- S→C: `hit` (bolt-run, mine-run, seeker-run → attach-room-to-world:254), `bounce` (racer.ts → attach:258,
  flight-recorder.state.ts:69), `tug`, `mineBurst`, `shieldPop`, `portalHop`, `portalFizzle` (feature `net`
  slots; mine/shield/portal also bind-room-audio), `seekerHit`/`seekerMiss` (bind-room-audio only), room-only
  `chatLine`, `chatHistory`, `kicked`.
- C→S: 8 sim commands registered twice: run-room.ts:87–98 and the loopback-room.ts `commands` map. 3 room
  commands (`kick chat chatHistory`), server only.
- The sim `messages: [...]` slot (5 features) has no consumer.
- Colyseus 0.17.47 `Room.mjs` `_onMessage`: when a validator returns `issues`, the server calls
  `client.leave(CloseCode.WITH_ERROR)`. The `messages` table registers in `__init` through
  `onMessage( type, format, handler.bind( this ) )`.
- `@standard-schema/spec` 1.1.0 `Props`: `version: 1`, `vendor: string`, `validate( value, options? ) =>
  Result | Promise<Result>`, `types?: { input, output }`. `InferOutput` reads `types.output`, so declare
  `types?` as a phantom.
- Payload shapes: `start/restart/endRace/chatHistory` = `undefined`; `setClass/kick/chat` = bare string;
  `setColor` = bare number; room-hardening.test.ts sends `{ inputs: [], pad }` (extra keys must pass).
- `RunSim.usePower` calls `fireReady` even when `enqueueFire` rejects the payload. Keep that: the handler
  always calls `usePower`, with `undefined` for a bad payload.

## Uncommitted

- none.

## Held files

Cleared by the supervisor: the P1/P2 shared files and P3 client files from the plan, plus
`run/input-queue.ts` (claim add sent, no objection yet). **Not** `run/run-sim.ts`: do not edit it. The
supervisor wants run-sim.ts and `index.ts` released fast for workertwo (S6); tell the supervisor when done.
`run-room.ts`: claim it with the supervisor after P1–P3 are pushed.

## Next — design worked out, nothing written yet

1. `packages/shared/src/run/command-format.ts`:
   `interface CommandFormat< Input, Output > { '~standard': { version: 1; vendor: 'slur';
   validate( value: unknown ): { readonly value: Output }; types?: { input: Input; output: Output } } }` +
   `commandFormat< I, O >( normalise: ( v: unknown ) => O )`. Typecheck early that server `validate()`
   accepts it structurally.
2. `run/input-queue.ts`: extract `parseFire( raw ): FireIntent | null` from `enqueueFire`; `enqueueFire`
   calls it.
3. `run/run-commands.ts`: `RunCommandInputs` (what the client sends) and `RunCommandOutputs` (normalised)
   interfaces keyed by the literal constants. Outputs: input → `{ inputs: sanitizeInputs( v.inputs ) }`
   (narrow with `'inputs' in v`, no cast); setClass → `ShipId | null`; setColor → `number | null`;
   start/restart/endRace → `undefined`; usePowerUp → `parseFire( v )`; dropPowerUp → slot `number | null`.
   `RUN_COMMAND_FORMATS` and `RUN_COMMAND_HANDLERS` are mapped types over `RunCommandType`.
   `CommandTarget = Pick< RunSim, … >`. Use the correlated generic `applyRunCommand< K >( target, id, type: K,
   raw )` (no casts), `isRunCommand( type )` and `RUN_COMMAND_TYPES`. Every handler re-enters the RunSim
   method, which re-checks idempotently, so the result is bit-equal. Add a test for each command: valid,
   undefined, a bare string, `{}` and extra keys.
4. P2: brand `RunEvent< T > = string & { readonly [ payload ]?: T }`, built by the constructor
   `runEvent< T >( type )`. `Broadcast = < T >( e: RunEvent< T >, m: NoInfer< T > ) => void` in
   `run/combat.ts`. Type the event constants. The sim `messages` slot gets a registry clash check. Weigh ≥5
   typing mechanisms in the PR body.
5. P3: loopback-room.ts calls `applyRunCommand` (silent drop). `RunRoomLike` gets additive typed
   `onMessage` / `send` overloads. attach-room-to-world.ts gets no edit.
6. P4 (claim run-room.ts first): `messages = { …RUN_COMMAND_TYPES via validate(), kick, chat, chatHistory }`,
   plus the new `apps/server/src/rooms/room-commands.test.ts`: an SDK client sends every command valid and
   malformed, the test asserts state and that the client is still connected, and a broadcast capture is
   identical before and after. workertwo's `SET_RULES_MESSAGE` joins the table after P4.
7. Proof: RunSim A/B 6 seeds × 3600 ticks + a negative control; /test-level draws; all 3 suites before each
   push; close #413 with the SHA.

## Open questions

- none (owner answered the kick question: silent ignore).

## Lessons → memory

- `.claude/memory/colyseus-validate-kicks-on-issues.md`
