Agent: workerone · Lane: #288 one run path (plan-first) · Updated: 2026-09-26

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

/test-level and hosted rooms differ only in netcode. Shared `stepCombat()`, and no `Local*` duplicates.

## Done

- The plan went to slur-supervisor (SendMessage, 2026-09-26). Nothing built.

## State

- Plan: seam at the Room. Shared `stepCombat` + `RunSim` in `packages/shared/src/run/`. RunRoom becomes an adapter. /test-level mounts NetCanvas on an in-process loopback room (Encoder→Decoder).
- Checked: sdk `getStateCallbacks` reads only `room.serializer.decoder`. `MapSchema implements Map`.
- Slices: 1 stepCombat · 2 RunSim · 3 loopback room · 4 /test-level swap + Local* deletions.

## Uncommitted

None.

## Held files

None. Claim per slice after approval.

## Next

1. Wait for owner approval via the supervisor, with answers to the open questions.
2. Claim slice 1 files and build slice 1.

## Open questions

- Room seam (loopback) vs koota seam? Countdown on /test-level? Real 1-racer roster? Shift+1-5 restarts the run?

## Lessons → memory

none
