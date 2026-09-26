---
name: worker-closes-its-issue
description: OWNER RULE — the worker who fixes an issue closes it on GitHub with a SHA comment; no separate triage pass
metadata:
  node_type: memory
  type: feedback
  originSessionId: 469ab117-3ee3-402b-8588-c8760d2324fd
  modified: 2026-09-26T05:39:15.829Z
---

The worker who fixes an issue closes it: after the push, `gh issue close <n> -c "<what shipped + SHA>"`.
If the owner must sign off first, comment the SHA and leave it open.

**Why:** the owner does not want time spent triaging issues that were already fixed (2026-09-26).

**How to apply:** put "close the issue when done" in every lane brief; the supervisor checks it at the lane's
end report. Rule also lives in `CLAUDE.local.md` §2. Related: [[owner-may-waive-issue-filing]].
