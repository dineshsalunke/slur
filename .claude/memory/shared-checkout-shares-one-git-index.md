---
name: shared-checkout-shares-one-git-index
description: Sessions in the same checkout share one .git/index, so `git add` is visible to all of them
metadata:
  type: project
---

Several Claude sessions working in `/Users/apple/Projects/personal/slur` share a single
`.git/index`. Staging is **not** session-local: files one session `git add`s show up as staged
in every other session's `git status`, and a bare `git commit` by any of them sweeps up the lot.

**Why:** on 2026-09-22 four sessions worked the same checkout on `feat/test-level`. One session
staged its files, and a peer preparing its own commit found them already staged and nearly
committed them under its own message.

**How to apply:** in a shared checkout, always `git commit -- <explicit pathspecs>`, never a bare
`git commit`. Announce before staging. Better, take a worktree — see
[[worktrees-are-for-concurrency]]; the one session that did had a clean branch and no collision.

A second trap in the same shape: two sessions editing one file (`dev/tunables.ts`,
`track-materials.ts`) cannot be split by path at all, because the file's contents interleave. One
session has to carry the other's hunks and say so in the message.
