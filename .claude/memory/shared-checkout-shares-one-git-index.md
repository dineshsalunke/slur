---
name: shared-checkout-shares-one-git-index
description: "Sessions in the same checkout share one .git/index, so `git add` is visible to all of them"
metadata: 
  node_type: memory
  type: project
  originSessionId: 29cebf5f-df66-4ac8-b08d-35f5778300d8
  modified: 2026-09-22T19:05:35.483Z
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

**The branch moves under you the same way the index does.** A shared checkout follows one HEAD, so
a peer's `git checkout -b` silently redirects every other session's commits. On 2026-09-23 three
sessions' commits landed on `feat/asteroid-bands` instead of `dev` — the exhaust ramp fix, a phase
correction and the asteroid bands — and nobody noticed, because **`git status --short` does not
print the branch**. Recovery was a clean fast-forward only because the branch was cut from `dev`'s
exact tip. **Run `git branch --show-current` immediately before every commit.** Standing owner
policy: everyone commits to `dev`, no feature branches unless asked.

A second trap in the same shape: two sessions editing one file (`dev/tunables.ts`,
`track-materials.ts`) cannot be split by path at all, because the file's contents interleave —
`git commit -- <path>` takes WORKING-TREE content and silently steals the peer's hunks.

**Split it by hunk instead** (done 2026-09-22 on `dev/tuning-schema.ts`, which held this
session's `RearView.*` and the supervisor's `Block.*`): confirm `git diff --cached --stat` is
empty, hand-write a patch containing only your hunk into the scratchpad,
`git apply --cached --recount <patch>`, `git add` your whole-file changes, verify
`git diff --cached` shows none of theirs, then `git commit` with **NO pathspec** — a pathspec
would re-read the working tree and undo the whole point. Check their hunk survived afterwards.
`git add -p` is unavailable: interactive flags do not work in this harness.

**Simpler variant when your own hunks are few and trivial to retype** (done 2026-09-23 on
`dev/tuning-schema.ts`, three lines of mine against a peer's `Exhaust.*`/`EngineLight.*` block):
copy the mixed file to the scratchpad, `git checkout HEAD -- <file>`, re-apply only your edits with
the Edit tool, `git add <file>`, then copy the mixed file back. No patch arithmetic, and a pathspec
on the commit is then harmless. The peer's lines are missing from the WORKING TREE for the few
seconds in the middle — a peer reading the file right then sees a phantom clobber and a typecheck
failure, so say what you are doing if one is watching.
