Agent: workerthree · Lane: boost pickup back-face chevrons (#370) · Updated: 2026-09-29

## Goal
The glow chevrons on the back face of the boost pickup point the same way as the shell.

## Done
- 57f2bfe (#370): onBothFaces flips the back glyph and core with rotateX(PI) instead of rotateY(PI). New test: on each face of the shell, glyph and core, the tip (|y|<0.05) is at a larger x than the arm ends (|y|>0.6).

## State
- Before the fix the test failed on the back face: glyph tip x −0.368 vs arm ends +0.368 (exact mirror). Shell passed on both faces.
- After the fix: boost-look.test 6/6, scene folder 45 files / 333 tests pass; tsc clean; biome clean on both files.
- Capture: an offline SVG projection of the real geometry (no GPU tab). Before = back glow forms an X across the shell; after = glow on the shell arms on both faces. Files are in the session scratchpad `cap/`.
- Live /test-level look [unmeasured].

## Uncommitted
none

## Held files
none

## Next
1. Idle. Owner checks /test-level: fly past a boost pickup and look back at it (B, mirror). The glow chevrons on the far face follow the dark shell arms. They no longer cross them.

## Open questions
none

## Lessons → memory
none (memory writes on hold during the supervisor's merge)
