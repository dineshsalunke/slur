Agent: workerone · Lane: RFC-349 S1 (#374) done → next #377 (S10) · Updated: 2026-09-29 16:00

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#374: one client config source. Done and closed. Next: #377 (RFC-349 S10, `.scratch.ts` rename).

## Done

- 4c66045 + e5b1e6d — #369 nozzles in accent, EngineLight removed. #369 open for owner sign-off.
- 41c9a41 — #374: koota world trait `RunConfig` (`game/ecs/run-config.ts`, `holdRunConfig`/`runConfig`).
  attachRoomToWorld holds `room.simConfig ?? DEFAULT`. Predictor reconcile takes `config`.
  netFlightSystem + deckFlightSystem read `runConfig(world)`. `RunRoomLike.simConfig?` added;
  LoopbackRoom exposes it. Dead `localFlightSystem` removed. Memory
  test-level-dials-miss-the-predictor deleted (no longer true). Issue closed.

## State

- run-config tests 4/4 and prediction + loopback tests pass (9/9 together).
- Full typecheck/vitest failures at 41c9a41 were only in workertwo's #375 in-flight files
  (power-select exports, actions.test, controls-panel.utils.test). None in my files.
- Live /test-level rubber-band check after a Tug.* dial change: [unmeasured].
- Hosted rooms still simulate DEFAULT_SIM_CONFIG on both ends (config sync is RFC §5 B2, later).

## Uncommitted

- none.

## Held files

- none. #374 claim released. #377 NOT yet claimed.

## Next

1. Read #377 and RFC-349 §7 S10. Send the supervisor a separate file claim, then wait for "clear".
2. Build, test, commit by pathspec, `gh issue close 377` with the SHA.
3. Supervisor marks the RFC §7 stage status. Do not edit docs/RFC-349-ARCHITECTURE.md.

## Open questions

- Owner (#369): is the flatter nozzle OK? Does the near-camera streak still read orange after "reset tuning"?

## Lessons → memory

- none new this seam (deleted the stale test-level-dials-miss-the-predictor).
