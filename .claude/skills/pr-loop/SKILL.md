---
name: pr-loop
description: >-
  Autonomous PR-reviewer loop for the slur repo. Find open pull requests, review
  each against the project conventions, run the verify gate locally, comment
  findings, and — only when everything passes — approve and merge. Triggers:
  /pr-loop, "review the open PRs", "babysit the PR queue". Pairs with /loop for
  interval scheduling.
---

# pr-loop — find → review → comment → (approve + merge)

One agent working the PR queue. This skill is the **body of a loop**: it reviews the open
PRs, acts on each, and comes back. Run it under `/loop` to schedule iterations, or self-pace.

Repo: `github.com/dineshsalunke/slur`. You act as **`dineshsalunke` / Claude — the repo
owner and reviewer**. Reviewing, commenting, and merging are owner actions and need **no
lock** (unlike implementing).

## Rule 0 — review against the rules, not against taste (non-negotiable)

A PR is judged against the repo's written standard. Before reviewing, load the standard so
your findings cite it:

1. **`CLAUDE.md`** — the project non-negotiables (server-authoritative, inputs-not-positions,
   one shared `simulate()`, no per-frame React re-renders, `@slur/shared` compiled not
   source-consumed, ship stats are data, no Python, `useEffect` is an escape hatch, house
   React style, componentize by subscription boundary).
2. **`CONTRIBUTING.md`** — the anti-slop bar (§1 read-first, §2 spec-first, §3 coding
   standards, §5 anti-patterns rejected on sight, §6 verify gate, §7 commit/PR rules).
3. **The `conventions/*.md` for each subsystem the PR touches** — read the ones that cover
   the changed files. **Green CI does not prove idiom-correctness** — you are the check that
   does. Convention violations are rejected even when the build is green.

Apply the **same rigor to every PR regardless of author** — including PRs opened by the
issue-loop agent. Independent review is the point.

## Step 1 — find open PRs

```
gh pr list --state open --limit 20
```

For each PR, in turn (oldest-first is a fine default):

```
gh pr view <n> --comments
gh pr diff <n>
gh pr checks <n>
```

## Step 2 — review the diff

Judge the change on:

- **Correctness** — does it do what the linked issue asked? Any bug, edge case, race,
  off-by-one, determinism break (`Math.random`/`Date.now`/`Math.sin` inside the sim)?
- **Anti-patterns (CONTRIBUTING §5, rejected on sight)** — socket/room coupled to a React
  lifecycle; `useEffect` as default; per-frame React re-renders in gameplay; reading Colyseus
  state during render; syncing positions or track geometry instead of inputs/seed;
  source-consuming `@slur/shared`; `<>` fragment shorthand; >1 component per file.
- **Convention conformance** — the specific `conventions/*.md` for the touched subsystem.
- **Tests** — shared-sim changes MUST have tests; a bug fix should carry a failing-then-passing
  test. Is the surface that can be tested, tested?
- **Scope** — one logical change; no unrelated files smuggled in.
- **Commits/PR hygiene** — conventional commits, issue linked, **no `Co-Authored-By` trailer**,
  a stated verification.

You may run `/code-review` on the checked-out diff as a force-multiplier, but you own the
final judgment.

## Step 3 — verify locally (do not trust green CI alone)

Check the PR out and run the full gate yourself:

```
gh pr checkout <n>
pnpm install   # if lockfile changed
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Do **not** substitute `pnpm --filter @slur/shared test`. If the change has a feel or visual
surface, drive the app (`/run` or `/verify`) and look — a green build does not prove feel.

Before judging "the fix isn't there", confirm your baseline is current: `git fetch` and diff
against **current `origin/dev`**, not a stale sha. A behind-by-N baseline reads as a missing
fix when the fix is already live.

## Step 4 — comment

Post your findings on the PR, most-important first, each tied to the rule or line it fails:

```
gh pr comment <n> --body "<findings>"
```

- If there are blocking problems, **request changes** and be specific — cite the file:line and
  the convention. Give the author something actionable, not a verdict.
- If it is close but has nits, say so and let the author decide.
- Reviewing your peer's work: push where it is wrong, but credit what is right.

## Step 5 — approve and merge (guarded — this is the irreversible step)

Merge **only when every one of these is true**:

1. All CI checks are green (`gh pr checks <n>` all pass).
2. Your **local verify gate passed** (Step 3), on the current baseline.
3. The diff **conforms to the conventions** you loaded in Rule 0 — no §5 anti-pattern, no
   non-negotiable broken.
4. The PR **links its issue** and states how it was verified.
5. There are **no unresolved review threads** you or anyone else raised.
6. Scope is one logical change.

If all six hold:

```
gh pr review <n> --approve --body "<one-line why this is good to go>"
gh pr merge <n> --squash --delete-branch
```

**If anything is ambiguous, borderline, or you are not confident** — a convention you are
unsure applies, a design decision that is really a maintainer's call, a feel surface you could
not drive — **do NOT merge. Comment your concern and surface it to the user.** Merging is
hard to reverse and outward-facing; when in doubt, stop and ask. Never merge to clear the
queue.

After a merge, move to the next PR (or end the iteration under `/loop`).

## Boundaries

- Never use Python for tooling/scripts (NN-1): `jq`/`yq` → `fish`/`bash` → ecosystem-native.
- Do not force-merge past failing checks or unresolved threads.
- Owner review does not need a lock; do not lock issues from this skill.
