Agent: slur-supervisor · Lane: supervision + RFC-349 staging · Updated: 2026-09-30 (seam 19 — context warning at ~155k)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "░+ [0-9]+%"`; re-read
until 0%. Reply to a worker's cross-session message with SendMessage to its `from=` address.
Older history: `git log -p -- .claude/handovers/slur-supervisor.md`.

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE: the owner tests everything on /test-level. Every brief says so.
- OWNER RULE: never ask about an issue by number alone (title + one line).
- OWNER RULE (2026-09-30): every Agent-tool subagent runs with `model: "sonnet"` (memory
  subagents-run-on-sonnet.md). Put it in every brief.
- ONLY THE OWNER DEPLOYS: `! docker desktop start && ./scripts/deploy.sh`.
- Pushes: workers push their own green commits. The owner told the supervisor to push doc commits and,
  on 2026-09-30, to push F2.
- Prod: https://slur.kurmah.studio. do-setup owns infra.
- Look (#364 254d267): HDRI cyclorama_hard_light 1k, Environment.rotation 210, intensity 1, Metal + Hull
  baseColor #232324, Neutral tone mapping exposure 1.
- KEY LAYOUT (#368, ADR-032): ↑/↓ throttle/brake, ←/→ strafe, Space jump, E fire fwd, D fire back, S/F
  prev/next slot, X drop, M mute, Esc.
- RFC-349 §8 Q1–Q10 all answered (see RFC §8). F3 = GO (2026-09-30): F4 one feature per stage, bolt
  first, then seeker, mine, boost, shield, portal — file one issue per stage when it starts.
- Schema reorder exception for F-stage moves added (6ab55397), rules/features.md + conventions/features.md.

## Done this seam

- Issues closed 2026-09-30 (owner): #348 (superseded by #368), #345, #369, #337, #338, #339, #340, #341.
- Doc audits (Sonnet agents): `.claude/reports/GDD-DEVIATIONS.md` (6 open, 3 resolved),
  `TDD-DEVIATIONS.md` (12, first audit), `ADD-DEVIATIONS.md` (9) — ae7b6f6c. Nearly all are doc moves.
- Filed #392 (meteor strikes land near the player), #393 (meteor deck reflection lingers), #394 (port
  vgpu black hole, plan first), #395 (F4a bolt).
- F2 #390 f4e78880 pushed with 6ce35c5d, 66a90ae4; rule exception 6ab55397 pushed.

## RFC-349 stages

| Stage | Issue | State |
|---|---|---|
| S0–S3 S8 S10 S10b S14–S20, F1 | various | landed (RFC §7) |
| F2 tug pilot | #390 | landed f4e78880. Central tug files 19 → 8 (D2/D3 keep 6). simulate() within noise. Draws 74. workerone told to close #390 |
| F3 | — | GO 2026-09-30 |
| F4a bolt | #395 | ASSIGNED workerone (claim list pending) |
| F4b… seeker, mine, boost, shield, portal | — | one issue each, in order |
| S4/S5, S6 (closes #70), S12 | — | not filed; S4/S5/S7 touch attach-room-to-world.ts → sequence around F4 |
| S21 | — | deferred (Q10) |
| RFC §7 rows | — | F2 row + §3.8 updated by workerone in f4e78880 (verify); add F3 GO + F4a rows |

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2Z:p2 | #395 F4a bolt | cleared + resumed 2026-09-30, briefed | claim list pending |
| workertwo | w2Z:p3 | #393 then #392 meteor strikes | cleared + resumed, planning | meteor-strikes/*, meteor-chunks/*, meteor-scorch/*, deck reflection layers (exact list pending) |
| workerthree | w2Z:p5 | #394 black hole port — PLAN ONLY → `.claude/phases/2026-09-30-black-hole-plan.md` | cleared + resumed | none |
| do-setup | w2Z:p4 | infra | idle | — |

## Open owner items

0a. F4a #395 bolt — ANSWERED 2026-09-30: owner accepted all four picks; workerone told to build (also on
    #395 as a comment). Bolt stays first. The picks:
    D4 PowerSpec `bagRest: true` (bags bit-equal) · D5 fixed hook `run.strike` where stepBolts runs
    (bit-equal) · D6 keep `projectiles` in RunState this stage · D7 shared streak/ember/BOLT_* palette/
    block-shake/sfx stay central (central count 36 → ~18–22 inferred). Supervisor recommends all four.
    Also offered: start F4 with a simpler feature (shield/boost); supervisor leans bolt first.
0b. ANSWERED 2026-09-30: P2 finish line · COLD tint · CREDITS ok · low still ok. workerthree (14% at
    brief — will seam soon) building the /test-level?blackhole=finish prototype. CLAIM CLEARED: new
    game/scene/black-hole/**, routes/test-level/route.tsx, test-level-canvas.tsx, dev/tuning-schema.ts
    (one additive BlackHole block; sequence if workertwo claims it), CREDITS.md.
    #394 black hole plan: `.claude/phases/2026-09-30-black-hole-plan.md` (87dd59db). Recommended
    option A (GLSL port, baked geodesic G-buffer, shaded in prerender into a fixed-size target, drawn
    on a quad; our bloom/tone map). MIT (Vercel). WebGL2 only. Budget high ≤0.6 ms, medium ≤0.25,
    low = frozen still [unmeasured]. Owner questions: placement (P1 landing hero · P2 finish landmark
    [worker pick] · P3 race sky · P4 portal) · colour (warm ramp · marigold tint · greyscale) ·
    CREDITS.md "Code" section ok? · low tier frozen still ok? workerthree idle, holds no files.

1. Exhaust blue tail: workerthree's probe found no blue in any view (handover 66a90ae4). Owner to say
   where it shows and whether Exhaust leva values were changed. Candidate fixes: Exhaust.hot #fff1dc →
   ~#ffd9a0, Exhaust.heat 1 → 2–3.
2. Audit follow-up: file one docs issue per doc (GDD, TDD, ADD) and give the fixes a lane. ADD blocker:
   `docs/ADD.md:114` says pillars are "one identical square column, repeated in mirrored pairs", but
   568c523 made them vary — owner picks doc or code.
3. New-issue list from the 2026-09-30 triage still awaits the owner: RFC S4/S5/S6/S12 issues; vertical-reach
   validator; four art issues (lighting to golden reference, track deck/wear, Split Crown, block art).
4. Keep-open issues waiting on owner: #344 (real phone test), #300 S4 (on hold), #70 (→ S6).
5. Older: S19/S20/#389/#375 owner checks; #14 reconnection Q1/Q2; #16; #312/#313 unassigned.

## Uncommitted

None of mine.

## Next

1. Answer workerone's and workertwo's claim lists (check for overlap: bolt files vs meteor/reflection).
2. Relay workerthree's #394 plan to the owner when it lands.
3. When #393/#392 land, remind the owner to check on /test-level.
4. Fix `.claude/backlog.md` stale lines (#311 done; S7 line merged into S6 paragraph) when filing the
   owner-approved issues.

## Lessons → memory

subagents-run-on-sonnet.md (ae7b6f6c).
