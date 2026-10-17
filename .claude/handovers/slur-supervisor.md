Agent: slur-supervisor · Lane: supervision · Updated: 2026-10-17 (all Claude sessions being restarted by the owner)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear, resume and spawn steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read a worker's context with `grep -oE "[0-9]+k/1.0M"` on
`herdr pane read <pane>`; re-read after ~10 s until it shows 0k.
Older history: `git log -p -- .claude/handovers/slur-supervisor.md`. Lane history: `.claude/phases/worklog.md`.

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER OK 2026-10-17: a worker may start that one stack with `pnpm dev` and leave it running.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE: the owner tests everything on /test-level. Every brief says so.
- OWNER RULE: never ask about an issue by number alone (title + one line).
- OWNER RULE (2026-09-30): every Agent-tool subagent runs with `model: "sonnet"`. Put it in every brief.
- ONLY THE OWNER DEPLOYS: `! docker desktop start && ./scripts/deploy.sh`. The supervisor's auto mode blocks it.
- Pushes: workers push their own green commits. The supervisor pushes doc commits.
- Prod: https://slur.kurmah.studio, live at b156a41 (owner deploy 2026-10-17). Not yet carrying F4c–F4f.
- Plan gate: the supervisor may approve a plan that follows an established pattern and stays bit-equal.
  Wire, behaviour and feature-contract changes go to the owner by AskUserQuestion.
- Look (#364 254d267), KEY LAYOUT (#368, ADR-032), pillars identical (ADR-018), black hole look: unchanged.

## Done this seam (2026-10-17)

RFC-349 F4 series complete. Every power now lives in its own feature folder on both ends.

| Stage | Issue | Commits | Notes |
|---|---|---|---|
| F4c mine | #403 closed | 2b8c9d53, 90446c94, 7c5a28f8 | new fixed hook `run.settle`; central 35 → 22 |
| F4d boost | #404 closed | 843882ee, 2eab6b3b, 01c11636 | owner B2=A: boostTimer wire index 27 → 38; central 36 → 23 |
| F4e shield | #405 closed | 24e4df3e, adab9982, 88fb4f95 | owner E2/E6/E8=A: shield fields moved, `run.reset(ctx)`, `views.ship`, `NetContext.entityOf`; new `run.ward` |
| F4f portal | #406 closed | 1408cce9, 18a5cff2, dcae4c24 | owner all-A: `run.tap`, `run.hop`, `PowerSpec.uses`, `hud.glyphs`; firePower deleted; central 34 → 21 |

Every stage: RunSim A/B bit-equal over 6 seeds × 3600 ticks plus a diverging negative control; draws
unchanged (/test-level 76 idle). Approved plans are comments on each issue. Supervisor check at e6816890:
typecheck ok; shared 586, server 101, client 730 pass.

## Workers

None. The owner restarted every Claude session on 2026-10-17. workerone's tab was closed. The dev stack it
had started stopped with it, so :5173/:2567 are down. `katta-supervisor` (pane w3F:p1) belongs to another
project; it is not ours.

To start a worker again: memory `supervisor-clears-workers-via-herdr.md`, section "Spawning a worker".

## Open owner items

1. Deploy F4c–F4f: `! ./scripts/deploy.sh`. Boost and shield moved wire fields, so open tabs must reload.
2. Next lane: RFC S4/S5, S6 (closes #70), S12 are not filed. S4/S5/S7 touch attach-room-to-world.ts.
3. Mine shock queue (`mine-shock-events.ts`) is used by portal too; a neutral rename is still open.
4. Build-stage warning: `msgpackr-extract` native compile fails in the Docker build stage (no Python).
   Runtime stage installs it cleanly. Not blocking. Not filed.
5. The conventions skill reports no rule card for `@colyseus/schema` (`/conventions-build`).
6. First-use black hole shader compile hitch, ~20–29 ms at mount. Not filed.
7. Triage: vertical-reach validator; four art issues; docs issues per GDD/TDD/ADD; keep-open #344, #300 S4,
   #70, #14, #16, #312/#313.

## Uncommitted

None.

## Next

1. On resume: `ListAgents`, `git status`, `git log -3`. Confirm the worklog run 2 commit landed.
2. Ask the owner for the next lane and whether to deploy.

## Lessons → memory

`post-approved-plans-on-the-issue.md` (new). `supervisor-clears-workers-via-herdr.md` (spawn section, earlier today).
