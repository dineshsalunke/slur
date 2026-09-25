Agent: workerone · Lane: monolith material regression (supervisor-assigned, plan stage, no issue yet) · Updated: 2026-09-25

Older versions hold the #255 groove and /beat-deck history (`git log -p -- .claude/handovers/workerone.md`).

## Goal

Fix two faults on monoliths (and blocks): a texture that looks stretched up tall faces, and warm tan
colour in place of the old cool blue-grey. Plan first. Build nothing until the supervisor clears it.

## Done

- Cause of fault 1 found (read from code, confirmed by captures). No commits yet.
- Captures at DPR 1, headless, frozen, `/test-level?gen=weave`, in the scratchpad
  `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/7dd95ed2-8865-4321-9914-997b633bdfc2/scratchpad/`:
  `{before-base,head-base,fix-uv,fix-uvcol}-{spawn,monolith,block,gap}.png`.
  before = 3c44038^1, head = 2a2626b, fix-uv = HEAD + UV prototype, fix-uvcol = prototype + pre-#230
  lights and finish.

## State

- d9b7227 set `ROWS` 1 in `track-texture.ts`, and `TEX_SPAN_Z = AUTHOR_PLATE_U * ROWS` fell from 16u
  to 4u. The deck UV is `[x / TEX_SPAN_X, z / TEX_SPAN_Z]` (`track-geometry.ts:28`), so the deck shows
  the 16u-tall painted tile squeezed into 4u. Deck plates are still 4u × 4u, not 4u × 16u.
- Monolith UVs (`monolith-geometry.ts:86`) and block UVs (`sealed-block-shader.ts:83`,
  `fractured-block-shader.ts:82`) divide both axes by 16u. Their vertical texel density is 4× lower
  than the deck. Plates read 2u × 8u on monoliths, 4u × 16u on blocks, with 6u brush streaks upright.
- Deck slab sides (`uvFor` 'zy') have the mirror fault: z / 4u on U, y / 16u on V. Seen in the gap
  walls (`head-base-gap.png`).
- The prototype (walls divide V by `TEX_SPAN_Z`) brings back the 2u square grid on monoliths
  (`fix-uv-monolith.png` against `before-base-monolith.png`). Deck unchanged.
- The old lights and finish set live over the prototype bring the cool blue-grey back
  (`fix-uvcol-*.png`).

## Uncommitted

None.

## Held files

None until the supervisor clears the claims.

## Next

1. Wait for the supervisor: plan approval, file claims, issue number.
2. Then build the plan sent in the message of 2026-09-25, test, lint, capture, commit.

## Open questions

- Owner: walls match the current deck (recommended, deck unchanged) or the deck gets the real 4u × 16u
  plates (`TEX_SPAN_Z` back to 16u, a visible deck change)?
- Owner: `Metal.baseColor` back to #7c8590 also re-tints the ship hulls (`ship-model.tsx:156`).

## Lessons → memory

none
