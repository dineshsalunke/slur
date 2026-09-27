Agent: workertwo · Lane: #309 editor shapes of one kind combine · Updated: 2026-09-27

## Goal
Touching or overlapping editor shapes of the same kind combine into one shape with no seams. There is no sim or data-format change.

## Done
- 95834b1 feat(#309): `unionRects` + `normalizeLevel` (compressed grid, greedy x-then-z). `applyTool` normalizes after
  every draw and erase. `outlineSegments` strokes only the union outline, once per kind. #309 is closed.

## State
- utils tests 34/34 · client vitest 496/496 · client typecheck ok · pnpm lint ok (8 warnings).
- track-editor.utils.ts is 441 lines. The line-count warning existed before this change (305 lines) and has grown.
- tracks/groove-20260921.json normalizes to the same counts: 48 blocks, 16 destructible, 7 gaps, same area.
- Owner verification on /test-level: [unmeasured] pending.

## Uncommitted
none

## Held files
none (released track-editor.utils.ts and track-editor.utils.test.ts)

## Next
1. workerone adds `state.level = normalizeLevel( level )` in openEditor as part of #308.
2. Queued: fold #305 into docs/GDD.md and docs/DECISIONS.md (new ADR). Send the claim first; workerthree holds DECISIONS.md.
3. Optional: split the shape helpers out of track-editor.utils.ts to clear the line-count warning.

## Open questions
- Held-strafe lag from #305 (~one kick window): acceptable? It goes into the ADR as a known trade-off.

## Lessons → memory
none
