# Lane brief — split-crown

You are the `split-crown` lane. **Issue #159.** Everything about the work itself is in
**`.claude/art-pass/08-ships/BRIEF-SPLIT-CROWN.md`**, in this worktree — read it in full, including the
"Amendments" section at the bottom, and treat it as your spec. This file is the lane contract only.

**Do NOT read the big docs** — not the GDD, not the ADD, not `.claude/art-pass/INDEX.md`, not the
art-direction package. The brief is self-contained by construction. Walking the document graph is how
lanes burn their whole context having touched no code; it has happened twice.

## Your lane

| | |
|---|---|
| worktree | `/Users/apple/Projects/personal/slur-worktrees/split-crown` — **all edits and commits happen here**, never in the shared checkout at `/Users/apple/Projects/personal/slur` |
| branch | `art/split-crown`, cut from `origin/dev` @ `cf1c98c` (verified at dispatch) |
| client | `http://localhost:5200` |
| server | `:2600` |
| review URL | `http://localhost:5200/art-lab` |
| deps | `pnpm install` already run |
| ports | already written to `apps/client/.env` — **never hardcode or change them** |

## First action: start your own stack, and own it

```
cd /Users/apple/Projects/personal/slur-worktrees/split-crown
PORT=2600 pnpm dev > .claude/lane/dev.log 2>&1 &
```

- **`PORT` must equal `VITE_SERVER_PORT`.** `tsx` has no dotenv loader, so the server reads `PORT` from
  the shell while Vite reads the `.env` — that is why it is spelled out.
- **Never stream the dev server into your context.** It is backgrounded into
  `.claude/lane/dev.log` (already gitignored by `.claude/lane/.gitignore`); `tail` it on demand.
- **Check nothing is already listening on 5200/2600 before you start.** Two stacks on one worktree fails
  confusingly rather than loudly.
- **`curl -sI http://localhost:5200/art-lab` and get a 2xx before you judge anything on screen.** A
  black canvas is as likely to be a dead stack as a real result.
- **A stack that will not start is your first task and your first report**, with the log tail. It is not
  plumbing for me to fix.

Known stack trap: a fresh worktree sometimes serves a stale Vite dep cache, which makes koota's
`useWorld` see a null React and blanks the whole Canvas behind the error boundary. Fix is
`rm -rf apps/client/node_modules/.vite` and restart.

## The verify gate — all five, verbatim

```
pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build
```

**The `--filter` is not redundant.** `pnpm -r test` **silently skips `@slur/shared`**, which is exactly
where the ship tests you are editing live. A brief that named the partial gate is how work passes and
then fails review.

## Read-first, before you write code in a subsystem

- `CLAUDE.md` — the project's non-negotiables. Note #8/#10 (`useEffect` is an escape hatch; componentize
  by subscription boundary), #13/#14 (write to the INSTALLED stack, verified this session; enumerate ≥5
  mechanisms before reaching for a reflexive primitive).
- `conventions/r3f.md` — **you are touching R3F code**, so this one is mandatory, not optional. It also
  carries the house React style: `<Fragment>`, never `<>`; one component per file.

## How this is judged — a human eye, not a test

The gate for this slice is the ship on screen at `http://localhost:5200/art-lab`, **from the real chase
camera**, not the `/art-gallery` orbit camera (a side-facing glow is edge-on there and reads as unlit
even when it is correct).

What is being looked at: the Split Crown at true footprint, **nose forward**, with its authored marigold
and engine emission intact and no team wash anywhere. A backwards ship is obvious in one frame and
invisible to every test.

**Drive the user's own Chrome via the `claude-in-chrome` tools — never Playwright or Puppeteer.** The
point is the human loop: the user reviews by glancing at the same live tab. Screenshot files force them
to hunt a path in Finder. **Create your OWN tab with `tabs_create_mcp` and pass its `tabId` explicitly
on every call** — other lanes share this Chrome and will otherwise fight you for it.

## `LANE-FACTS.md` — from your first commit, not at handover

Maintain `.claude/art-pass/08-ships/LANE-FACTS.md` **as you work**, committed alongside the code it
describes. Raw facts, one line each: measurements with units, SHAs, `file:line` citations, gate results,
versions read from installed source, and **what you tried that failed**. No prose, no narrative — I write
those, from your numbers. `[unmeasured]` is a legitimate and valuable entry; never reconstruct a reading
you cannot source first-hand.

This is the half that makes clearing your context cheap. A lane without it is unrecoverable the moment it
fills.

## Escalation — you ask me, I ask the owner

Never ask the user directly. Never guess at human taste. Never treat silence as approval.

**Escalate:** art/taste judgements ("does this read right", "which variant"), anything reopening a frozen
decision or an ADR, anything touching gameplay (camera, collision, scale, hazard readability — never
art-only), anything costly to undo, a genuine fork with real trade-offs, and your research
recommendation *before* you implement it.

**Do NOT escalate:** naming, file layout, code structure; anything the brief already answers; and
anything settleable by **verifying** — an API's behaviour, a measured value, whether something renders.
Verify, don't ask.

Use exactly this shape:

```
NEEDS-DECISION: <one-line, specific, answerable>
CONTEXT: <2-4 lines: what you are doing, why this fork exists>
OPTION A — <label>: <what it means> / consequence: <what it costs or commits us to>
OPTION B — <label>: <...>
RECOMMENDATION: <which, and why — a recommendation without a defence is a preference>
IF NO ANSWER: <what you do meanwhile, or that you are genuinely blocked>
```

If the decision is visual, park your Chrome tab on it and say so, so the owner can just look.

## Done

- The gate green, all five commands.
- The eye-check passed at `/art-lab`.
- Committed and pushed on `art/split-crown`, PR opened against `dev` referencing **#159**.
- **`git diff origin/dev HEAD` — the 2-DOT diff — read before you ask for a merge.** Not the 3-dot form.
  Four branches in two weeks have had an innocent 3-dot diff and a 2-dot diff that silently deleted
  someone else's merged work. Say in the PR body that you checked it.
- No co-author trailer in any commit message: the repo's pre-commit hook rejects it outright, and it
  fires on the literal string anywhere in the message.
