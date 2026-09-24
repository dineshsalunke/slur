Agent: workertwo · Lane: matchmaking test fix (no issue, supervisor-assigned) · Updated: 2026-09-25 00:45

## Goal

Make `apps/client/app/net/matchmaking.test.ts` green (2/3 failed at HEAD).

## Done

- c0a7a90 test(net): matchmaking fixture carries the full wire descriptor.
  - Cause: 0734e06 made `toDescriptor` default `gen` to `'weave'` (`packages/shared/src/schema.ts:101`).
    The plain-object mock had no `gen`. `toEqual` skips undefined keys, so `blockDensity`/`gapChance`
    (3d724d8) never failed. `gen` was the first defaulted field.
  - The fixture was wrong, not the code. All three are real `TrackDescriptorState` wire fields.

## State

- Client vitest: 41 files, 299 tests passed. Client typecheck clean. Biome and comment ratchet clean.

## Uncommitted

None.

## Held files

None after this commit.

## Next

1. Stay idle until the supervisor assigns new work.
2. Parked follow-ups from #253 (not approved): kick lag of about -15 ms; triplet or swing flag per song.

## Open questions

None.

## Lessons → memory

none
