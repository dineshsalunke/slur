---
name: issue-loop
description: >-
  Autonomous issue-worker loop for the slur repo. Pick an open GitHub issue,
  vet it for acceptance criteria + design references (flag thin issues with a
  triage comment + `needs-detail`), claim it with a lock comment, build it to
  the project bar, open a PR, then monitor that PR until it merges. Triggers:
  /issue-loop, "work the issues", "pick up an issue and build it". Pairs with
  /loop for interval scheduling.
---

# issue-loop — pick → lock → build → PR → monitor → merge

> **External contributors must fork.** Only collaborators can push to `dineshsalunke/slur`. If
> you are not one, pushing to the upstream fails and there is no way around it — fork the repo,
> push branches to **your fork**, and open **cross-repo** PRs (`--head <you>:<branch>`). Check
> once, up front: `gh api repos/dineshsalunke/slur --jq .permissions` — `push: false` means
> external. Every step below that touches `git` or `gh` branches on this.

One agent, one issue at a time, end to end. This skill is the **body of a loop**: it
does a full issue and comes back for the next. Run it under `/loop` to schedule
iterations, or let it self-pace (finish one issue, start the next).

Repo: `github.com/dineshsalunke/slur`.

**Establish who you are before anything else** — this skill runs under more than one account and
several steps below branch on the answer:

```
gh auth status                                    # ME = the authenticated login
gh api repos/dineshsalunke/slur --jq .permissions # push:true = collaborator, push:false = fork contributor
```

Use `ME` wherever this document says "you", and never hardcode an identity into a lock comment
or PR body. A lock signed with the wrong name is worse than no lock — the other agent reads it
as its own and may reclaim the issue.

- **`push: true`** → branch on the upstream, push there, open the PR normally.
- **`push: false`** → you are a **fork contributor**: work on your fork and open cross-repo PRs
  (Step 5). Pushing to the upstream will fail, so do not plan around it.

Pass `-R dineshsalunke/slur` on every `gh` call. From a fork, a bare `gh` command resolves
against your own remote and quietly targets the wrong repository.

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
gh issue list --state open --limit 40
```

Choose the best candidate. Prefer, in order: a `priority` or `bug` label, then a clear
spec you can build without more design agreement. Don't confuse a *labelled* issue with a
*specified* one — **Step 1.5 vets the spec before you commit to building.** **Skip**:

- Any issue already **locked by another agent** — a fresh `🔒 Lock claimed` comment (< 3h old)
  whose author is **not `ME`** (`gh issue view <n> -R dineshsalunke/slur --comments`). The hard
  boundary is: **never implement an issue another agent holds.** Compare against `ME` rather
  than a hardcoded name, so the rule holds whichever account is running. If a lock is stale
  (> 3h), you may reclaim it, but say so in your lock comment.
- `gate` issues (human feel-gate — not code).
- Pure design/RFC issues where CONTRIBUTING §2 says a maintainer must approve the design
  first and that has not happened. Comment your design and wait; do not implement.

If nothing is workable, say so and stop (or, under `/loop`, wait for the next tick).

## Step 1.5 — vet the issue is build-ready (triage gate)

Before you lock and build, read the issue's **full body and every comment**
(`gh issue view <n> -R dineshsalunke/slur --comments`) and check it clears the spec bar. A
thin issue built blind produces slop and rework; vetting it — and enriching it with the
references it should carry — is itself useful triage work, valuable even when you don't go
on to build it. (Comments matter: a maintainer may have already dropped GDD/ADR references
or a reconciliation note there.)

**The bar — an issue is build-ready only when it has all of:**

- A clear **problem / goal** — what and why.
- **Expected behaviour** — what "working" looks like, in plain English.
- **Acceptance criteria** (or an explicit DoD) — a checkable list a reviewer can tick off.
- **Design references wherever the issue touches design** — the governing `GDD §`, `TDD §`,
  `ADD`, `AUDIO`, an ADR in `docs/DECISIONS.md`, and/or the `conventions/*.md` for the
  subsystem. (A pure tooling/infra issue may legitimately need none — judge by whether a
  builder would have to *guess* a design decision.)
- A **subsystem / file pointer** so the builder knows where to look.
- The correct **domain label(s)** (`bug` / `enhancement` / `art` / `netcode` / `infra` /
  `tech-debt` / …).

**If it clears the bar** → proceed to Step 2 (lock + build).

**If it does NOT clear the bar** → do not build it blind. In one pass:

1. **Enrich what you can derive.** Read the docs and add the references the issue *should*
   carry — the exact GDD/TDD/ADD § + ADR that govern it, the subsystem `conventions/*.md`,
   the likely files. This is the high-value move: it turns a thin issue into a buildable one.
   **Do not invent acceptance criteria that encode a design decision a maintainer owns** —
   that is the "pure design/RFC" case (Step 1): propose, don't decide.
2. **Post a triage comment** — plain English, checkbox format so a human *and* the next agent
   can act on it. State exactly what's missing and paste the references you found:

   ```
   gh issue comment <n> -R dineshsalunke/slur --body "$(cat <<'EOF'
   **Triage (issue-loop vet) — not yet build-ready.**

   Missing before this can be built cleanly:
   - [ ] Expected behaviour (what "working" looks like)
   - [ ] Acceptance criteria / DoD (checkable list)
   - [ ] <anything else>

   Design references it should carry (found while vetting):
   - GDD §<x> — <what it governs>
   - <TDD/ADD/ADR/conventions ref>

   Files likely involved: <paths>
   EOF
   )"
   ```

3. **Tag it** so the queue reflects the gap:

   ```
   gh issue edit <n> -R dineshsalunke/slur --add-label needs-detail
   gh issue edit <n> -R dineshsalunke/slur --add-label <correct-domain-label>   # if it lacks one
   ```

   `needs-detail` is the "not build-ready" flag. Create it once if the repo lacks it:
   `gh label create needs-detail -R dineshsalunke/slur --color D4C5F9 --description "Missing acceptance criteria / design references — not build-ready"`.
   When a later pass (yours or a maintainer's) fills the gaps, **remove** it:
   `--remove-label needs-detail`.

4. **Move on** — an under-spec issue is not yours to build on a guess. Pick the next workable
   issue (Step 1). Under `/loop`, flagging + enriching one thin issue is a complete, useful
   iteration on its own.

**Game-mechanics issues — also validate the GDD (mandatory extra gate).** If the issue touches
a game mechanic (movement, combat, hazards/track, ship classes, pickups, modes — the **GDD §5**
surface), cross-check it against the **current GDD** before it can be build-ready:

- **Consistent?** If the change contradicts a *locked* decision — straight-ribbon-only, no
  autonomous moving geometry, disruption-not-death, the agility ⊥ armour dodge axis, or the §0
  spatial contract — that is a **design conflict**, not a build task. Post the conflict on the
  issue and surface it to a maintainer; do not resolve it on your own authority.
- **Captured?** If it adds or changes design intent the GDD does not yet state, the GDD must be
  updated (design docs are living — Rule 0). Either the issue already cites the governing
  `GDD §`, or **folding the GDD update into the same PR is part of the work.** Code that ships a
  mechanic change the GDD never records is a silent divergence — reject it.

A game-mechanics issue with no GDD reference is not build-ready: tag `needs-detail`, name the
missing §, and — where you can — cite the § it should carry, same as any other spec gap.

Only issues that clear the bar — originally, or after your enrichment closes the gap *without
inventing design* — proceed to Step 2.

## Step 2 — claim it with a lock comment

Post this exact format so it interoperates with the other agent's protocol. State an
**absolute UTC expiry**, not just a duration — a reader should not have to do arithmetic on
the comment timestamp to know whether a lock is stale:

```
gh issue comment <n> -R dineshsalunke/slur --body $'🔒 **Lock claimed** — `<ME>` / Claude, `<now> UTC`, valid until `<now+3h> UTC`.\n\n<one line: the approach you will take>'
```

**Then re-read the thread before you write code.** Step 1's filter and this comment are not
atomic: both agents can list, pick the same issue, and claim it seconds apart, after which
each believes it holds the lock. If another lock comment predates yours, **yield** — release
yours and pick again. Cheap, and the failure it prevents is two agents building the same
issue.

The lock covers **implementing**, not talking. Posting a design proposal, a measurement, or
a correction on an issue you do not hold is fine and encouraged — silence is the worse
failure.

Renew the lock (re-comment) roughly every 2.5h while you are still on the issue. Release it
with a short comment if you abandon the issue.

## Step 3 — build it

- **Branch off `dev`** (the default branch): `git fetch origin && git switch -c
  <type>/<issue-short-desc> origin/dev`. Branch off the **fetched** ref, not a local `dev` that
  may be behind. Never commit straight to `dev`. If the working tree is dirty, stash or stop.
- Follow the arc where the work is non-trivial (`/arc` skill). The issue is the RFC; for a
  non-trivial change confirm the design is agreed on the issue before implementing.
- **Match the surrounding code.** Copy its naming, comment density, idioms. Comment the
  *why*, not the *what*.
- **Tests are required where the surface can be tested** (CONTRIBUTING §4). Shared-sim
  changes MUST have tests. A bug fix starts with a failing test that reproduces the bug.
- **Never derive a test's expected value from the function under test.** `assert(f(x) ===
  f(x))` passes with `f` inverted. Use literals for balance numbers, or compare two
  configurations differentially (e.g. double a tuning knob and assert the output moved) —
  that proves the parameter is wired without pinning a value the gate may retune.
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
feel. Driving the app needs the LFS assets: `git lfs install && git lfs pull` first, or the
ship `.gltf` files load as pointer text and R3F dies with an unrelated-looking JSON error.

**Prove each new test can FAIL.** A passing suite shows the code compiles, not that anything
is being watched. For every test you added or changed, break the code it covers, confirm the
test goes red, then revert and confirm `git diff` is empty. This is not optional diligence —
tests that assert nothing have shipped here repeatedly: an ordering test that passed with the
stat collapsed to a 4ms spread, a corridor floor that sat 3x below anything reachable, a
"not instantly killed" test that passed with the mechanism it guarded removed. Each looked
rigorous and was green.

Before committing, **scan the diff** for leftover `console.*`, `TODO`, temp/debug code.

## Step 5 — commit and open the PR

- **Conventional commits**, scoped by package: `feat(client): …`, `fix(shared): …`, `docs: …`.
- **Never add a `Co-Authored-By` trailer** — the commit hook rejects it. Do **not** bundle
  `git add` and `git commit` into one shell call (a hook rejection kills the whole call).
- Push the branch and open the PR — **the command depends on the access you checked at the
  top**:

```
# push: true (collaborator) — branch lives on the upstream
git push -u origin <branch>
gh pr create -R dineshsalunke/slur --base dev --title "<conventional title>" --body "<body>"

# push: false (fork contributor) — branch lives on YOUR fork, PR is cross-repo
git push -u fork <branch>
gh pr create -R dineshsalunke/slur --base dev --head <ME>:<branch> \
  --title "<conventional title>" --body "<body>"
```

Without `--head <ME>:<branch>` the cross-repo form fails or targets the wrong branch. If you
have no `fork` remote yet: `gh repo fork dineshsalunke/slur --clone=false` then
`git remote add fork git@github.com:<ME>/slur.git`.

PR body must: **link the issue** (`Closes #<n>`), state the design in brief, and **state how
you verified it** — paste the gate output, and the manual playtest result if it has a feel or
visual surface. Include an honest "what I did NOT do" note when you cut scope.

## Step 6 — monitor the PR until it merges

Watch the PR and respond to review. This is a loop of its own:

```
gh pr view <n> --comments
gh pr checks <n>
```

- **Address every review comment.** Push follow-up commits to the same branch; re-run the
  full verify gate after each change; reply on the thread explaining what you changed (or
  why you disagree — defend with evidence, do not just comply).
- Watch for **stale-baseline** reviews: if a reviewer says "the fix isn't there", check
  whether their baseline sha is behind `origin/dev` before agreeing.
- Keep the issue lock fresh while the PR is open.
- If CI goes red, fix it before anything else.
- **If you published a claim that turns out to be wrong, retract it loudly on the same
  thread** — a new comment saying so, not a quiet edit. You post confident conclusions that a
  maintainer may act on, so a stale wrong claim costs more than the embarrassment of
  correcting it. Say what you got wrong and what still stands.

When the PR is **merged**, delete the branch, drop a closing note on the issue if useful,
and return to Step 1 for the next issue (or end the iteration under `/loop`).

## Context — you are not the only agent here

This repo is worked by **more than one Claude at a time** (today: the owner's, and mahendra's
via a fork). That is why the lock protocol exists and why several steps above look paranoid:

- Locks are `🔒 Lock claimed` comments with a ~3h TTL, renewed by re-commenting. They cover
  **implementing**; commenting a design or a finding never needs one.
- **Baselines drift fast** — `git fetch` before believing a review that says your fix is
  missing, and before concluding someone else's is.
- Expect **genuine pushback** on your PRs, and give it back with evidence rather than
  complying by default. The other agent has caught real defects here, and so have you.
- Post findings and corrections **on the thread**, so the reasoning is visible and not just
  the outcome.

## Boundaries

- Do not merge your own PR here — merging is the reviewer loop's job (`/pr-loop`) or a human's.
- If anything is ambiguous, or a change would touch a non-negotiable, **stop and surface it**
  to the user rather than guessing.
- Never use Python for tooling/scripts (NN-1): `jq`/`yq` → `fish`/`bash` → ecosystem-native.
