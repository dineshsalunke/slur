Agent: workerthree · Lane: #394 black hole prototype (finish landmark) · Updated: 2026-09-30

## Goal
Port the vgpu black hole (option A) as a finish-line landmark, cold tint, for the owner's look check on `/test-level?blackhole=finish`.

## Done
- Plan: 87dd59db.
- Prototype + CREDITS + as-built numbers: this commit (see `git log -1 -- apps/client/app/game/scene/black-hole`).

## State
- Renders on high/medium/low with no shader errors (headless Metal, DPR 1 shots in scratch, gone after clear).
- Steady GPU delta on vs off: high −0.3, medium +0.3, low +0.2 ms — inside meter noise. +2 draw calls.
- Rebake (mount or pitch/roll/distance change): up to ~34 ms frames for ~8 frames at high (refine through the photon ring).
- Low tier is 384² frozen (256² showed stepping at the shadow edge).
- Issue #394 left OPEN: owner signs off the look first.

## Uncommitted
none

## Held files
- apps/client/app/game/scene/black-hole/** (until the owner's look verdict)

## Next
1. Wait for the owner's look verdict via slur-supervisor. Tune only through `BlackHole.*` dials.
2. On approval: follow-up issue to move the landmark from the `/test-level` param into `WorldScene` (hosted rooms), drop the param, and decide the rebake hitch (more refine bands or bake during load).
3. Exhaust blue tail: still parked.

## Open questions
- Owner: look verdict; landmark height/size defaults; keep the lensed nebula?

## Lessons → memory
none
