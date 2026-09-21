---
name: project-memory-in-repo
description: Auto-memory for this project is redirected into the repo at .claude/memory/ and is git-tracked
metadata:
  type: project
---

Auto-memory for slur is stored in the repo at `.claude/memory/`, not the default
`$CLAUDE_CONFIG_DIR/projects/<escaped-root>/memory/`. Set 2026-09-21 via `autoMemoryDirectory` in
`.claude/settings.local.json`. Memory files are git-tracked like `.claude/phases/`.

`autoMemoryDirectory` must be an **absolute path** or start with `~/` — a relative value is
rejected and silently falls back to the default store.

**Why:** memories are project knowledge worth committing and reviewing, and the absolute path is
machine-specific, so the setting lives in the gitignored `settings.local.json` rather than a
committed `settings.json` that would break on any other clone path.

**How to apply:** a fresh worktree has no `settings.local.json` (it is gitignored) and would write
memories to the default store instead — copy it across when creating one, as the CLAUDE.md worktree
bootstrap shows. See [[worktrees-are-for-concurrency]].
