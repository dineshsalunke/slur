Agent: workertwo · Lane: #309 editor shapes + #305 docs · Updated: 2026-09-27

## Goal
#309: touching editor shapes of the same kind combine into one shape with no seams. #305 docs: the GDD and an ADR record the 4u strafe step.

## Done
- 95834b1 feat(#309): union normalize + one outline per shape. #309 is closed.
- 0ac518e refactor(#309): shape helpers moved to track-editor/editor-shapes.utils.ts (normalizeLevel, subtractRect,
  overlaps, unionRects, outlineSegments). Move only.
- 8d37e8d docs(#305): GDD strafe kick paragraph, class table (kickDistance, kick window), feature row; ADR-024.

## State
- utils tests 34/34 · client vitest 496/496 · client typecheck 0 errors · Biome clean on touched files.
- track-editor.utils.ts is 309 lines (305 before #309).
- groove-20260921.json normalizes to the same counts: 48 blocks, 16 destructible, 7 gaps.
- ADR-024 fields checked against code: kickLeft/kicking/strafeHeld are in schema.ts, and kickLeft is in SIM_FLOAT_KEYS.
- Owner verification of #309 on /test-level: [unmeasured] pending.

## Uncommitted
none

## Held files
none

## Next
1. workerone imports normalizeLevel from './editor-shapes.utils' in openEditor (#308).
2. Wait for a new lane from slur-supervisor.

## Open questions
none

## Lessons → memory
none
