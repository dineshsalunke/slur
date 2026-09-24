---
name: ab-an-old-sim-from-git-in-scratch
description: "To compare an old sim rule with the new one, run the old step.ts from git in the scratchpad against the new dist"
metadata:
  node_type: memory
  type: reference
  originSessionId: 93637031-1253-406b-bae7-4db159136078
  modified: 2026-09-24T07:15:34.600Z
---

To measure a sim change before and after without touching the tree:
`git show <sha>:packages/shared/src/sim/step.ts`, then rewrite its `'./` and `'../` imports to absolute
`packages/shared/dist/...` paths, and save it in the scratchpad. That file is scratch, not source.
Then `node --experimental-strip-types` imports it beside the dist `simulate`, and the same bot script
runs both. Used for #231 (old graze glance at 0.3u was 68%, the same as workerone's earlier bot number)
and #232 (729 → 1 stun-locked pockets).

**Why:** a worktree or a stash is heavy and unsafe in the shared checkout ([[shared-checkout-shares-one-git-index]]).
**How to apply:** memoise the track in the script ([[procgen-segmentat-is-uncached]]). Rebuild dist
(`tsc -b`) first, or the "after" side runs stale code ([[shared-watcher-can-leave-dist-stale]]).
