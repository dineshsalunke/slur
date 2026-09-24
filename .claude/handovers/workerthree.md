Agent: workerthree · Lane: pickup SFX cut, #239 (closed) · Updated: 2026-09-24

## Goal

When several ingredients are taken back to back, a new pickup SFX stops the one still playing, then
plays. This applies to hosted rooms and /test-level. All other SFX stay as they are. Lane complete.

## Done

- #239 filed, approved (option 1, owner Q1 = add the sound to /test-level), and closed.
- b0e9235: fix(audio). `PlayOpts.cut` in audio-engine (last live source per name, 10 ms fade, then
  stop). `pickup: cut:true` in sfx-map, plus `loadSfx()`. /test-level local-combat plays 'pickup' on a
  slot fill. The route's clientLoader loads the pickup sample.

## State

- Tests: audio-engine 4/4, local-combat 11/11, client 279/279. Typecheck and biome are clean on the
  touched files.
- Live, hosted: 3 pickups 0.61 s and 0.51 s apart. Each start stopped the previous pickup at +10 ms.
  The countdown, GO and two fires 0.10 s apart had no stop.
- Live, /test-level: pickups 0.47 s apart. The earlier one was stopped at +10 ms.
- Driver: scratchpad `pickup-chain.mjs` (session 3c30e912).
- Stack :2594/:5198 and Chrome :9463 are killed.
- /test-level has no M key. Only the stored mute and volume apply there.

## Uncommitted

- none

## Held files

- none (the #239 claims are released)

## Next

1. None in this lane.
2. #231 and #232 still need an owner go-ahead.

## Open questions

- none

## Lessons → memory

- `.claude/memory/leave-guard-blocks-cdp-navigate.md`
