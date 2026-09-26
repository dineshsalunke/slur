Agent: workerfour · Lane: #268 follow-up (dead tunables) · Updated: 2026-09-26

## Goal

Remove the dead `RearView.featherX/Y` tunables left after the solid rear-view mirror (#268).

## Done

- `107413c`: dropped `RearView.featherX/Y` from `apps/client/app/dev/tuning-schema.ts`. No readers existed.
- `2ce75a4` (pushed): #265 pickup spread + power bag (closed).
- `1199218` (pushed): #268 solid rear-view mirror.

## State

- Gates at 107413c: client typecheck clean, client 391/391, biome clean on the file, comment ratchet OK.

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
