Agent: workerone · Lane: graphite material unification (no issue yet) + Meteor.chance 0.15 · Updated: 2026-09-25

Older versions hold the monolith-regression diagnosis, #255 groove and /beat-deck history
(`git log -p -- .claude/handovers/workerone.md`).

## Goal

The owner's definition: one dark graphite pitted metal for everything (deck, monoliths, blocks,
walls, ships, pickups). Only the deck keeps the 4×4u plate grid. Also set Meteor.chance 0.65 → 0.15.
Plan first. Build nothing until the supervisor clears it.

## Done

- Re-plan sent to slur-supervisor on 2026-09-25. No code commits.
- Earlier captures (before-base / head-base / fix-uv / fix-uvcol × spawn/monolith/block/gap) are in the
  old session scratchpad `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/7dd95ed2-8865-4321-9914-997b633bdfc2/scratchpad/`.

## State

- The plate grid is already a switch: `eachJoint` (`track-texture.ts:150`) returns when `joints` is
  false. Graphite = the same painter with `joints:false`.
- The texture has no pitting today. It must be added as a new seeded layer (normal + cavity + roughness).
- The deck texture is anisotropic (ROWS=1): 64 px/u in x, 256 px/u in z. A pit painter needs a
  separate V density.
- The block shaders (`sealed-block-shader.ts:83`) and monolith UVs (`monolith-geometry.ts:86`) already
  divide both axes by TEX_SPAN_X. They stretch only because they sample the plate texture.
- The floor is one mesh with one material, top and slab sides (`track-floor.tsx:124`). The walls need
  geometry groups to go jointless. `uvFor` 'zy' (`track-geometry.ts:29`) uses TEX_SPAN_Z on U.
- Ship hulls = non-emissive MeshStandard materials (`ship-model.tsx:86`). The engine is picked by
  name (`ship-materials.ts:17`).
- The pickup shells are dielectric #161b21, metalness 0, roughness 0.3 (`combat-look.ts:14-15`).
- #230 raised Env.fill 0.14→0.5, Fill 0.35→1, Deck/Rail envMap 1→1.5 (546130d).

## Uncommitted

None.

## Held files

None until the supervisor clears the claims. Claimed in the plan: scene/{metal, track-texture,
track-materials, deck-finish, monolith-group, track-blocks, block-debris, track-floor, track-geometry,
ship-model, combat-look, bolt-pickups, seeker-pickups}, dev/{tuning-schema, tuning-panel},
docs/ART_MATERIALS.md.

## Next

1. Wait for the supervisor: clearance plus the owner's answers to Q1–Q4.
2. File the issue. Build steps 1–11 of the plan message, then test, lint and capture (DPR 1, frozen, the 4
   poses + a ship + a pickup; keep vs pre-#230 lights). Commit by pathspec.

## Open questions

- Q1 Do the rail bodies go jointless? (read: yes)
- Q2 Do the asteroids and meteors stay M5 rock? (read: yes)
- Q3 Are the pits dents only, with no colour change? (read: yes)
- Q4 Colour: #3b3e42 as the default, with #4a4d52 shown for comparison.

## Lessons → memory

none
