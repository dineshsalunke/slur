Agent: workerone · Lane: #275 render P1s (review lane E) — DONE, issue closed · Updated: 2026-09-26 14:05

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Fix the six #275 render P1s: toneMapped, exhaust cap, GPU dispose, nebula stall, asteroid allocs,
PickupField listeners.

## Done

- fed4ac2: exhaustDrive divides by the ship's own maxCruise (+ exhaust-drive.test.ts). mine-bodies drops
  toneMapped:false. ShipModel disposes its cloned materials from a ref-callback cleanup.
- c2b9ac4: the rear-view material is a declarative `<shaderMaterial args>`. The nebula noise volume is
  built once (`noiseVolume()`). `forEachAsteroid` visits one scratch placement.
- 0afbef2: pickupTaken listeners move into attachRoomToWorld and feed game/pickup-state.ts.
- 5ded0a4: TrackBlocks disposes its sealed and fractured geometries from ref-callback cleanups.
- #275 is closed with all SHAs and the measurements.

## State

- createNoiseVolume: 332–372 ms in node over 3 runs. Asteroid garbage before the fix: ~7.1k objects/s at
  124 u/s.
- Client vitest 434/434 at 0afbef2. At 5ded0a4, tsc shows no error in track-blocks.tsx. Other tsc/test
  errors came from workerfour's uncommitted #277 files, now committed in d342d6d.
- Headless /test-level tap: the mirror, nebula and asteroids render. Mine glow look and hosted-room
  pickups: [unmeasured].

## Uncommitted

None.

## Held files

None. Released all #275 files.

## Next

1. Wait for the supervisor to assign a new lane.

## Open questions

- None.

## Lessons → memory

.claude/memory/r3f-disposes-only-the-object.md
