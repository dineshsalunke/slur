Agent: workertwo · Lane: monolith gate + arch, finish reset (#220); #214 parked · Updated: 2026-09-23, ~20:10

## Goal

#220: the finish is a monolith GATE, ARCHes stand at 25/50/75%, and `/test-level` resets the ship to the start
after the finish with a fade. #214 stays parked on the owner's eyes-on check.

## Done

- `921ee24` — #220 steps 1–5 in full.
  - `MonolithGroup` takes `shape` + `bodies` + `seams` transforms and skips the seam mesh when `seams` is empty.
  - `monolith-frame.ts`: `FrameConfig`, `GATE_FRAME`, `ARCH_FRAME`, `legShape`, `lintelShape`, `frameParts`.
    `RAIL_OUTER` is now exported from `monolith-transforms.ts`.
  - `monolith-frames.tsx`: `MonolithFrames` (legs + lintels, two instanced groups).
  - `arch-field.ts`: `archRows`, `archHeight`, `monolithLayout`. `monolith-field.ts` gained `intensityAtZ`
    and `pillarPairs`.
  - `finish-gate.tsx`: GATE frame + marigold floor strip at `finishZ`, still mounted in `WorldScene`.
  - `finish-reset.ts` (pure stepper + singleton), `finish-fade.tsx` (z-30 black div, covers the HUD),
    `run-clock.ts` `restartRunClock`, `local-combat.ts` `restartLocalCombat` (clears Held + seekers + bolts +
    pickups + blocks), `local-loop.tsx` `restartTestRun`. The fade is mounted in `TestLevelCanvas`.
  - The NN-13 weighing (the DOM overlay won) is in the commit body.
- `f9248ef` — pillars. Earlier #214 SHAs: `523d63c`, `b6f1f45`, `8c9afaf`, `248096d`, `215159e`.

## State

- At `921ee24`: client vitest 219/219 (32 files), tsc clean, `pnpm lint` clean.
- Headless /test-level, scratch port 5186, DPR 1:
  - The gate stands at z 8400 = finishZ.
  - The mid-fade frame darkens the scene and the HUD.
  - After the fade: z 0, vz 0, finished false, Held 0, phase idle, clock 00:01.
  - Chrome and the scratch server were killed.
- Arches at 25/50/75% were not shot on screen [unmeasured visually]. Tests cover their placement.
- A gate seam is sub-pixel at 450u and farther [inferred from a 0.5u seam width]. It shows up close.

## Uncommitted

None of mine. (`docs/art-direction/**` untracked files belong to ChatGPT. Never add them.)

## Held files

Release all #220 claims back to the supervisor. No file is held.

## Next

1. The owner plays /test-level: flies through an arch and the gate and watches the reset.
2. Tuning is possible if the owner asks: arch/gate sizes are constants in `monolith-frame.ts`, `ARCH_GROWTH`
   in `arch-field.ts`, and the fade times in `finish-reset.ts`.
3. #214 step 5 whenever the owner plays it.

## Open questions

1. #214: do sealed blocks stop a bolt (built as yes)? One `smashKeep` for every class? A marigold ember burst
   on a break?
2. #220: should the gate seam be wider or brighter so it reads from far away? Today it is the pillar
   `EDGE_SEAM`, 0.5u wide.

## Lessons → memory

none
