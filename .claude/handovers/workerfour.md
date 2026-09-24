Agent: workerfour · Lane: ship-class speed retune #247 (active) + PR #195 merge (PAUSED) · Updated: 2026-09-24

## Goal

#247: set the approved top speeds and accels. Add per-class brakeDecel and retune strafe once the owner
approves the numbers. #195: paused, waiting on the owner.

## Done

- #247 filed. Brake and strafe proposal sent to slur-supervisor. No code yet.
- #195: conflict list and plan sent to slur-supervisor earlier. Nothing committed or pushed.

## State (verified this session)

- Approved: Interceptor 84/60 · Fighter 96/58 · Comet 112/66 · Phantom 90/52 · Freighter 124/30.
- Proposed (brake · strafeAccel/Clamp/Damp): I 150 · 300/120/22 · F 130 · 210/95/16 · C 100 · 230/105/9 ·
  P 120 · 175/90/14 · Fr 150 · 118/65/10 (unchanged). rosterContractFailures = [].
- Warning measure = spacingSegments(0.5) × SEG_LEN = 60u, divided by top speed (the b998e6c method).
- Measuring script: scratchpad `measure.mjs` (session-local). It imports shared dist, takes a JSON of
  per-class overrides, and prints 0->top, thread, brake->thread, warning, dodge4 z and release drift.
- Tests that read class tuning: pacing/pockets.test, pacing/grid.test (workerone), sim/pocket.test
  (workerthree), plus ship-classes, seeker, graze, track, track-contract and client hover.test.
- #195 worktree `../slur-worktrees/merge-195` is detached at origin/dev `74a7b89`. PR ref: `refs/remotes/pr/195`.
  Rebase conflicts: 9af27e0 step.ts (the bounce is dead on dev) · 0dc8c7d, 7 conflicts plus tunables.ts
  modify/delete · 8fbb223 ship-model.tsx · 01947c2 the phases doc.

## Uncommitted

None.

## Held files

packages/shared/src/ship-classes.ts, ship-classes.test.ts, and sim/track-contract.test.ts if a fixture
moves. GDD §5.5: needs the supervisor's clearance after workerthree commits.

## Next

1. Wait for the owner's answer on the brake/strafe proposal: (a) approve, (b) Freighter brake/strafe
   variant, (c) Comet damp 9 or 11.
2. Edit ship-classes.ts. Run pnpm test, typecheck and lint. Report any pacing or pocket test break to the
   supervisor, and do not edit those tests. Commit by explicit pathspec, with `Closes #247`.
3. #195: owner calls A/B/C, then rebase in the worktree, push HEAD:dev and clean up.

## Open questions

- #247 proposal choices (a)/(b)/(c).
- #195 owner calls A (drop the rail bounce), B (engine retune or drop the commit), C (push and close).
- Delete `game/net-debug-hud.tsx` (carried over).

## Lessons → memory

none
