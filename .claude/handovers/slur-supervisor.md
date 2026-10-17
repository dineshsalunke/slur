Agent: slur-supervisor · Lane: supervision + RFC-349 staging · Updated: 2026-10-17

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear, resume and spawn steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "░+ [0-9]+%"`; re-read
until 0%. Reply to a worker's cross-session message with SendMessage to its `from=` address.
Older history: `git log -p -- .claude/handovers/slur-supervisor.md`.

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE: the owner tests everything on /test-level. Every brief says so.
- OWNER RULE: never ask about an issue by number alone (title + one line).
- OWNER RULE (2026-09-30): every Agent-tool subagent runs with `model: "sonnet"`. Put it in every brief.
- ONLY THE OWNER DEPLOYS: `! docker desktop start && ./scripts/deploy.sh`. The supervisor's auto mode blocks it.
- Pushes: workers push their own green commits. The supervisor pushes doc commits.
- Prod: https://slur.kurmah.studio. do-setup owns infra.
- Look (#364 254d267): HDRI cyclorama_hard_light 1k, Environment.rotation 210, intensity 1, Metal + Hull
  baseColor #232324, Neutral tone mapping exposure 1.
- KEY LAYOUT (#368, ADR-032): ↑/↓ throttle/brake, ←/→ strafe, Space jump, E fire fwd, D fire back, S/F
  prev/next slot, X drop, M mute, Esc.
- RFC-349 F3 = GO: F4 one feature per stage, bolt, seeker, mine, boost, shield, portal. One issue per stage.
  Owner 2026-10-17: "lets take care of this" for mine → portal. Each stage still needs plan approval.
- Pillars stay identical (ADR-018). Owner closed #396 (per-pillar sizes) 2026-10-01 "for now".
- Black hole look approved 2026-10-01: side 28, minAngle 18, radius 900. No lift dial. No spectator shake.

## Done this seam (2026-10-01 → 10-17)

- #397 F4b seeker landed f80acb55 (sim) + 65784e33 (client), closed by workerone. Numbers in RFC §3.8.
- 589788c5 env-band test format fix (supervisor).
- Owner deployed prod 2026-10-17: live at b156a41 (black hole, meteor fixes, #400, F4b).
- Filed F4c mine #403, F4d boost #404, F4e shield #405, F4f portal #406. Sequential: one worker.
- Old worker panes were gone. Spawned a fresh workerone (pane w3C:p3, Opus 5.5 1M, auto mode).

## RFC-349 stages

| Stage | Issue | State |
|---|---|---|
| F2 tug | #390 | landed f4e78880 |
| F4a bolt | #395 | landed 85365ecc |
| F4b seeker | #397 | landed f80acb55 + 65784e33 |
| F4c mine | #403 | PLANNING workerone. Plan → owner before the first edit |
| F4d boost | #404 | after F4c |
| F4e shield | #405 | after F4d |
| F4f portal | #406 | after F4e |
| S4/S5, S6 (closes #70), S12 | — | not filed; S4/S5/S7 touch attach-room-to-world.ts → sequence around F4 |

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w3C:p3 | #403 F4c mine | planning, no edits | none until the plan is approved |

## Open owner items

1. F4c mine plan: relay to the owner when workerone sends it.
2. Build-stage warning: `msgpackr-extract` native compile fails in the Docker build stage (no Python). The
   runtime stage installs it cleanly. Not blocking. Not filed.
3. First-use black hole shader compile: one ~20–29 ms frame at mount; `renderer.compileAsync` candidate
   [untested]. Not filed.
4. workerone's optional idea: give the 22 D7 client files neutral names to reach the ≤2 central target.
5. Exhaust blue tail (handover 66a90ae4): owner to say where it shows.
6. Audit follow-up: one docs issue per doc (GDD, TDD, ADD).
7. Triage list still waiting: RFC S4/S5/S6/S12 issues; vertical-reach validator; four art issues.
8. Keep-open issues waiting on owner: #344, #300 S4, #70. Older: #14 Q1/Q2, #16, #312/#313.

## Uncommitted

None of mine.

## Next

1. Wait for workerone's F4c plan. Relay it to the owner by title, with each decision and its recommendation.
2. On approval, take workerone's claim list and answer "clear".
3. On landing: verify the push, check that the issue is closed, then brief F4d boost.

## Lessons → memory

`supervisor-clears-workers-via-herdr.md`: a new section on spawning a worker (the env vars a new pane needs).
