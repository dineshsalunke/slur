---
name: peer-edit-orphans-a-live-check
description: "A live dev-server check that reads 0 ticks or empty state may be an HMR re-evaluation from another worker's save; compare file mtimes to the capture time"
metadata:
  node_type: memory
  type: feedback
  originSessionId: a49ca501-0b3d-4f84-95ac-7fb23de2502d
  modified: 2026-09-24T14:53:13.999Z
---

A live /song-lab replay once read `tick 0 / 0` and DIVERGED. Another worker had saved
`song-lab/bundle.ts` one second before the screenshot. Vite HMR re-evaluated `replay-state.ts`
(it imports bundle.ts), so the page held a fresh, empty `replay` singleton. The replay logic was
fine: three reruns matched.

**Why:** the shared tree runs one dev server over files other workers are editing. A module
singleton does not survive a re-evaluation of its imports. Same family as
[[cdp-import-of-tuning-hits-an-hmr-orphan]].

**How to apply:** when a live reading looks impossible, run `stat -f '%Sm %N'` on the modules the
page imports and compare with the capture time before you debug. Rerun in a fresh tab. Headless
node checks (import the .ts directly under node 24) are immune, so use them for the verdict and
keep the browser for spot checks.
