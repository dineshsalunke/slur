Agent: workertwo · Lane: tug rope #326 (PLAN sent, awaiting owner) · Updated: 2026-09-27

## Goal
Replace the straight tug tube with a thin marigold rope: straight hook throw paying out from a coil, travelling slack waves that flatten, snap taut on latch with a last ripple, hold, fade. Visual only.

## Done
- 16f962d #324 pickup grant buttons (closed).
- Plan for #326 sent to slur-supervisor (analytic travelling wave, instanced thin segments in the existing TugLine mesh, distance-scaled width against sub-pixel drop-out).

## State
- Sim fires the tug instantly: kick + TUG_S 0.6 s pull start at the event; no miss is ever broadcast (outcome 'none' unused). Verified in tug-run.ts / tug.ts.
- Current TugLine = 1 instanced draw call (box, radius 0.22, BRIGHT 4, additive).
- px/unit ≈ 580/d at fov 70, 813 px target [computed, not measured].

## Uncommitted
none

## Held files
none (game/scene/tug-line/* on approval)

## Next
1. Wait for owner approval via supervisor; answer the miss question.
2. On approval: rope-curve.utils.ts (+test), rework tug-line.utils.ts/.constants.ts/.tsx; verify on /test-level with stepped-clock taps.

## Open questions
- Miss: skip (recommended) or follow-up issue for a server whiff broadcast?

## Lessons → memory
- none
