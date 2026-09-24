---
name: merge-prs-in-a-detached-worktree
description: "A conflicted PR merge cannot run in the shared checkout: others' staged index blocks it and their dirty files pollute the gate; use a detached worktree and push HEAD:dev"
metadata:
  node_type: memory
  type: feedback
  originSessionId: b3c816be-d1b7-4068-92a9-fd651b58f1e2
  modified: 2026-09-24T03:26:55.438Z
---

Merge a conflicted PR in a **detached** worktree off `origin/dev`, not in the shared checkout. Push it
with `git push origin HEAD:dev`. Do not fast-forward the shared checkout afterwards. The supervisor
syncs it when the shared index is clean.

**Why:** 2026-09-24, PRs #230/#237. `git merge` aborts when the index differs from HEAD, and another
worker had renames staged. A merge commit would also have swept those renames in. `pnpm typecheck`/`test`
in the shared tree also compile the other workers' uncommitted edits, so a failure there is not yours.
The owner approved the worktree for this.

**How to apply:**
- A clean PR merges on GitHub (`gh pr merge N --merge`). Only a conflicted PR needs the worktree.
- `git worktree add --detach ../slur-worktrees/<name> origin/dev`, `pnpm install`, then copy
  `.claude/settings.local.json`. For a scratch server, write `apps/client/.env` there with its own port pair.
- `git merge-file --ours -p ours base theirs` (stages `:1:`/`:2:`/`:3:`) resolves a conflict for one
  side and keeps the other side's clean hunks. That is not a regex edit.
- For a stacked PR, number any doc items in merge order. #228, #230 and #237 all wrote "§7 item 16".
- When done: `git worktree remove --force`, and delete the fetched `refs/remotes/pr/*` refs.
- Related: [[shared-checkout-shares-one-git-index]], [[worktrees-are-for-concurrency]].
