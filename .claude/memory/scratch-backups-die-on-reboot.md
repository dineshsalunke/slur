---
name: scratch-backups-die-on-reboot
description: "The session scratchpad lives under /private/tmp, which macOS wipes on restart; anything meant to outlive the session (backups, plan drafts) goes to ~/.claude-personal/backups/"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 9fb19534-5241-467c-b93a-56514cbb54ee
  modified: 2026-10-22T05:30:51.142Z
---

The scratchpad (`/private/tmp/claude-501/...`) is wiped when the machine restarts. On 2026-10-20 the
supervisor kept the only backups of `CLAUDE.local.md` and the pre-port fleet skill there. They were copied out
just before the owner restarted the machine on 2026-10-22.

**Why:** a handover that points at a scratchpad path is a dead link after a reboot.

**How to apply:** put backups and anything a handover cites in `~/.claude-personal/backups/<topic>-<date>/`,
never the scratchpad. Current copy: `~/.claude-personal/backups/slur-fleet-migration-2026-10-20/`. Related:
[[shared-tree-footguns]].
