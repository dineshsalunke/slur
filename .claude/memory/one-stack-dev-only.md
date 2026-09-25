---
name: one-stack-dev-only
description: "Owner rule — all work on dev in the main checkout against the one running stack; no worktrees, no scratch/second dev stacks"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 9b14a3f3-171c-4517-92f1-b3ee56f72e00
  modified: 2026-09-25T03:57:22.495Z
---

All work lands on `dev` in the main checkout, and every measurement runs against the owner's own stack
(:5173 client, :2567 server). No worktrees. No scratch or second dev stacks, including "side-by-side" trial
stacks on other ports.

**Why:** on 2026-09-25 the owner found 5–6 stacks that agents had left running in the background for more
than a day. They ate CPU and battery, and the owner did not know they existed.

**How to apply:** a trial the owner must fly goes on dev behind one constant or knob, on the same stack.
Headless Chrome is still allowed for captures, but kill it by PID right after. This overrides older memories
that suggest a worktree on its own port ([[worktrees-are-for-concurrency]], [[shared-tunables-storage]],
[[merge-prs-in-a-detached-worktree]], [[seed-a-finished-room-with-a-scratch-server]],
[[short-course-scratch-server]]). Related: [[headless-game-tabs-starve-the-gpu]], [[kill-by-pid-never-pkill]].
