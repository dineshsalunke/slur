---
name: moving-a-useeffect-trips-the-comment-ratchet
description: Moving a useEffect (with its mandatory one-line comment) into an existing comment-free file fails the per-file ratchet; put it in a new hook file
metadata:
  node_type: memory
  type: feedback
  originSessionId: 0a02f5e1-a726-4db4-b3db-beac2a43bd0e
  modified: 2026-09-24T04:00:59.513Z
---

`comments.md` requires a one-line comment on every `useEffect`. `scripts/check-comment-ratio.mjs`
fails any EXISTING file that ends with more comment lines than at the merge-base. A deleted file's
comments do not count. So moving an effect from a deleted file into an existing, comment-free file
fails `pnpm lint` (`host-button.tsx gained comment lines: 0 → 1`, #242, 2026-09-24).

**Why:** the ratchet compares each file only with its own merge-base version. A new file is judged
on its ratio instead (it passes at ≤ 6 comment lines, or ≤ 20%).

**How to apply:** put the effect in a new `use-<name>.ts` hook file (hooks may share a file with
their component, but a new file resets the ratchet). Never drop the mandatory comment to pass.
