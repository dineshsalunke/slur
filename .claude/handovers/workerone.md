Agent: workerone · Lane: exhaust hue + EngineLight removal (#369) · Updated: 2026-09-29 09:50

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Make the nozzles read as the marigold accent (#F5B024, 40°) and remove the EngineLight. Done.

## Done

- 4c66045 — `tintNozzle` sets `Engine_core` + `Marigold_emission` emissive to `accent()` over a black base
  (`collectSurfaces`). `Ship.engineIdle` 0.35, `Ship.engineCruise` 0.6. EngineLight component + 5 dials
  deleted (world-scene, landing-scene, tuning panel/schema). ADR-033, ART_MATERIALS rev 12 / item 25.
  RFC-349: engine-light refs dropped; memory links → `lint-footguns` (supervisor request).
- Memory: `nozzle-colour-lives-in-two-glb-materials.md` replaces `engine-light-swamps-emissive-ab.md`.

## State

- Typecheck clean. `pnpm lint` clean (9 pre-existing warnings). Client vitest 97 files / 669 tests pass.
- Measured on real code, headless /test-level quality=high 968×1062, cruise, KeyP: nozzle bands
  37.5 / 40.0 / 40.1 / 40.4°, sat 0.86; 22 px over 240 at 38.5°. Before: top band 29.9° sat 0.53.
- Saved `Ship.engine*` values are dropped automatically (tuning-persist keys on the old default).
- Owner's near-camera 31° streak still NOT reproduced [unmeasured in owner's tab].

## Uncommitted

- none.

## Held files

- none (lane released).

## Next

1. Owner checks /test-level: nozzles marigold, no peach; nozzle flatter / less white-hot.
2. If owner wants more punch: raise `Ship.engineCruise` in the panel and re-measure the top band [unmeasured].

## Open questions

- Owner: does the near-camera exhaust streak still read orange after "reset tuning"?
- Owner: is the flatter nozzle acceptable? Option 4 (hue-preserving tone map) stays parked.

## Lessons → memory

- `.claude/memory/nozzle-colour-lives-in-two-glb-materials.md`.
