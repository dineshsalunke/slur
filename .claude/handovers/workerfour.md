Agent: workerfour · Lane: typed messages, RFC-349 S12, issue #413 · Updated: 2026-10-20 (P1–P3 seam)

## Goal

Server → client events typed through `ctx.broadcast` (a6). Client → server commands through the 0.17
`messages` table with hand-written `StandardSchemaV1` validators (a3, Q7: no library). Wire bytes unchanged.

## Done

- P1 `3503a33d`: `run/command-format.ts` (`commandFormat( normalise )`), `parseFire` split out of
  `enqueueFire`, `run/run-commands.ts` (`RunCommandInputs/Outputs`, `RUN_COMMAND_FORMATS`,
  `RUN_COMMAND_HANDLERS`, `RUN_COMMAND_TYPES`, `isRunCommand`, `applyRunCommand< K >`), with tests.
- P2 `0d7bdeac`: `run/run-event.ts` (`RunEvent< T >` brand, `runEvent< T >( type )`, no cast).
  `Broadcast = < T >( event: RunEvent< T >, message: NoInfer< T > ) => void`. Nine sim event constants are
  typed. The feature `messages` slot is `readonly RunEvent< unknown >[]`, and `claimEvents` in
  `features/sim-hooks.ts` builds `RUN_EVENT_OWNERS` and throws on a clash. Core `hit` and `bounce` are reserved.
- P3 `851ed9c1`: `LoopbackRoom.send` runs `isRunCommand` + `applyRunCommand` (command map and casts
  removed). `RunRoomLike` gets additive typed `send`/`onMessage` overloads.
- **None of P1–P3 is pushed.** dev also carries peers' unpushed commits (workertwo `383ef6b5`, `8241fd08`).

## State

- Suites at `851ed9c1` (measured): shared 625/625, server 101/101, client 740/740. `pnpm typecheck` was
  clean at P2. At P3, client `tsc` shows errors only in peers' uncommitted tuning-panel /
  tuned-sim-config files and dev-gated `+types`. None are in my files.
- Colyseus 0.17.47 `_onMessage` runs the validator **even when no payload is sent**. `standardValidate`
  throws on a Promise or on `issues`, and the throw → `client.leave(WITH_ERROR)`. So the normalisers never
  throw (tested over odd payloads).
- Probe (throwaway, deleted): server `validate( RUN_COMMAND_FORMATS.usePowerUp, … )` infers
  `FireIntent | null`. A negative control (assigning it to `string`) fails, as expected.
- Probe (deleted): `broadcast( HIT_MESSAGE, { x: 1 } )` and `broadcast( TUG_MESSAGE, hitPayload )` fail to
  compile. A raw string `broadcast( 'raw', 42 )` still compiles (T = unknown). Put this in the PR body.
- The handler result is bit-equal by construction: every handler re-enters the RunSim method, which re-checks.
  `fireDir` and `sanitizeInputs` are idempotent. `input` is sanitised twice (CPU only; PR body note).

## Uncommitted

- none (this handover is committed with the seam).

## Held files

P1/P2 shared files above, plus `packages/shared/src/index.ts` and `features/define-sim-feature.ts` (re-claimed via
the supervisor), and `apps/client/app/net/loopback-room/loopback-room.ts` + `run-room-like.ts`. Not
`run/run-sim.ts` (workertwo).

## Next

1. Push P1–P3 only after you tell the supervisor that the push carries peers' unpushed dev commits, and it
   agrees.
2. Proof before or with P4: RunSim A/B, 6 seeds × 3600 ticks. Old = `git show 35f35ee8:` sim files in scratch
   (memory `ab-an-old-sim-from-git-in-scratch.md`), new = HEAD. Drive the commands through
   `applyRunCommand`. Add a negative control (memory `ab-bench-needs-a-negative-control.md`).
3. P4: claim `apps/server/src/rooms/run-room.ts` from the supervisor. Set `messages = { …RUN_COMMAND_TYPES via
   validate( RUN_COMMAND_FORMATS[t], ( client, m ) => RUN_COMMAND_HANDLERS[t]( this.sim, client.sessionId,
   m ) ), kick, chat, chatHistory }`, replacing the 11 `onMessage` calls. New
   `apps/server/src/rooms/room-commands.test.ts`: an SDK client sends every command valid and malformed, the
   test asserts state and that the client is still connected, and a broadcast capture is identical before
   and after.
   **Do NOT add the `SET_RULES_MESSAGE` entry.** After the P4 push, tell the supervisor. `run-commands.ts`
   and `run-room.ts` then pass to workertwo.
4. /test-level draws (owner tests there), all 3 suites, push, PR body (weigh ≥5 typing mechanisms: brand
   + generic Broadcast, event map interface, Colyseus Room generic `~messages`, class-per-event, tagged
   tuple, zod-like lib — rejected by Q7). Then `gh issue close 413` with the SHAs.

## Open questions

- none.

## Lessons → memory

- none new this seam (`colyseus-validate-kicks-on-issues.md` already covers it). The new fact that the
  validator runs for an empty payload goes into that file at the next seam.
