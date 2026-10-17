Agent: slur-supervisor · Lane: supervision + RFC-349 F4 staging · Updated: 2026-10-17 (context warning at ~150k)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear, resume and spawn steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "[0-9]+k/1.0M"` (the new
status line); re-read after ~10 s until it shows 0k. Reply to a worker with SendMessage to `workerone`.
Older history: `git log -p -- .claude/handovers/slur-supervisor.md`.

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER OK 2026-10-17: workerone may start that one stack with `pnpm dev` and leave it running. It is up now.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE: the owner tests everything on /test-level. Every brief says so.
- OWNER RULE: never ask about an issue by number alone (title + one line).
- OWNER RULE (2026-09-30): every Agent-tool subagent runs with `model: "sonnet"`. Put it in every brief.
- ONLY THE OWNER DEPLOYS: `! docker desktop start && ./scripts/deploy.sh`. The supervisor's auto mode blocks it.
- Pushes: workers push their own green commits. The supervisor pushes doc commits.
- Prod: https://slur.kurmah.studio, live at b156a41 (owner deploy 2026-10-17).
- **OWNER GO-AHEAD 2026-10-17 for F4 mine → boost → shield → portal.** The supervisor approves a stage plan
  when it follows the F4a–F4c pattern and stays bit-equal. Anything that changes behaviour, the wire or the
  feature contract (beyond a new fixed hook) goes to the owner by AskUserQuestion.
- Post each approved plan as a comment on its issue. Workers seam often (~150k), and a handover may hold
  only a pointer to the plan.
- Look (#364 254d267), KEY LAYOUT (#368, ADR-032), pillars identical (ADR-018), black hole look: unchanged.

## Done this seam (2026-10-17)

- Filed F4c mine #403, F4d boost #404, F4e shield #405, F4f portal #406.
- Spawned workerone (pane w3C:p3, Opus 5.5 1M, auto mode). Lesson in memory (spawn needs config env).
- #403 F4c mine DONE, closed: sim 2b8c9d53, client 90446c94, docs 7c5a28f8. New fixed hook `run.settle`.
  Central files 35 → 22, draws 76 → 76, A/B bit-equal with a negative control. The live two-client run on
  :2567 was not done ("no server grant"); the server test mine-sync covers it.
- #404 F4d boost: owner chose B2 = A (boostTimer into boost fields.player, wire index 27 → 38, shifts 11
  fields). Plan on the #404 comment. Sim half 843882ee pushed (A/B bit-equal, boost fired 1342×, negative
  control diverges). New file apps/server/src/rooms/room-boost.test.ts (two-client decode) cleared.
- workerone saw 1 uncaptured server test failure once. Supervisor reran the server suite 5×: 100/100 each.
  Flake not reproduced.

## RFC-349 stages

| Stage | Issue | State |
|---|---|---|
| F4a bolt · F4b seeker | #395 · #397 | landed |
| F4c mine | #403 | landed, closed |
| F4d boost | #404 | sim half 843882ee; CLIENT HALF building (workerone) |
| F4e shield | #405 | next: plan → supervisor approves if pattern + bit-equal |
| F4f portal | #406 | after shield. Mine shock queue rename waits for this stage (F4c M7) |

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w3C:p3 | #404 F4d boost client half | building | the #404 claim list + room-boost.test.ts |

## Open owner items

1. Next deploy: boost moves a wire field, so open game tabs need a reload after it.
2. Build-stage warning: `msgpackr-extract` native compile fails in the Docker build stage (no Python). Runtime
   stage installs it cleanly. Not blocking. Not filed.
3. First-use black hole shader compile hitch, ~20–29 ms at mount. Not filed.
4. Audit follow-up docs issues; triage list (RFC S4/S5/S6/S12, vertical-reach validator, four art issues);
   keep-open #344, #300 S4, #70, #14, #16, #312/#313.

## Uncommitted

None of mine.

## Next

1. On workerone's boost landing: verify the push, `gh issue view 404 --json state`, report to the owner.
2. Shield plan: approve if it follows the pattern and stays bit-equal; post it on #405; else ask the owner.
3. Same for portal. Then report the F4 series done and offer a deploy.

## Lessons → memory

none new this seam (the herdr spawn lesson was saved earlier today).
