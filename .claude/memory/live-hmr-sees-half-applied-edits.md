---
name: live-hmr-sees-half-applied-edits
description: "The owner's dev server HMRs every save in the shared tree; a multi-file prop→context refactor crashes every Canvas route between edits unless providers land first"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 0ea6e189-ddaa-44c7-93f4-57c51a7741fb
  modified: 2026-09-26T07:51:32.823Z
---

The owner's `:5173` stack runs from this checkout and hot-reloads each file as it is saved. A refactor
across many files is live after every single Edit, not only at the commit.

Incident (#285, 2026-09-26): `GameEnvironment` stopped passing `track` one Edit before `Monoliths`
switched to `useTrack()`. For that moment every Canvas route threw
`Cannot read properties of undefined (reading 'finishZ')`, and another worker hit it on the live stack.

**Why:** one shared tree, one live dev server; there is no private staging area ([[one-stack-dev-only]]).

**How to apply:** order the edits so each save leaves the tree renderable. Add the new source
(provider, context, export) first. Then switch each consumer to read it BEFORE its parent stops
passing the old prop. Remove the old path last. Leaf-first for removals, root-first for additions.
