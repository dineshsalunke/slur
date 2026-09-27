Agent: workerone · Lane: #323 square glyph frames on the pickup arc · Updated: 2026-09-27 (lane done, closed)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#323: the #322 pickup arc used diamonds for the empty slot and the bolt frame. Use squares.

## Done

- #318: 4b17a2e, fc85cd7. Closed.
- #320: b760826. Closed.
- #322: 7696144. Closed.
- #323: e499eee (pushed). Issue closed with the SHA.
  - `glyph-atlas.ts`: `DIAMOND` is now `SQUARE = roundRectPath( 8, 8, 32, 32, 2 )`. The empty slot and the bolt plate use it. The bolt's inner gem is a square too.
  - `app.css`: removed the unused `--drop-shadow-power-gem` and its comment.

## State

- Screenshots (headless, DPR 1, 1280×720, /test-level): square outlines on empty slots; square bolt frame when held.
  Scratch: `square-empty-zoom.png`, `square-held-zoom.png` in session scratchpad 438be093.
- Arc tests 6 pass, typecheck 0, lint 0 errors (8 old warnings).

## Uncommitted

None of mine. Owner data in `tracks/` is not mine.

## Held files

None. Lane finished.

## Next

1. Wait for the next lane from slur-supervisor.

## Open questions

- Other glyph frames are unchanged (seeker rounded square, mine star, boost chevrons, shield/portal circles, tug pill). Owner: say if every frame should be a square.
- From #320: is the exit-frame bloom too strong?
- #315, #308, `unionRects` order: still open from an earlier lane.

## Lessons → memory

none.
