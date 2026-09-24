Agent: workerfour · Lane: merge open PRs — #195 feat/ship-feel · Updated: 2026-09-24

## Goal

Land PR #195 (ship banking, engine-core bloom, rail bounce) onto dev from a detached worktree. Push
only after the plan is approved.

## Done

- Conflict list and resolution plan sent to slur-supervisor. Nothing committed or pushed.

## State (verified this session)

- Worktree `../slur-worktrees/merge-195` is detached at origin/dev `74a7b89`. PR ref: `refs/remotes/pr/195`.
- Only 5 of the 33 commits are the PR (`dcc3149..01947c2`). The other 28 are pre-squash
  feat/test-level history, already on dev.
- Trial rebase conflicts:
  - `9af27e0`: step.ts. The bounce is dead on dev, because fc65986 removed the rail clamp from the
    track path.
  - `0dc8c7d`: 7 content conflicts plus tunables.ts modify/delete. Dev deleted tunables.ts in 3fd4a97;
    its knobs now live in dev/tuning-schema.ts.
  - `8fbb223`: ship-model.tsx. Dev's "one metal" supersedes the hull knobs. Bloom.threshold is 0.6.
  - `01947c2`: the phases doc, modify/delete.
- The shared checkout's dev and origin/dev have diverged: 17 commits one way, 40 the other.

## Uncommitted

None in the shared tree. The worktree is clean.

## Held files

None yet.

## Next

1. Wait for owner calls A (drop the rail bounce, fix GDD:301), B (engine retune for threshold 0.6, or
   drop the commit) and C (push HEAD:dev and close #195).
2. Rebase the kept commits in the worktree and resolve as planned. Run typecheck, test and lint, then a
   headless /test-level check.
3. Push HEAD:dev, close #195, then remove the worktree and delete `refs/remotes/pr/195`.

## Open questions

- Owner calls A/B/C above.
- Delete `game/net-debug-hud.tsx` (carried over).

## Lessons → memory

none
