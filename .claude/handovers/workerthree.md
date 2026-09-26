Agent: workerthree · Lane: Remove post-respawn invuln (#281) — DONE · Updated: 2026-09-26

## Goal

Remove the dead post-respawn invulnerability (owner decision: remove).

## Done

- e13f35d: #281. Issue closed with the SHA.
  - `invulnTime` removed from `FlightTuning` / `DEFAULT_TUNING` (`packages/shared/src/constants.ts`).
  - `invulnTimer` removed from `SimShip`, `spawnShip`, `SIM_SHIP_KEYS`, `SIM_FLOAT_KEYS` (`sim/types.ts`).
  - `sim/step.ts`: respawn no longer grants it. `smashThrough` returns void and always breaks. A block
    push always bounces. The decay line is gone.
  - `PlayerState.invulnTimer` stays in `schema.ts` as a plain dead field. It is not removed and not
    `@deprecated()`.
  - Three invuln-only tests removed (step, respawn, fracture). The `director.test` literal was trimmed.
  - Docs: the ADR-016 amendment holds the removal. The ADR-014 section points to it. The ADR-015 smash
    line was trimmed. The TDD schema list marks the field as dead.
- Earlier lane: power bag 6/4/4/3/3 (842fd8c, docs 074ceee).

## State

- Shared tests 405/405, server 52/52, client 430/430. `pnpm typecheck` is clean (measured).
- `respawn.test.ts` gap-death probe asserts `nextTick.stunTimer === 0` on every respawn. It passes
  without invuln (measured).
- `rg invuln` outside docs and conventions finds only `schema.ts:32` (measured).

## Uncommitted

None of mine. `packages/shared/src/combat/constants.ts` has an uncommitted 9-line diff from another
worker. I did not touch it.

## Held files

None.

## Next

- Idle. Await the next lane.

## Open questions

- None.

## Lessons → memory

none
