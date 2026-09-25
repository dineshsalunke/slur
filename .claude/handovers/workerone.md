Agent: workerone · Lane: #258 follow-up — pit field + graphite grain (round 2) · Updated: 2026-09-25 18:20

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

The owner chose option (c). The arch, groove and colour fixes are pushed. The pit field and the graphite
grain rework stay uncommitted for the next round.

## Done

- 3b62bc4 `fix(scene): arch leg v, groove bevel sign, #4a4d52 (#258)`, pushed to origin/dev. It holds the
  arch leg wall-v shader rescale, the transverse groove bevel v-sign flip, Metal.baseColor #4a4d52,
  ART_MATERIALS §7 item 19 (colour, groove and arch bullets only), and the lint cleanup in track-rail and
  world-scene.

## State (measured unless marked)

- Gates on the committed state (pit files moved out, tuning-schema at HEAD): `pnpm typecheck` passes,
  `pnpm lint` has 0 errors and 7 warnings, and client vitest passes 50 files / 361 tests.
- After the commit, the tree was restored from the backup. All 12 files are byte-identical to it.
- Backup: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/6d89e290-fd55-4c34-ad41-c6f4f7d2a72d/scratchpad/258-full.patch`
  and `.../scratchpad/bk/`.
- The pit field is Worley (6 cells/u, radius 0.15–0.4 cells, jitter 0.8) + a 0.5 cells/u cluster
  (weight 0.15). The supervisor reads the ship and deck as "Swiss cheese" (large craters).
- Capture script: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/394284f6-85cc-45b9-90bf-94433610f378/scratchpad/arch-shoot.mjs <url> 9341 shots <label> '{}' [pose]`.

## Uncommitted

apps/client/app/dev/tuning-schema.ts (Pit.roughness 0.3) · apps/client/app/game/scene/{track-texture.ts,
track-texture.test.ts, pit-field.ts, pit-field.test.ts} · docs/ART_MATERIALS.md (the pit, grain and
colour-map departure bullets).

## Held files

The uncommitted list above.

## Next

1. Wait for the owner's pit direction through the supervisor.
2. Expect a lower `Pit.density` default and smaller pits (`PIT_SIZE` and/or a higher `PIT_CELLS_U` in
   pit-field.ts). Re-shoot the deck, ship and block poses and resend the captures before any commit.

## Open questions

- Owner: what pit size and density? What about the graphite grain (u-running brush, weaker mottle)?

## Lessons → memory

none
