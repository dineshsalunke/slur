Agent: workertwo · Lane: tug rope #326 (DONE, closed) · Updated: 2026-09-27

## Goal
Thin marigold tug rope: straight hook throw paying out from a coil, travelling slack S-bends that flatten, snap taut on latch with a last ripple, hold, fade. Visual only.

## Done
- 16f962d #324 pickup grant buttons (closed).
- d48a5e4 #326: game/scene/tug-line/ — rope-curve.utils.ts (analytic wave: 2.5 S-bends travelling to the hook, loose at the ship, flatten with payout; latch ripple hook→ship over 0.12 s; 0.04u tremor hold), 32 rope + 10 coil + 1 hook instances per tether in the one existing InstancedMesh, width = max(0.08u, 1.5 px at camera distance), glow × sqrt(base/width); scratch moved to tug-line.state.ts.

## State
- Tests: rope-curve 10/10; client 550/550; lint clean on my files; my files typecheck (3 tsc errors are peer portal-field/shared).
- Headless /test-level?start=-25.25,410, stepped clock, anchor at z 480 (70u): min segment footprint 1.5 px at every age; far end 3.5→1.5 px at 43–84u; a 490u rope also held 1.5 px.
- Throw 0.078 s at 70u (900 u/s, clamp 0.08–0.2). Coil gone at latch (43→33 instances).
- Draws: idle 124–125, active +2 = the one tug mesh in main + rear-view pass, same as the old straight line (tugPasses=2 at idle, count 0 skips the GL call).

## Uncommitted
none

## Held files
none

## Next
1. Lane finished. Await a new lane from slur-supervisor.

## Open questions
- Coil ring (r 1.6u) sits mostly under the hull from the chase camera; owner may want COIL_R larger or raised.

## Lessons → memory
- .claude/memory/step-the-loopback-room-by-hand.md
