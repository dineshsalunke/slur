---
name: issue-loop
description: >-
  Autonomous issue-worker loop for the slur repo. Pick an open GitHub issue,
  claim it with a lock comment, build it to the project bar, open a PR, then
  monitor that PR until it merges. Triggers: /issue-loop, "work the issues",
  "pick up an issue and build it". Pairs with /loop for interval scheduling.
---

# issue-loop — pick → lock → build → PR → monitor → merge

One agent, one issue at a time, end to end. This skill is the **body of a loop**: it
does a full issue and comes back for the next. Run it under `/loop` to schedule
iterations, or let it self-pace (finish one issue, start the next).

Repo: `github.com/dineshsalunke/slur`. You act as **`dineshsalunke` / Claude**.

> **Multi-agent context.** More than one Claude works this repo (mahendra's Claude is a
> collaborator). Its reviews are adversarial and unusually rigorous — treat them as signal.
> Watch for **stale baselines**: a "the fix isn't there" may just be a baseline behind
> `origin/dev` — verify against current `origin/dev` first. Target every `gh` command with
> **`-R dineshsalunke/slur`** — these skills are committed to a repo that takes fork PRs, so a
> bare `gh pr list`/`gh issue list` can resolve to a fork, not origin.

## Rule 0 — read the rules before you touch code (non-negotiable)

This repo rejects PRs that violate its conventions even when they compile and pass tests.
Before writing a single line for an issue, read, in order:

1. **`CLAUDE.md`** — how we build; the project non-negotiables (server-authoritative,
   inputs-not-positions, one shared `simulate()`, no per-frame React re-renders,
   `@slur/shared` is compiled not source-consumed, ship stats are data, no Python,
   `useEffect` is an escape hatch, house React style, componentize by subscription).
2. **`CONTRIBUTING.md`** — the anti-slop bar, the verify gate, commit/PR rules.
3. **The `conventions/*.md` for the subsystem you are about to touch** — read the *one*
   that covers your files (the CLAUDE.md table maps subsystem → file). Do **not** bulk-load
   all of them. These are **acceptance criteria**, not suggestions.
4. **`docs/`** (GDD/TDD/ADD/AUDIO) only if the issue changes design intent — update it, do
   not diverge silently.

If a change would break a non-negotiable, stop and rethink the approach — do not ship it.

## Step 1 — pick an issue

```
gh issue list -R dineshsalunke/slur --state open --limit 40
```

Choose the best candidate. Prefer, in order: a `priority` or `bug` label, then a clear
spec you can build without more design agreement. **Skip**:

- Any issue already **locked by another agent** — look for a fresh `🔒 Lock claimed`
  comment (< 3h old) from someone other than you (`gh issue view <n> -R dineshsalunke/slur --comments`). The
  hard boundary is: never implement an issue mahendra's Claude has locked. If its lock is
  stale (> 3h), you may reclaim it, but say so in your lock comment.
- `gate` issues (human feel-gate — not code).
- Pure design/RFC issues where CONTRIBUTING §2 says a maintainer must approve the design
  first and that has not happened. Comment your design and wait; do not implement.

If nothing is workable, say so and stop (or, under `/loop`, wait for the next tick).

## Step 2 — claim it with a lock comment

The lock covers **implementing** — not commenting. You may (and should) post design
proposals and findings on issues you do not hold; only building the fix needs a lock.

Post the lock with an **absolute UTC expiry** (matches mahendra's `valid until HH:MM UTC`
format, so the 3h-staleness check is trivial for the next reader — compute it, do not
hardcode):

```
gh issue comment <n> -R dineshsalunke/slur --body "🔒 **Lock claimed** — \`dineshsalunke\` / Claude, valid until $(date -u -v+3H '+%H:%M UTC').

<one line: the approach you will take>"
```

(`date -u -v+3H` is BSD/macOS; on GNU/Linux use `date -u -d '+3 hours' '+%H:%M UTC'`.)

**Then guard the claim race.** Immediately re-read the thread
(`gh issue view <n> -R dineshsalunke/slur --comments`). If another agent's lock comment
**predates yours**, yield: post a short "releasing — <other> holds it" note and pick a
different issue. Two agents listing and locking within seconds is a real failure mode; this
is the cheap insurance.

Renew the lock (re-comment) roughly every 2.5h while you are still on the issue. Release it
with a short comment if you abandon the issue.

## Step 3 — build it

- **Branch off `dev`** (the default/main branch): `git switch -c <type>/<issue-short-desc> dev`.
  Never commit straight to `dev`. If the working tree is dirty, stash or stop — do not mix.
- Follow the arc where the work is non-trivial (`/arc` skill). The issue is the RFC; for a
  non-trivial change confirm the design is agreed on the issue before implementing.
- **Match the surrounding code.** Copy its naming, comment density, idioms. Comment the
  *why*, not the *what*.
- **Tests are required where the surface can be tested** (CONTRIBUTING §4). Shared-sim
  changes MUST have tests. A bug fix starts with a failing test that reproduces the bug.
- **Prove every new/changed test can FAIL.** A green suite proves the code compiles, not
  that the test watches anything. For each test you add or touch: deliberately break the
  code it covers, confirm the test goes **red**, then revert (`git diff` must be empty). A
  test that cannot fail manufactures false confidence — worse than no test.
- **Never derive a test's expected value from the function under test** — that asserts
  `f(x) === f(x)` and always passes. Use literals for balance numbers, or compare two
  different configurations differentially.
- Keep it **one logical change per PR**. Batch the files that belong together; do not mix
  unrelated changes.

## Step 4 — the verify gate (all four, from the repo root)

```
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Do **not** substitute `pnpm --filter @slur/shared test` — that skips the server room tests.
Green CI is necessary but **not sufficient**: re-read the touched `conventions/*.md` and
check your diff against it before you open the PR. If a change has a feel or visual surface,
drive the app (`/run` or `/verify`) and capture what you saw — a green build does not prove
feel. **Before driving the app, run `git lfs install && git lfs pull`** — the ship `.gltf`
files are Git-LFS pointers; without a pull, R3F dies with a cryptic
`Unexpected token 'v', "version ht"... is not valid JSON` that gives no hint at the real cause.

Before committing, **scan the diff** for leftover `console.*`, `TODO`, temp/debug code.

## Step 5 — commit and open the PR

- **Conventional commits**, scoped by package: `feat(client): …`, `fix(shared): …`, `docs: …`.
- **Never add a `Co-Authored-By` trailer** — the commit hook rejects it. Do **not** bundle
  `git add` and `git commit` into one shell call (a hook rejection kills the whole call).
- Push the branch, then:

```
gh pr create -R dineshsalunke/slur --base dev --title "<conventional title>" --body "<body>"
```

PR body must: **link the issue** (`Closes #<n>`), state the design in brief, and **state how
you verified it** — paste the gate output, and the manual playtest result if it has a feel or
visual surface. Include an honest "what I did NOT do" note when you cut scope.

## Step 6 — monitor the PR until it merges

Watch the PR and respond to review. This is a loop of its own:

```
gh pr view <n> -R dineshsalunke/slur --comments
gh pr checks <n> -R dineshsalunke/slur
```

- **Address every review comment.** Push follow-up commits to the same branch; re-run the
  full verify gate after each change; reply on the thread explaining what you changed (or
  why you disagree — defend with evidence, do not just comply).
- Watch for **stale-baseline** reviews: if a reviewer says "the fix isn't there", check
  whether their baseline sha is behind `origin/dev` before agreeing.
- Keep the issue lock fresh while the PR is open.
- If CI goes red, fix it before anything else.

When the PR is **merged**, delete the branch, drop a closing note on the issue if useful,
and return to Step 1 for the next issue (or end the iteration under `/loop`).

## Boundaries

- Do not merge your own PR here — merging is the reviewer loop's job (`/pr-loop`) or a human's.
- If anything is ambiguous, or a change would touch a non-negotiable, **stop and surface it**
  to the user rather than guessing.
- **Retract a wrong published claim loudly.** These agents post confident public conclusions
  on issues and PRs. When one turns out wrong, post a **visible correction on the same
  thread** — never a quiet edit. A maintainer may already be acting on the stale claim.
- Never use Python for tooling/scripts (NN-1): `jq`/`yq` → `fish`/`bash` → ecosystem-native.
