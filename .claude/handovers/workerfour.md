Agent: workerfour · Lane: #277 P2 cleanup sweep, scene-render P2s · Updated: 2026-09-26, afternoon

## Goal

Land the #277 scene-render P2s (S1–S7 + P2-8). All landed. #277 stays OPEN (supervisor's call); the headless
look check moved to workertwo.

## Done

- b7df188, 62f663f — earlier #277 items (hit message constant, host handoff, start grid, dead shared code).
- 1b111b6 — track-blocks: no per-frame uSealedBevel/uSealedSeamWidth writes.
- d342d6d — batch B dead code.
- 8ad39b0 — S1: ship-dead.ts, hull-look.ts, colour sets only on change.
- e7ce4e7 — S2a: nebula-baker precomputed paths; projectile/seeker/mine-shock sinks built once.
- b706baa — S2b: mine-shots hoisted readEach callbacks; instanced-commit.ts.
- bb433b0 — S3: vfx-shard-pool.ts; explosions.tsx → explosion-field.tsx.
- 47cce3e — S4: bolt-embers / block-debris idle skips upload.
- 5505ed8 — S5: pickup-body.ts.
- 6b0fc62 — S6: track-rails.state.ts, one live slot { track, runs, segments, mask } shared by TrackFloor, TrackRail,
  Monoliths, FinishGate; old mask disposed on a new track. Single-slot checks in the commit body.
- acdffa9 — S7: ship.tsx → ships.tsx.
- 50c6e17 — P2-8: trackGround memoised per (track, broken set); segment cache evicts oldest.

## State

- At 50c6e17: client tsc 0 errors; vitest app/game + routes/test-level 375/375; comment ratchet clean; biome only
  pre-existing module-scope plugin warnings (measured, shared tree).
- Look of S3–S6 [unmeasured] — workertwo owns the headless check.

## Uncommitted

None.

## Held files

None — all S6/S7/P2-8 claims released.

## Next

1. Wait for the supervisor. Do not close #277.
2. DEFAULT_TRACK_GEN remains HELD for the owner's /pacing weave→groove decision (plan in git history of this file).

## Open questions

- /pacing weave→groove flip under DEFAULT_TRACK_GEN: owner OK? (via supervisor)
- Should `PACING_HULL_L` move to `TRACK_CONTRACT.shipHalfL`?

## Lessons → memory

none
