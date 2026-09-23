Agent: workertwo · Lane: destructible block rebuild (#222) · Updated: 2026-09-23, ~20:45

## Goal

#222: rebuild the fractured block and its break to match `docs/art-direction/ingredients/blocks/blocks.png`
(panel 2 look, panel 5 INTACT → HIT → BREAK → CLEAR). The owner approved the plan with answers: bolt
pre-glow and no hold after a break · about 12 cells · chunks vanish in the air · debris is VFX only ·
destructible only · bloom-only flash · the #214 questions stay open.

## Done

- `4589412`: `docs/ART_MATERIALS.md` §7 item 15 (three departures: no tall/stack, no HIT on a smash,
  chunks vanish in the air).
- `2ab2c2c`: the build. The commit body holds the mechanism weighing.
  - `fractured-block-geometry.ts`: a seeded Voronoi of the unit box, 2×3×2 jittered seeds give 12
    convex cells. Attributes: aFracture (0 outer / 1 wall), aCellCentre, aCellHalf, aCellSeed.
    `shareCells()` and `fractureOrient(id)` (8 proper rotations).
  - `fractured-block-shader.ts`: one patch for intact and debris (`FRACTURE_DEBRIS` define). The
    world-unit gap is a per-axis shrink about the cell centre. Walls are marigold at the lip and
    #FFE0A0 at depth. The debris is analytic ballistic motion plus a spin from aBreak/aBreakMeta.
  - `block-breaks.ts`: standing-set diff → break events. A mend cancels the debris. `noteBolt` buffer
    and `boltCloseness` feed the pre-glow.
  - `block-debris.tsx`: 16 slots, one draw call. `block-burst.tsx`: the flash, 16 additive instances.
    Embers come through the existing `pushHit`.
  - `track-blocks.tsx`: the instanceMatrix is translation only. aBlock = (w, h, d, orient) and
    aFractureGlow = 1 + preGlow·c².
  - `bolt-streaks.tsx`: one `noteBolt( x, y, z )` call in `sink`.
  - `tuning-schema.ts`: Fracture.* and Break.* keys were added. No existing key changed.
- `fef4a21`: ADR-015 amendment in `docs/DECISIONS.md`.

## State

- At `2ab2c2c`: client vitest 231/231, tsc clean, biome clean on the touched files, comment ratchet passes.
- The fracture tests pass: volumes sum to 1, cells are convex, ≥4 plates on each face, ≤600 tris,
  deterministic.
- One headless still at 30u (block 3392) shows a glowing crack web on the front face. It renders
  without errors.
- The crack lines looked thin at 30u. The tuning is `[unmeasured]`: no range stills and no taps.
- The break sequence (debris, flash, pre-glow) has NOT been seen on screen. `[unmeasured]`
- The mend-cancel and late-join behaviour are not tested. `[unmeasured]`
- The headless Chrome (9338) and the dev server (5186) are killed.

## Uncommitted

None of mine. Other workers have edits in `packages/shared/src/{combat/*,schema.ts,sim-config.ts}`.
The `docs/art-direction/**` files are untracked and belong to ChatGPT. Never add them.

## Held files

The eight #222 client files: `scene/{fractured-block-geometry.ts, fractured-block-geometry.test.ts,
fractured-block-shader.ts, block-debris.tsx, block-breaks.ts, block-burst.tsx, track-blocks.tsx}` and
`game/block-state.ts` (claimed, not changed). Released: `ART_MATERIALS.md`, `DECISIONS.md`,
`tuning-schema.ts`, `bolt-streaks.tsx`. The supervisor must re-clear any of them before I edit it again.

## Next

1. Visual verification. The method is in `.claude/memory/place-the-ship-over-cdp.md`: a scratch client
   `CLIENT_PORT=5186 VITE_SERVER_PORT=2586`, headless Chrome on 9338 (DPR 1, muted), and the CDP driver
   `cdp.mjs` (copy it from any old scratchpad and set the port).
   a. Take range stills of sealed and fractured side by side at 20, 50, 100 and 200u.
   b. For a break sequence, place the ship, then `blockWorld.broken.add(3392)`. Shoot at 0, 60, 150,
      300, 600 and 900ms. Freeze may not stop the debris clock, because it runs on `state.clock`.
   c. For the pre-glow, fire a bolt with a held bolt, or check the aFractureGlow values over CDP.
2. Tune `Fracture.gap`, `Fracture.glow` and the Break.* defaults from those stills. That needs a re-claim
   of `tuning-schema.ts`.
3. Measure CPU ms and `renderer.info` draw calls, before (`8f93c72`) and after.
4. Send the stills to the supervisor for the owner's race-speed readability check (the ADR-015 gate).

## Open questions

1. The #214 questions stay open: do sealed blocks stop a bolt, and is there one smashKeep for every class?
2. A remote player's smash animates as a bolt break (impact at the front centre). It has no lane
   clearing. Fine for now?

## Lessons → memory

- `.claude/memory/place-the-ship-over-cdp.md` (new, indexed in MEMORY.md)
