Agent: workerthree · Lane: #394 black hole port — plan only · Updated: 2026-09-30

## Goal
Plan a port of the vgpu "optimized black hole" to three.js. Build nothing until the owner approves.

## Done
- Plan written: `.claude/phases/2026-09-30-black-hole-plan.md` (this commit).
- Earlier: exhaust blue-tail probe reported to slur-supervisor (no code). 6acf1345 (#389, CLOSED).

## State
- Source: all fragment passes, no compute. Bake (768-step geodesic march) + refine run once; shade + bloom per frame. Verified from `source.md`.
- Source output is greyscale (`SATURATION: f32 = 0.0`); the disk ramp under it is warm.
- Licence MIT, Copyright (c) 2025 Vercel, Inc. (GitHub API, this session).
- Our renderer is WebGL2 only; three 0.185.1 `RenderTarget` has `count` (MRT); `postprocessing` is WebGL-only.
- Recommended: option A (GLSL port into fixed-size offscreen targets, `prerender` phase), placement P2 finish landmark then P1 landing.
- GPU ms per tier in the plan are [unmeasured] estimates.

## Uncommitted
none

## Held files
none

## Next
1. Wait for the owner's answers via slur-supervisor (plan §8: placement, colour, CREDITS.md, frozen low tier).
2. On approval: claim the §7 file list with the supervisor, then build the prototype in the §7 order and measure with perf-analysis.
3. Exhaust: still parked until the owner says where the blue tail is seen.

## Open questions
- Owner: plan §8 questions 1–4.
- Owner: where is the exhaust blue tail seen; any leva Exhaust edits?

## Lessons → memory
none
