---
name: claim-the-lane-before-the-first-write
description: "A handover's \"Left undone\" list is a shared queue — say you are taking an item before writing the first file"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 81ae689d-08ce-419c-97c6-5939adec7fbc
  modified: 2026-09-22T20:14:02.028Z
---

A handover's **Left undone** list is read by every session that opens it, so two agents
pick the same item and start within seconds of each other. On 2026-09-23 this session and
`slur-supervisor` both began the `track.ts` extraction; the peer's writes landed on top of
two untracked files of this session's and destroyed them, with no git object to recover from.

**Why:** untracked files have no history. A concurrent write is unrecoverable in a way a
committed one never is, and the checkout shares one tree
([[shared-checkout-shares-one-git-index]]).

**How to apply:** before writing the first file for a handover item, say out loud — to the
owner, or by `SendMessage` to any peer session — which item you are taking. Then commit
early, so a collision costs a merge instead of a rewrite. A worktree is not the fix here
([[worktrees-are-for-concurrency]]); the work did not collide in the tree, the *claim* did.
