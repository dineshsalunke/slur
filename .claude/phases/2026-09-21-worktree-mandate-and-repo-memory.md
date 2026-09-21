# 2026-09-21 — the worktree mandate goes, and memory moves into the repo

Branch `chore/worktree-mandate-and-repo-memory`, three commits, **not pushed**. Written to be read cold.

## 1. Auto-memory redirected into the repo — `a1452db`

Project memory now lives at **`.claude/memory/`**, git-tracked like `.claude/phases/`, instead of
`$CLAUDE_CONFIG_DIR/projects/<escaped-root>/memory/`.

Set via `autoMemoryDirectory` in **`.claude/settings.local.json`** (gitignored — the value must be an
absolute path, so it is machine-specific and must not be committed).

### Stack facts, verified against the 2.1.267 binary (not recalled)

- Setting key is `autoMemoryDirectory`. Resolution order (function `D0`):
  `policySettings` → `flagSettings` → `localSettings` → `projectSettings` → `userSettings`.
  Project/local scopes are only consulted once the repo is trusted.
- **Relative paths are silently rejected.** The validator normalizes then requires `isAbsolute`;
  `normalize` does not make a path absolute, so `.claude/memory` falls back to the default store with
  no error. Absolute or `~/`-prefixed only.
- Highest-precedence override is the env var `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE` (no `~` expansion).
- Kill switches: `autoMemoryEnabled: false`, or `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`.
- Default path formula: `<CLAUDE_CONFIG_DIR>/projects/<escaped-root>/memory/`, where the root is
  canonicalized across git worktrees — so by default every worktree already shares one store.
- **The redirect only takes effect on session restart** (the resolver memoizes per project root).

### The worktree caveat that drove the `cp` line

`settings.local.json` is gitignored, so a fresh worktree does not have it and falls back to the
default store — its memories never reach `.claude/memory/`. The CLAUDE.md worktree bootstrap
therefore ends with `cp /Users/apple/Projects/personal/slur/.claude/settings.local.json .claude/`.

### Seeded memories

`MEMORY.md` (index) + `worktrees-are-for-concurrency.md` (feedback) +
`project-memory-in-repo.md` (project). Deliberately did **not** reconstruct the four memories
CLAUDE.md cites by name (`shared-checkout-use-worktree`, `rhythm-paced-generation`,
`colyseus-state-not-reactive`, `think-rerender-subscription-impact`) — they exist nowhere on disk,
but their substance is already inline in CLAUDE.md, so the citations are cosmetic.

## 2. Non-negotiable #12 removed — `a1452db`

**Why:** the rule was unconditional and fired regardless of change size — a few-lines edit was dragged
through the full fetch/worktree-add/install/PR route. Owner: *"that was seriously annoying."* The
original incident (a #53 fix committed onto a docs branch) justified guarding **concurrency**, not
ceremony on every commit.

Gone: rule #12, the "Concurrent agents" section, `.githooks/` (both files), the already-installed
`.git/hooks/pre-commit`, and the root `prepare` script that re-wired it on every `pnpm install`.
Removing the hook matters — left active it would have kept enforcing a rule deleted on paper.

Kept, reframed as **"Worktrees (optional — use them for what they're for)"** with an explicit trigger:
use one when another agent is in the tree, when fanning out in parallel, for a long-lived branch you
will switch away from, for a second live stack, or to review a PR without disturbing WIP. Otherwise
branch and commit in the checkout. The ports note (issue #59) survived, reworded off its worktree
framing and moved into the As-built notes.

**Rules are deliberately NOT renumbered** — the list reads 11, 13, 14, 15. `#14` and `#15` are cited in
`conventions/r3f.md` (x2), `conventions/react-router.md`, `CONTRIBUTING.md` and CLAUDE.md itself;
renumbering would break all of them. CLAUDE.md is consumed as raw text, so the gap is harmless.

## 3. Owner-driven cleanup — `44c92ad`, `50f3c35`

The owner deleted `.claude/skills/{issue-loop,pr-loop}/SKILL.md` and `.claude/lane.json` mid-session as
redundant; committed separately. Nothing referenced them outside the phase notes — the one CLAUDE.md
mention went with the worktree section.

Note for the record: those deletions landed in the shared tree **while this task was mid-flight** and
were swept up by a `git add -A`, caught only by reading the staged list. That is exactly the collision
class #12 existed to prevent — the new guidance would call for a worktree in that situation.

## State

Branch `chore/worktree-mandate-and-repo-memory` = `50f3c35`, working tree clean, **unpushed, no PR**.
`pnpm lint` green (3 warnings, pre-existing on `dev`). Typecheck/tests not re-run — no source changed,
only docs, `package.json`'s `prepare`, and `.claude/`.

## Open / next

- **Push + PR** the branch, or merge it — neither done.
- **Restart the session** before expecting memory to land in `.claude/memory/`.
- **Attribution hook REMOVED** (owner-approved, global): the `no-coauthored-by.sh` entry is gone from
  `~/.claude-personal/settings.json` `hooks.PreToolUse`; `git-safety.sh` stays. It had refused any
  co-author trailer, and matched on the command text — so it also blocked an unrelated commit whose
  diff merely mentioned the trailer by name. The change took effect immediately, no restart needed.
  The script itself is still on disk at `~/.claude/hooks/no-coauthored-by.sh`, just unwired. The first
  three commits on this branch predate the removal and carry no trailer; they were not amended.
- **Stale `skillOverrides`** in `.claude/settings.local.json` still name `issue-loop` and `pr-loop`
  (now deleted) and `arc` — `/arc` is referenced at CLAUDE.md:271 but exists in no skills directory.
  Pre-existing drift, untouched.
- **Tracked memory has a cost:** every session that writes a memory dirties the working tree mid-task
  and will surface in unrelated PR diffs. Fallback if noisy: gitignore `.claude/memory/` and promote
  only what is worth sharing into CLAUDE.md.
