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

Repo: `github.com/dineshsalunke/slur`. Reviewing and commenting need **no lock** (unlike
implementing) — but **what you are allowed to do at the end depends on the account running**,
so establish that first:

```
gh auth status                                    # ME = the authenticated login
gh api repos/dineshsalunke/slur --jq .permissions # push: true = can merge; false = cannot
```

- **`push: true`** → full loop, including the guarded approve + merge in Step 5.
- **`push: false`** → **review-only.** You can still comment and submit a review (anyone can on
  a public repo), but `gh pr merge` **will fail** — you do not have write access. Do not attempt
  it, and do not treat a PR as "done" because you reviewed it. Post the findings and stop;
  merging is someone else's call.

Never review your own PR as though it were independent. If `.author.login == ME`, say so in the
comment and treat the adversarial pass in Step 2 as mandatory rather than optional.

Pass `-R dineshsalunke/slur` on every `gh` call — from a fork, a bare command resolves against
your own remote and silently targets the wrong repository.

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
  test. Is the surface that can be tested, tested? And critically: **can the tests fail?**
  Check for the two ways a green test asserts nothing — an expected value *derived from the
  function under test* (`assert(f(x) === f(x))` survives inverting `f`), and a bound so loose
  the code cannot cross it. When in doubt, break the code locally and see whether the suite
  notices. Both have shipped here green.
- **Scope** — one logical change; no unrelated files smuggled in.
- **Commits/PR hygiene** — conventional commits, issue linked, **no `Co-Authored-By` trailer**,
  a stated verification.

You may run `/code-review` on the checked-out diff as a force-multiplier, but you own the
final judgment.

### Spawn an adversarial reviewer — especially for `issue-loop`'s PRs

When this skill reviews a PR the issue-loop agent opened, both sides are **the same operator
with the same priors**. That is self-review wearing two hats, and it is blind to exactly the
defects that come from how the problem was framed in the first place.

So do not rely on reading alone. Spawn a subagent over the diff, briefed to **break** it:

> Find where this PR is WRONG. Do not validate it. Concluding "looks good" is a FAILED review
> unless you genuinely tried to break it and can list what you attacked. Check every claim in
> the PR body against the actual diff. Verify the tests can fail. Report file:line and your
> confidence.

Give it the repo context (`CLAUDE.md`, `CONTRIBUTING.md`, the relevant `conventions/*.md`) and
have it work in a **git worktree** so it never disturbs the main tree.

This is not ceremony. In the first collaboration cycle, six PRs that had passed a full
self-review and a green gate yielded **nine real defects** the moment adversarial subagents
looked at them — including tests that could not fail, a room test suite that was not actually
time-controlled, and a published conclusion drawn from a saturated measurement. Every one of
those had been reviewed and believed. Treat its findings as input to your judgment, not as a
verdict — but do not skip it.

## Step 3 — verify locally (do not trust green CI alone)

Check the PR out and run the full gate yourself. **Stash or stop if the working tree is
dirty** — `gh pr checkout` will otherwise drag your changes across PRs and you will review
someone else's diff plus your own:

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
Driving the app needs the LFS assets: run `git lfs install && git lfs pull` first, or the ship
`.gltf` files load as pointer text and R3F fails with a JSON parse error that points nowhere
near the real cause.

Judge a **clean** checkout when the change touches build or test wiring: wipe `dist/`,
`test-dist/` and `*.tsbuildinfo` before running. Stale incremental artefacts have masked a
real "fails from a fresh clone" bug here — the gate was green locally and broken for everyone
else.

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

**Skip this entire step if `push: false`.** You cannot merge, `gh pr merge` will error, and a
review-only pass ends at Step 4. Say plainly in your comment that you reviewed but cannot merge,
so nobody assumes the PR is cleared to land.

Merge **only when every one of these is true**:

0. You have write access (`push: true`).
1. All CI checks are green (`gh pr checks <n>` all pass).
2. Your **local verify gate passed** (Step 3), on the current baseline.
3. The diff **conforms to the conventions** you loaded in Rule 0 — no §5 anti-pattern, no
   non-negotiable broken.
4. The PR **links its issue** and states how it was verified.
5. There are **no unresolved review threads** you or anyone else raised.
6. Scope is one logical change.
7. The **adversarial pass ran** (Step 2) and every finding is either fixed or explicitly
   dismissed with a stated reason. "It found nothing" only counts if it listed what it
   attacked.

**Give an in-flight review time to land.** Check `gh pr view <n> --comments` and
`gh api repos/<owner>/<repo>/pulls/<n>/reviews` immediately before merging, and if another
agent is plainly mid-review, wait a beat. This is not hypothetical — a substantive review on
this repo landed **32 seconds after** the PR was merged, so its findings had to become a
follow-up PR instead of a fix. Nothing was lost, but the ordering wasted a cycle.

If all seven hold:

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

## Context — you are not the only agent here

This repo is worked by **more than one Claude at a time** (today: the owner's, and mahendra's
via a fork). That shapes several things above and is worth holding in mind:

- Issues carry a **lock protocol** — a `🔒 Lock claimed` comment, ~3h TTL, renewed by
  re-commenting. Reviewing and merging need no lock; implementing does.
- **Baselines drift fast.** `git fetch` before concluding a fix is missing.
- A PR you did not open may still be **actively defended** — expect the author to push back
  with evidence, and treat that as the process working.
- Findings and retractions are posted **publicly on the thread**, so both agents (and the
  human) can see the reasoning rather than just the outcome.

## Boundaries

- Never use Python for tooling/scripts (NN-1): `jq`/`yq` → `fish`/`bash` → ecosystem-native.
- Do not force-merge past failing checks or unresolved threads.
- Owner review does not need a lock; do not lock issues from this skill.
