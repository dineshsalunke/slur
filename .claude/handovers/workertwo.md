Agent: workertwo · Lane: deck material on monoliths + blocks (#228) · Updated: 2026-09-24

## Goal

Owner pick B: *"lets use the deck material on the blocks and monoliths please"*. Code is done. Docs and
memory remain.

## Done

- `81c2b76`: monoliths use only the deck material (`floorSurface()` + `patchRailGlow`). Removed modes 0/A
  and `Monolith.{surface,metalness,roughness,envMapIntensity,textureSpan,normalScale}`. New
  `use-rail-mask.ts` (shared by `monoliths.tsx` and `finish-gate.tsx`), so the gate arches now get rail
  glow too. `unattached` moved to `unattached.ts` (the rail-mask `<dataTexture>` still needs it).
- `9688d40`: sealed, fractured and debris blocks spread `floorSurface()` and follow `Deck.*` through
  `applyDeckFinish` (`block-metal.ts` → `deck-finish.ts`). Block shader UVs are world/span and bypass
  `texture.repeat`, so span = `TEX_SPAN_X / map.repeat.x` (`deckTextureSpan`). Deleted the Metal046B
  jpgs, `sealed-block-material.ts`, `sealed-block-texture.ts`,
  `Block.{textureSpan,normalScale,roughness,metalness,envMapIntensity}`, `Metal.mapTint` and
  `METAL_MAP_TINT`. Seams, wear, bevel and fracture glow are unchanged.
- Owner answers (via supervisor): no `Block.*` value dial (R1). No rail glow on blocks for now.

## State

- At `9688d40`: client tsc clean. Biome clean on the touched files. Comment ratchet passes.
  vitest 241/241.
- Stills (git-ignored), `/test-level`, headless M1 Pro Metal, 1600×813, DPR 1, frozen:
  `.claude/frame-tap-refs/228-deck-blocks-z75.png` (same pose as the 228 stills, x 0 z 75),
  `228-deck-blocks-sealed.png` (x 20 z 132), `228-deck-blocks-fractured.png` (x −24 z 1046, block 3392).
- The z 75 pillars match `228-b-deck-material.png`.
- Far block 448 at z 75: new rgb(29,13,15), old rgb(38,17,1). The orange cast is gone.
- Close sealed block: face rgb(25,11,18) to (35,13,10), deck beside it rgb(50,32,28). The face is darker
  than the deck. A plate joint crosses the block at mid-height, in line with the deck grid. The vertical
  marigold seam is visible.
- R3 (wear colour #2c3138 on the deck base): no wear patch is visible on the one close block I shot. I
  did not retune it. Judged on one block only, so this does not prove wear is gone everywhere.
- Fractured block 3392: the crack glow still reads. The body is neutral and deck-like.
- Scratch vite 5187 and headless Chrome 9339 are killed. Vite on 5183 (pid 37735) is not mine. I left it
  running.

## Uncommitted

None.

## Held files

`apps/client/app/game/scene/{monolith-group, monoliths, monolith-frames, finish-gate, use-rail-mask,
unattached, rail-glow, track-blocks, block-debris, deck-finish, sealed-block-shader,
fractured-block-shader, metal}`, `apps/client/app/dev/{tuning-schema, tuning-panel}.ts(x)`,
`docs/ART_MATERIALS.md`, `docs/ADD.md`, `.claude/memory/monoliths-are-metal-now.md`.

## Next

1. `docs/ART_MATERIALS.md` §7: add item 12, a decisions + departures entry. Quote §M2: *"The separation
   from the deck is finish, not value. A coated dielectric block and a bare metal deck respond to the
   same light in visibly different ways"*. Record that blocks and monoliths now use the deck material
   (owner, 2026-09-24), with no value dial. Also amend item 11 and the element→material table (lines
   ~444–448): blocks and monoliths → deck (M1).
2. `docs/ADD.md` §4: same change, short.
3. Replace memory `monoliths-are-metal-now.md` with `deck-material-on-blocks-and-monoliths.md`. Update
   the `MEMORY.md` line.
4. Follow-up for whoever holds `track-floor.tsx`: it keeps an inline copy of `applyDeckFinish`. Fold it
   into `deck-finish.ts`.
5. Earlier lane (#227): still waiting on the worktree and the 145 ms bake questions.

## Open questions

1. Owner: does R3 need a follow-up? Wear patches do not show on the close block (one sample).
2. Owner (still open): worktree for the `036645c` darkness stills; the 145 ms bake on the first race
   frame.

## Lessons → memory

none this seam. The memory replacement is Next item 3.
