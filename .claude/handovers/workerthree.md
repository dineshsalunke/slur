Agent: workerthree · Lane: #244 block merge (RFC sent, not started) + #243 seeker speed (owner factor pending) · Updated: 2026-09-24

## Goal

The homing seeker must outrun every ship class. Its top speed = fastest `maxCruise` × a data factor.

## Done

- 1f1b0c3: feat(combat), #243. `SEEKER_SPEED = 120` → `SEEKER_SPEED_FACTOR = 1.15` (`combat/constants.ts`).
  `SimConfig.seekerSpeed` → `seekerSpeedFactor`. `ship-classes.ts` exports `FASTEST_CRUISE`.
  `seeker.ts` exports `seekerTopSpeed(cfg)`, used by `advance()`. `seeker.test.ts`: the ramp test, a
  roster pin (top speed > every class `maxCruise`), and the trail-follow fixture target moved 250 → 350u.
  ADR-017 as-built line updated. Measurements posted on #243.

## State

- No boost exists: `sim/step.ts:21` clamps `vz` to `maxCruise`. The ramp (0.3 s) is not the limit.
- Freighter (124) at 120 u/s: 0 hits. At 143 (×1.15): median 2.8 / 7.6 / 15.5 s / never for launch
  gaps 60 / 150 / 300 / 500u. At 186 (×1.5): 0.9 / 2.4 / 4.8 / 8.0 s. TTL 20 s. Full table on #243.
- At factor 1.5 the fixture `an early full-rate strafe does not shake it` fails (arrival ~2.3 s is inside
  its 3 s strafe). A move to 1.5 must retime that fixture.
- Tests at 1f1b0c3: shared 236/236, server 15/15, client 279/279. Typecheck, biome and the comment
  check are clean.
- Scratch: `seeker-speed.mjs` (session 5add3877), `SPEEDS=120,143,... node seeker-speed.mjs`. No
  servers and no Chrome were started.

## Uncommitted

- none

## Held files

- The #243 claims (`combat/constants.ts`, `sim-config.ts`, `ship-classes.ts`, `combat/seeker.ts`,
  `combat/seeker.test.ts`, `docs/DECISIONS.md`) until the owner picks the factor.

## Next

0. #244 (owner lane via supervisor): RFC sent with 7 options, measured in scratch `clusters.mjs` + `m2.mjs` (session 5add3877). Recommended option 5: in-segment guarded merge + abut at the segment boundary, in `track.ts` + new `sim/merge-blocks.ts`. Baseline 4,527 blocks / 1,577 close pairs; option 5 gives 4,194 / 143 with zero new sub-7u slices. Wait for the RFC answer, then claims, then build.

1. Wait for the owner's factor (1.15 vs 1.5) through slur-supervisor.
2. If it changes: edit `SEEKER_SPEED_FACTOR` and the "(1.15)" in ADR-017. At 1.5, retime the early-strafe
   fixture. Rerun `seeker-speed.mjs`, comment on #243, commit, close #243.
3. If 1.15 stands: close #243 and release the claims.

## Open questions

- Owner: keep factor 1.15, or raise it (×1.5 reaches a Freighter at the full 500u gap inside TTL)?

## Lessons → memory

- none
