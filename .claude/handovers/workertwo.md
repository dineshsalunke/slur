Agent: workertwo · Lane: HUD tug icon redraw #332 (DONE, closed) · Updated: 2026-09-27 22:55

## Goal
Redraw the tug HUD glyph to match the 'HUD / READY · LATCHED' panel on docs/art-direction/ingredients/tug-line/concept-board.png.

## Done
- d883422 #332: the tug cell in apps/client/app/game/scene/power-arc/glyph-atlas.ts is redrawn. It has four pieces (fleck, chevron spine, hooked foot, octagonal eye) and a void hole. Each piece has a solid marigold fill over a 2.4-unit void outline (`inlay`), and those outlines cut the seams. Points were traced from a crop of the board and mapped into the 48-unit viewbox. It has no plate, unlike the other glyphs, because the board has none.
- Closed #332.

## State
- Render sites: only the atlas. The #322 arc slot and the pickup flash share the cell. #322 (7696144) deleted the corner gem, and the touch buttons are text labels. Verified by grep this session.
- Headless capture at DPR 1 with --mute-audio (Playwright, closed after): the atlas cell at 128/64/28 px, and /test-level with slots [tug, bolt, shield]. The tug reads at all three sizes and in the arc.
- power-arc tests 6/6, typecheck clean, lint clean (9 warnings, none in glyph-atlas.ts).
- Owner /test-level check not done [unmeasured].

## Uncommitted
none

## Held files
none (lane done)

## Next
1. Await the owner's /test-level check and a new lane from slur-supervisor.

## Open questions
- At small sizes the fleck is under 2 px. It is harmless, but it could be dropped if the owner wants a cleaner small icon.

## Lessons → memory
none
