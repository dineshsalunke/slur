Agent: workerthree · Lane: strafe tap kick #256 — DONE · Updated: 2026-09-25

## Goal

A quick A/D tap moves the ship substantially at once. A held key flies as before.

## Done

- 0c904de: per-class `FlightTuning.strafeKick` (interceptor 40 · fighter 34 · comet 30 · phantom 30 ·
  freighter 26; DEFAULT_TUNING 0). `applyStrafe` sets vx to at least kick·strafe on a press, gated on
  kick > 0. Kick-aware `strafeToward` in pacing/pockets.ts, exported, and reused by groove.test.ts. New
  sim/strafe-kick.test.ts. GDD class table has a kick column, and the §5.6 strafe row is updated.
- Pushed c71634e..0c904de (carries 20c9e02 and 500de7b). #256 CLOSED (auto-closed by the push).

## State

- 100 ms tap travel, before → after: interceptor 2.7 → 6.6, fighter 2.4 → 6.0, comet 3.2 → 7.1,
  phantom 2.3 → 5.5, freighter 2.2 → 5.1 u. Full table in the 0c904de body.
- HEAD scratch copy: shared 323 → 331 pass, server 17/17. Tree: client 340/340, pnpm typecheck clean,
  biome and the comment ratchet clean on the touched files.
- Pocket A/B, 10 seeds: trapped counts are the same, or freighter 425 → 424. Groove avoid pilot, 30 seeds × 5
  classes: 150/150 finish, 0 deaths, before and after.
- Not play-tested by feel in a hosted room [unmeasured]. The owner tunes the kicks.

## Uncommitted

- none

## Held files

- none (claims released)

## Next

1. Idle. Wait for the supervisor.

## Open questions

- Owner: are the kick values right by feel? One field per class in ship-classes.ts.
- Owner (carried over): the engine glow is hard to see because EngineLight 18 saturates the rear faces.
  Lower EngineLight, or accept?

## Lessons → memory

- .claude/memory/fractional-strafe-pilots-trip-strafe-kick.md (updated: the fix and the > 0 gate)
