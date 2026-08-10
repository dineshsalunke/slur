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

> **Multi-agent context.** More than one Claude works this repo (mahendra's Claude is a
> collaborator whose PRs are adversarially self-reviewed). Target every `gh` command with
> **`-R dineshsalunke/slur`** — these skills are committed to a repo that takes fork PRs, so a
> bare `gh pr list` can resolve to a fork instead of origin.

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
gh pr list -R dineshsalunke/slur --state open --limit 20
```

For each PR, in turn (oldest-first is a fine default):

```
gh pr view <n> -R dineshsalunke/slur --comments
gh pr diff <n> -R dineshsalunke/slur
gh pr checks <n> -R dineshsalunke/slur
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

### Spawn an adversary — do not self-review (the important part)

When this skill reviews a PR the `issue-loop` agent opened, both sides run as **the same
identity with the same priors** — that is self-review wearing two hats, and it reliably
misses the one class of defect you cannot see *because of how you framed the problem*. (In
this repo, three adversarial subagents run over one agent's own six "confident, gate-passed"
PRs found **nine real defects** — unfailable assertions, a tautological `f(x) === f(x)` fix,
a headline conclusion drawn from a saturated/null instrument. None survived an adversarial
pass; all had passed self-review.)

So for every non-trivial PR, **spawn a subagent explicitly briefed to break it** — separate
context, prompted to *find where this is wrong*, told that "looks good" is a **failed**
review. Feed it the diff and the PR's own claims. Treat its findings as input to your
judgment, not gospel. If you cannot spawn one, **state in your review comment that this was a
self-review** so the next reader knows.

## Step 3 — verify locally (do not trust green CI alone)

**First, guard your working tree** — `git status` must be clean before you check a PR out,
or `gh pr checkout` fails or drags your changes across PRs. Stash or commit, then:

```
gh pr checkout <n> -R dineshsalunke/slur
pnpm install   # if lockfile changed
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Do **not** substitute `pnpm --filter @slur/shared test`. 

**Check that the PR's tests bite.** For each new/changed test, deliberately break the code
it covers and confirm the test goes **red**, then revert (`git diff` clean). A green suite
proves the code compiles, not that the test watches anything — an unfailable test is the
single most common way a confident, gate-passing PR is still wrong. Also flag any test whose
expected value is **derived from the function under test** (`f(x) === f(x)` always passes).

If the change has a feel or visual surface, drive the app (`/run` or `/verify`) and look — a
green build does not prove feel. **Before driving the app, run `git lfs install && git lfs
pull`**: the ship `.gltf` files are LFS pointers, and without a pull R3F dies with a cryptic
`Unexpected token 'v', "version ht"... is not valid JSON`.

Before judging "the fix isn't there", confirm your baseline is current: `git fetch` and diff
against **current `origin/dev`**, not a stale sha. A behind-by-N baseline reads as a missing
fix when the fix is already live.

## Step 4 — comment

Post your findings on the PR, most-important first, each tied to the rule or line it fails:

```
gh pr comment <n> -R dineshsalunke/slur --body "<findings>"
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
gh pr review <n> -R dineshsalunke/slur --approve --body "<one-line why this is good to go>"
gh pr merge <n> -R dineshsalunke/slur --squash --delete-branch
```

> GitHub **blocks approving your own PR**. When the reviewer and author identity are the same
> (a PR this same account opened), `--approve` fails — skip it and merge on the strength of
> the six gates plus the adversary pass, noting in the merge comment that formal approval was
> not possible.

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
- **Retract a wrong published claim loudly** — if a review conclusion you posted turns out
  wrong, post a visible correction on the same thread, never a quiet edit; a maintainer may
  already be acting on the stale claim.
