---
name: worktrees-are-for-concurrency
description: Use a git worktree only when work is actually concurrent — never as blanket ceremony for small changes
metadata:
  type: feedback
---

Worktrees are still used in this repo, but only for the problem they solve: keeping **concurrent**
work from colliding. A small change that will be finished in one sitting, with nobody else in the
tree, is branched and committed directly in the checkout.

This replaced a hard non-negotiable (former CLAUDE.md #12, removed 2026-09-21) that mandated a
worktree for *every* edit, enforced by a `.githooks/pre-commit` that hard-blocked Claude commits in
the shared checkout. Both the rule and the hook are gone.

**Why:** the rule was unconditional, so it fired regardless of change size — a few-lines edit was
dragged through the full fetch/worktree-add/install/PR route. The owner's words: "i wanted to do a
very small change worth of few lines but it literary went through the whole worktree route. that
was seriously annoying." The original rationale (a #53 fix once committed onto the wrong branch
mid-task) was real but justified guarding concurrency, not ceremony on every commit.

**How to apply:** default to branch-and-commit in the checkout. Create a worktree when another
agent is already working the repo, when fanning agents out in parallel, when the branch is
long-lived and you will switch away mid-flight, when a second live stack must run at once, or when
reviewing a PR without disturbing your own WIP. Do not propose the worktree route for a small
single-sitting change. See [[project-memory-in-repo]].
