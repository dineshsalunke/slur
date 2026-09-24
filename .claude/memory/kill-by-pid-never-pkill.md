---
name: kill-by-pid-never-pkill
description: "Never pkill/killall by pattern on the owner's machine; record the PID you start and kill only that PID"
metadata:
  node_type: memory
  type: feedback
  originSessionId: ae3e81c7-4a75-4a73-b692-4950c0c58040
  modified: 2026-09-24T14:20:34.490Z
---

Never use `pkill`, `killall` or `pkill -f <pattern>` to clean up. Record the PID of each process you
start (or of its listening port, via `lsof -nP -iTCP:<port> -sTCP:LISTEN -t`), and `kill <pid>` only
that PID.

**Why:** on 2026-09-24 at 19:49, workerfour ran `pkill -f "react-router dev" -U 501 --`. BSD pkill reads
options only before the first pattern, so `-U`, `501` and `--` became extra patterns. It sent SIGTERM to
every user process whose command line held "--" or "501": Chrome, Arc and Mattermost helpers, the
ChatGPT Codex app-server, Spotlight workers, and every dev server on the machine.

**How to apply:** a pattern kill cannot tell your process from the owner's or another worker's. This
applies even to a pattern that looks narrow. CLAUDE.local.md §7 already says "never kill a process you
did not start"; a pattern kill breaks that by construction.
