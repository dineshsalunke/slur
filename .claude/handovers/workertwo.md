Agent: workertwo · Lane: monolith surface options (#228) · Updated: 2026-09-24, ~01:15

## Goal

The owner says the metal albedo on the monoliths adds little. Build a live switch between (A) the metal
maps with no albedo and the deck colour, and (B) the deck material outright. Take stills. The owner picks,
then clean up and update `docs/ART_MATERIALS.md` and `docs/ADD.md`.

## Done

- `ba17a58`: dev tunable `Monolith.surface` (0 = current metal, 1 = A, 2 = B), default 0.
  `MonolithGroup` renders three body materials. The extra two are JSX children with a no-op `attach`
  (`unattached`), so R3F owns them and disposes them. `useFrame` assigns `mesh.material`. B uses
  `floorSurface()` + `patchRailGlow`. `Monoliths` builds the rail mask once as an R3F `<dataTexture>`
  (`railMaskData` split out of `buildRailMask` in `rail-glow.ts`) and passes a `RailMask` ref down.
  `finish-gate.tsx` passes no mask, so its arches get no rail glow in B.
- Issue #228 filed.

## State

- At `ba17a58`: client tsc clean. Biome clean on the touched files. Comment ratchet passes. vitest 241/241
  (run before the final `chosenSurface` extraction, which only moved code).
- Stills (git-ignored), `/test-level`, ship at x 0 z 75, frozen, headless M1 Pro Metal, 1600×813,
  DPR 1: `.claude/frame-tap-refs/228-current-metal.png`, `228-a-flat-deck-colour.png`,
  `228-b-deck-material.png`. Pillar pair at z 120.
- Current is repeatable at that pose: the shot before and after the switch has identical stats.
- Pillar face luma (left 100×380 px / right): current 16.9 / 18.1, orange cast rgb(32,14,1).
  A 20.7 / 14.1, neutral, cooler, no texture. B 23.1 / 17.0, deck plate grid readable on the faces.
- B rail glow reaches the pillar's inner foot: luma 14.7 with the rail light off, 20.3 at 6, warmer.
  B's UVs are fine on vertical faces: square plates at deck scale.
- Scratch vite 5183 and headless Chrome 9338 are killed. Scratch-origin localStorage cleared.

## Uncommitted

None.

## Held files

`apps/client/app/game/scene/{monolith-group.tsx, monoliths.tsx, monolith-frames.tsx, rail-glow.ts}`,
`apps/client/app/dev/tuning-schema.ts`. `docs/ART_MATERIALS.md` and `docs/ADD.md` after the owner picks.

## Next

1. Wait for the owner's pick (0 / A / B).
2. Remove the losing paths and the `Monolith.surface` tunable. If B wins, decide whether `finish-gate.tsx`
   gets the rail mask. Drop `unattached` if only one material remains.
3. Update `ART_MATERIALS.md` §7 item 11 and `ADD.md` §4. Update memory `monoliths-are-metal-now.md`.
4. Earlier lane (#227): still waiting on the worktree and the 145 ms bake questions.

## Open questions

1. Owner: which surface, current / A / B?
2. Owner (still open): worktree for the `036645c` darkness stills; the 145 ms bake on the first race frame.

## Lessons → memory

none (the R3F-owned-material pattern is recorded in the commit; not yet a proven durable lesson)
