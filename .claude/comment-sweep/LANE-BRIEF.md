# `chore/comment-sweep` — LANE BRIEF

**Intent. Immutable.** If you believe this brief is wrong, say so — do not quietly work to a different one.

---

## 0. The work item

Strip the codebase back to comments that earn their place. The owner asked for this sweep some time ago and
it was never run — there is no comment-sweep commit anywhere in `--all` history.

**Measured on `origin/dev` before you start: 2,555 comment lines out of 10,987 in `apps/` and `packages/` —
23%.** Your set is 129 files of that. Worst offenders in your set, by density:

| % | lines | file |
|---|---|---|
| 55 | 115/208 | `apps/client/app/game/scene/sky-config.ts` |
| 51 | 64/124 | `apps/client/app/audio/remote-engine-audio.tsx` |
| 50 | 37/74 | `apps/client/app/game/scene/gltf-lfs-guard.ts` |
| 44 | 56/127 | `apps/client/app/game/overlays/threat-hud.tsx` |
| 42 | 30/71 | `apps/client/art-refs-plugin.ts` |
| 39 | 46/117 | `apps/client/app/dev/frame-tap-pump.ts` |
| 35 | 52/147 | `packages/shared/src/schema.ts` |
| 32 | 90/276 | `packages/shared/src/constants.ts` |

Numbers are a starting map, not a target. **There is no percentage to hit.** A file that legitimately needs
six comments keeps six; a file at 12% that is twelve restatements goes to zero.

## 1. The spec

**`CONTRIBUTING.md` §3 "Coding standards", on `dev` at `59805a1`. Read it — it is the authority, and this
brief does not restate it.** It was rewritten for this sweep because the old wording *caused* the problem:
"copy its comment density" made clutter self-propagating, and "comment the why, not the what" had no length
bound, so a seven-line account of how a bug was found qualified as a legitimate "why".

Its substance, so you know what you are applying: comment only what the code cannot say — a rejected
alternative, an external constraint, a non-obvious consequence — in **1–2 plain lines**; everything else is
**deleted, not shortened**; incident history goes in a PR body, not a file.

**If this brief and `CONTRIBUTING.md` ever disagree, `CONTRIBUTING.md` wins and you tell me.**

## 2. Scope

**Your set is `.claude/comment-sweep/FILES.txt` — 129 files, generated from `origin/dev`. Exactly that set.**

**18 files are excluded and belong to the live `art/track` lane**, which is editing them right now and is
applying the same rule to them itself: everything matching `scene/track*`, `scene/tube-walls.tsx`, and all
of `routes/art-lab/`. Touching one produces a conflict in a file another agent is actively rewriting. If you
think one of them needs something, tell me — do not edit it.

Note the sky files (`sky-config.ts`, `sky-backdrop.tsx`, `sky-environment.tsx`, `sky-follow.tsx`,
`deep-space-sky.tsx`) **are yours** — that task is closed and merged. The track lane has been told they are
not its.

**Not in scope:** renaming anything, restructuring code, "while I am here" fixes, test files, Markdown,
config. Comments only. A sweep that also refactors cannot be reviewed, because the comment change stops
being visible in the diff.

**One exception to comments-only, and only where it is genuinely free:** if deleting a comment leaves a name
that no longer explains itself, renaming that local is better than keeping the comment — that is the whole
point of the exercise. Keep such renames local and obvious (a `const t` that the comment explained is
`elapsedSeconds`), never an exported symbol, and list every one in your PR body so they can be reviewed
separately from the deletions.

## 3. Two exceptions that must survive — deleting these is a regression, not a win

1. **`useEffect` justification comments.** An uncommented Effect is a review failure in this repo, not a
   style nit — `CONTRIBUTING.md`'s "Anti-patterns" section and project non-negotiable #8 both say so, and
   the rule exists because coupling a Colyseus room's lifetime to a `useEffect` cleanup cost the project an
   entire session's work. Every Effect keeps a comment saying what outside-React system it synchronizes
   with and why no idiomatic mechanism fits. You may **tighten** these to 1–2 lines. You may not remove one.
   If you find an Effect with no justification comment, that is a **finding** — list it in your PR body; do
   not write one for it and do not delete the Effect.

2. **Tuning fields in `packages/shared/src/constants.ts`.** Each carries one line so the owner can tune the
   value live without reading the sim. Tighten to one line; never strip. This file is 90/276 and will look
   like your biggest win — it is mostly the exception, so it is nearly your smallest. Read before cutting.

## 4. What goes, with the failure modes named

- **Restatement.** The comment says what the line below says. Delete.
- **Forward references.** "Retoned in slice 2", "will be replaced when X lands". These rot by construction —
  one of them is what triggered this whole sweep, after an agent spent a turn updating a stale one. Delete.
  Genuinely pending work belongs in an issue.
- **Bug narratives.** "I got this wrong twice, then discovered…". The *conclusion* may survive as one line
  if it is non-obvious ("winding is computed from the intended normal because hand-ordering silently inverts
  faces"). The story does not.
- **"N mechanisms weighed" blocks.** The project requires enumerating alternatives before choosing a
  mechanism; it requires a **one-line** rationale in the code and the reasoning in the PR. Long versions in
  files are a misreading of that rule. Cut to one line.
- **Section-header comments** (`// ---- helpers ----`) and headers restating the module name. Delete.
- **Commented-out code.** Delete. It is in git.
- **Bare numeric citations** — `(D7)`, `ADR-006`, `§4`, `#118` standing alone. Either inline what it says
  and keep the location, or delete the comment. Never leave the bare number.

## 5. How to do it

**`Edit`, file by file. No `sed -i`, no `perl -pi`, no regex rewrite of source — non-negotiable #3.** A
regex that both matches and writes has already spliced four lines of comment into the middle of a doc header
in this repo and produced a file that still looked plausible. Comments are exactly the shape that lures a
regex, so this is the highest-risk possible task for it. `ast-grep` is available for structural work but is
the wrong tool here; comments are not in the syntax tree in a way that helps.

Work in **batches by area** — `game/scene/`, `game/overlays/`, `game/ecs/`, `audio/`, `net/`, `ui/`,
`iso-lab/`, `routes/`, `dev/`, `packages/shared/` — committing each with the gate green. One commit per area,
not one per file and not one for all 129. If you are unsure whether a comment survives, **keep it and list it
in `LANE-FACTS.md`**; I would rather review ten keepers than lose one load-bearing line.

**Read the code the comment sits on before deleting it.** The test is whether the code says it without the
comment, which you cannot answer without reading the code.

## 6. Gate

```
pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build
```

Run it **per area commit**, not once at the end. `pnpm -r test` **silently skips `@slur/shared`**, which
holds the sim and 75 tests — the explicit `--filter` is not redundant. Expect 3 pre-existing
`noExcessiveLinesPerFile` warnings and a "Canvas-isolation: 8 route entry modules clean" line.

**A green gate does not mean the sweep is right** — it means you did not break the build. A deleted comment
never fails a test. Judgement is the deliverable; the gate only catches you deleting real code by accident.

Watch for one real breakage: deleting a `biome-ignore` / `eslint-disable` / `@ts-expect-error` comment.
Those look like comments and are **code**. Never delete one.

## 7. Facts obligation

Maintain `.claude/comment-sweep/LANE-FACTS.md` **as you work**, committed with the code it describes — never
written at handover time, when the context that knew it is the thing being thrown away. Raw facts, one line
each: per-area before/after comment-line counts, every comment you kept but were unsure about with its
`file:line`, every uncommented `useEffect` found, every local rename, anything that surprised you.

## 8. Escalation

Do not ask the owner anything; route it to me. Use exactly this shape:

```
NEEDS-DECISION: <one line, specific, answerable>
CONTEXT: <2-4 lines>
OPTION A — <label>: <what it means> / consequence: <what it costs>
OPTION B — <label>: <...>
RECOMMENDATION: <which, and why>
IF NO ANSWER: <what you do meanwhile>
```

Escalate: a comment that looks like it encodes a decision nobody wrote down elsewhere; a file where applying
the rule would clearly make the code harder to follow; anything that turns out to need a code change to stay
readable. Do **not** escalate naming, ordering, which area to do first, or anything you can settle by reading
the code. Never treat silence as approval.

## 9. Traps already paid for

- **The shared checkout is read-only.** All work happens in `../slur-worktrees/comment-sweep`. Chain
  `cd <abs path> && <cmd>` in one call and verify `pwd` before anything that writes — a silently failed `cd`
  has already run a destructive git command in the shared checkout here.
- **No `Co-Authored-By` trailer.** This repo's commit hook rejects it, whatever the session attribution says.
- **Do not bundle `git add` and `git commit` in one `Bash` call** — a hook rejection kills the whole call.
- **No dev stack is running for this lane and none is needed.** The sweep has no visual gate. Do not start
  one; ports are not allocated for you.
- **No Python** — non-negotiable #1. `jq`/`yq`, then `fish`/`bash`, then node.

## 10. Done

All 129 files passed over, area commits green, pushed, PR opened against `dev` with: the before/after
density table, every local rename listed, every uncommented `useEffect` found, and every comment you kept
under doubt. I review the diff, not the summary — the diff is the deliverable.
