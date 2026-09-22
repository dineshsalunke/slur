---
name: shared-tunables-storage
description: "The tuning panel's localStorage is shared between the owner's window and the extension tab — agree who drives before A/B testing"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e5d74fce-6c51-496f-8050-309f116acb94
  modified: 2026-09-22T12:42:32.852Z
---

`localStorage['slur.tunables']` is one store shared by the owner's browser window and the
Claude-driven extension tab. During a re-dial both sides were writing it: `tone.exposure` moved from
1 to 3 under the agent mid-A/B, and the chain had to be restarted.

**Why:** an A/B is only readable if exactly one hand is on the knobs. A value that changes for an
unseen reason gets attributed to the change under test, and the conclusion is wrong.

**How to apply:** before starting A/Bs, ask who drives and say it out loud. Read the store rather
than trusting an in-memory value, announce each write, and restore anything touched that wasn't the
subject of the test. `reset` is not an undo — it restores every key to spec default and has already
destroyed a full set of hand-dialled numbers once. Land dialled values into `NUMBER_SPECS`, or at
minimum write them into a phase note, before any session that might reset.

**The sharing is per-ORIGIN, and a worktree on its own port is a different origin.** A second dev
stack on `:5175` (per `apps/client/.env.example`) has an entirely separate
`localStorage['slur.tunables']` from the owner's `:5173` — it cannot read, clobber or restore the
owner's dialled set, and it starts from spec defaults. That is the safe way to A/B without
coordinating: take a worktree with its own `CLIENT_PORT` rather than negotiating for the knobs. It
also means a new knob's source default is what you actually see there, whereas on a store that has
ever been written, `restore()` only overwrites keys present in the saved object — so an existing
key's changed source default stays invisible until the store is cleared.

Related: [[leave-the-browser-tab-open]], [[browser-extension-throttles-fps]],
[[worktrees-are-for-concurrency]].
