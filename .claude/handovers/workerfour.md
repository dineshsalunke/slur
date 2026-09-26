Agent: workerfour · Lane: #277 P2 cleanup sweep (review lane G) · Updated: 2026-09-26, afternoon

## Goal

Work through the #277 P2 list (issue body + `.claude/phases/2026-09-26-review/*.md` P2 sections). Close #277
with the SHAs when done, or split the rest into smaller issues.

## Done

- b7df188 — `HIT_MESSAGE` + `HitMessage` in `combat/constants.ts`; dropped host hands START to a connected racer.
- 62f663f — `START_STAGGER_U = 4` + `startGridX(seat)`; shared typecheck covers tests; dead `groupPockets`,
  `grooveLineX`, `type Phase` deleted.
- 1b111b6 — `track-blocks.tsx` no longer writes `uSealedBevel`/`uSealedSeamWidth` per frame. File released to
  workerone (#275 dispose work).
- d342d6d — batch B: deleted `dev/from-user.ts`, `environment.tsx`, `gradient-dome.tsx`, `env-config.ts`;
  `accent.ts` is `ACCENT_ANCHOR` + `accent()` + `accentDerived()` (computed once); dropped
  `ENVIRONMENTAL_MARIGOLD_*`, `SealedBlockWear.strength`; `sealedBlockPerimeter`, `pillarField`,
  `lowestHullY` moved into their tests.
- Already gone before this lane: `ui/tag.tsx`, `net-debug-hud` (e40e89d), `ColorDot`.

## State

- Client scene vitest 31 files / 240 tests pass; client `tsc --noEmit` 0 errors; biome clean on the 8 touched
  files; comment ratchet clean (measured at d342d6d, shared tree).

## Uncommitted

None.

## Held files

None.

## Next

1. **DEFAULT_TRACK_GEN — HELD for owner decision** on the /pacing weave→groove flip.
   Plan: `DEFAULT_TRACK_GEN = 'groove'` in `sim/space.ts`; `procgenDescriptor` default, `schema.ts:90,101,116`,
   `run-room.ts:94`, test-level `DEFAULT_GEN` (waits for workertwo #283 B1/B7). Tests calling
   `procgenDescriptor( seed )` get explicit `'weave'`. Only non-test caller omitting the gen:
   `routes/pacing/analyze-worker.ts:18`.
2. Scene render P2s (claim first; check #283/#275 have not moved the files): `isDead` dup (ship-model/ship-shadow),
   `Color.set(string)` caching (ship-model, ship-shadow, rail-glow), nebula-baker template keys, per-frame
   closures (projectile-field, seeker-field, block-debris, hit-spark, mine-shock, mine-shots, mine-bodies),
   idle VFX pools (bolt-embers, block-debris, explosions, hit-spark), explosions/hit-spark pool merge, pickup
   builder dup (bolt/mine-pickups), rail mask ×2, renames `explosions.tsx`→`explosion-field.tsx`,
   `ship.tsx`→`ships.tsx`.
3. UI: truncated `useEffect` comments ×10 (workerfive report P2-2); player hex colours (check #284).
4. Close #277 with all SHAs, or file the leftovers as a new issue.

## Open questions

- /pacing weave→groove flip under DEFAULT_TRACK_GEN: owner OK? (via supervisor)
- Should `PACING_HULL_L` move to `TRACK_CONTRACT.shipHalfL`?

## Lessons → memory

none
