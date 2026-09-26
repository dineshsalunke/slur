Agent: workerone · Lane: #275 render P1s (review lane E) · Updated: 2026-09-26 13:45

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Fix the six #275 render P1s: toneMapped, exhaust cap, GPU dispose, nebula stall, asteroid allocs,
PickupField listeners.

## Done

- fed4ac2: exhaustDrive divides by the ship's own maxCruise (+ exhaust-drive.test.ts). mine-bodies drops
  toneMapped:false. ShipModel disposes its cloned materials from a React 19 ref-callback cleanup.
- c2b9ac4: rear-view material is a declarative `<shaderMaterial args>`, so R3F disposes it. Nebula noise
  volume is built once, on first use (`noiseVolume()`). `forEachAsteroid` visits one scratch placement.
- 0afbef2: pickupTaken listeners move into attachRoomToWorld and feed game/pickup-state.ts. PickupField
  takes no props.

## State

- createNoiseVolume: 332–372 ms in node over 3 runs.
- Asteroid garbage before the fix: ~7.1k objects/s at 124 u/s (192/136/78 placements per rebuild).
- drei 10.7.8 useFBO keeps one target per mount, so the rear-view surface leaked only on unmount, not
  per FBO change.
- R3F 9.7.0 removeChild disposes only the object, never geometry or material props, and never a
  primitive. InstancedMesh.dispose() does not dispose its geometry.
- Client vitest 434/434; tsc (NODE_ENV=development typegen), biome and comment ratchet clean at 0afbef2.
- Headless /test-level tap at DPR 1: the mirror, nebula and asteroids render. Mine-body glow with tone
  mapping and hosted-room pickups: [unmeasured].

## Uncommitted

None.

## Held files

apps/client/app/game/scene/track-blocks.tsx — queued; workerfour (#277 B) holds it until the supervisor
frees it.

## Next

1. When track-blocks.tsx is free: dispose `geometry`, `cells` and `fractured.geometry` from ref-callback
   cleanups on the two instancedMeshes. Test, commit, push.
2. `gh issue close 275` with all SHAs.

## Open questions

- None.

## Lessons → memory

none
