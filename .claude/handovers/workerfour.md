Agent: workerfour · Lane: ship-class retune #247 (DONE) + PR #195 merge (PAUSED) · Updated: 2026-09-24

## Goal

#247: approved speeds, per-class brake, and strafe by the owner's keep-the-old-angle rule. Done.
#195: paused, waiting on the owner.

## Done

- #247 filed. The proposal was sent. The owner approved the brakes and replaced the strafe with the angle rule.
- `821a78a` feat(ships): retune class speed, brake and strafe (#247). This closes #247 once it is on
  origin/dev.
- #195: conflict list and plan sent earlier. Nothing committed or pushed.

## State (verified this session)

- Measured per class (angle · ramp · slide · thread · dodge4 z): Int 63.2° 0.452s 5.27u 122.2 12.6u ·
  Fig 55.6° 0.486s 5.71u 108.3 16.0u · Com 50.5° 0.469s 9.44u 108.7 18.7u · Pha 56.3° 0.500s 5.77u
  104.9 15.0u · Fre 46.4° 0.551s 6.50u 98.0 22.7u. The commit message says Comet 108.8/18.6. The
  values above are the correct ones.
- The Comet strafeAccel is 290, not 288. The angle rule tied it with the Fighter, and ship-classes.test
  needs armour to be the strict inverse of strafeAccel.
- The lowest top-speed slope is the Freighter's 1.048 (46.4°), above WEAVE_SLOPE_CAP 0.839 (40.0°). The
  lowest strafeAccel is 236, above 118. rosterContractFailures = [].
- Tests: shared 258/258 in the tree and 251/251 at HEAD plus this file. Client 284/284. Typecheck and lint pass.
- The server test "a bolt breaks a fractured block" is flaky: 1/8 at HEAD without the change, 0/8 with it.
- #195 worktree `../slur-worktrees/merge-195` is detached at origin/dev `74a7b89`. PR ref: `refs/remotes/pr/195`.

## Uncommitted

None.

## Held files

None for #247. Release ship-classes.ts, ship-classes.test.ts and track-contract.test.ts.

## Next

1. GDD §5.5 class table: update it to the new numbers after workerthree commits GDD.md and the
   supervisor clears it.
2. #195: owner calls A/B/C, then rebase in the worktree, push HEAD:dev and clean up.

## Open questions

- GDD §5.5 table: who updates it, and when.
- File an issue for the flaky run-room bolt test?
- #195 owner calls A (drop the rail bounce), B (engine retune or drop the commit), C (push and close).
- Delete `game/net-debug-hud.tsx` (carried over).

## Lessons → memory

none
