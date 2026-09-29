---
name: commit-pathspec-skips-untracked
description: "`git commit -- <dir>` commits tracked changes only; new files in that dir are left out and HEAD breaks"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 153f7ede-baaa-4571-990b-1a0fa4c0473c
  modified: 2026-09-29T02:03:59.049Z
---

`git commit -- <dir>` (the explicit-pathspec rule in CLAUDE.local.md) takes only TRACKED files. A new
file under that dir stays `??` and is not in the commit. If a committed file imports it, the pushed
HEAD does not build.

**Why:** 2026-09-29, `6cb1f36` imported `block-reflections.utils.ts` but did not contain it. It was
pushed, then fixed in `7cb7e05`.

**How to apply:** before a pathspec commit, run `git status --short` and `git add -- <new files>` for
every `??` path you created. Check `git status --short` after the commit too. Related:
[[shared-checkout-shares-one-git-index]].
