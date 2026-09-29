Agent: workerone · Lane: #361 home controls panel (done) → EngineLight marigold (#359 follow-up) · Updated: 2026-09-29

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#361 done. Next: EngineLight.color default → marigold accent (owner). #354 part 2b waits on the owner.

## Done

- `0ca2c3b` #361 (CLOSED): Controls panel on `/`. Labels come from the input constants through
  `game/input/key-label.ts`. `powerHint()` uses the same source and prints the same text.
- #354 earlier: `3c576aa` `668df76` `f0562e7` `a249221` `59aa760` `6cb1f36` `7cb7e05` `bb86b64` `e80f54f`.
- `0bb4b5b` #359 (CLOSED): EngineLight.back measured from the rearmost exhaust port.

## State

- #361 [measured, Playwright 1440/1024/390/390-touch/844×390-touch]: the menu strip y is the same as
  before at every size except 390 fine-pointer (+60 px, the page scrolls). Panel hidden at ≤480 px tall.
- #354 2b [measured]: along-z anisotropy smears the planet HDRI lobe (+15 luma at 0.5, +32 at 0.9).
  Along x there is ~no change. Options sent: (a) drop [recommended], (b) dials at 0, (c) 0.15 along z.
- Scripts: `shot.mjs` (home viewports) in scratchpad `8c6b5276…`; the 2b scripts are in `19862e93…`.
- No headless Chrome running.

## Uncommitted

- none.

## Held files

- `dev/tuning-schema.ts` + `dev/tuning-panel/tuning-panel.tsx` (back from workerthree, 9c2ce73).
- `engine-light/*`, `deck-reflection/*`, `block-reflections/*`, `pickup-reflections/*`,
  `exhaust-reflections/*`, `track-floor/track-floor.tsx`, `track-blocks/*`, `pickup-field.tsx`,
  `exhaust-field/*`, `deck-breakup.ts`, `docs/DECISIONS.md`, `docs/ART_MATERIALS.md`,
  `track-texture.ts`, `track-materials.ts`.

## Next

1. EngineLight.color default → marigold accent in tuning-schema.ts. Re-measure the nozzle hue with
   `nozzle.mjs`/`hue.mjs` (scratchpad `dce8336e…`). Cite 0bb4b5b on #359.
2. Also: Environment.rotation 180 + Metal.baseColor #595c62 defaults, and a `Reflect.blur` dial.
3. Apply the owner's 2b answer (see the previous handover version for the 3-line Physical swap).
4. Close #354 with SHAs.

## Open questions

- Owner: #354 2b option (a)/(b)/(c)?
- Owner: are the block seam streaks right (length, blur rate)?

## Lessons → memory

- none this seam.
