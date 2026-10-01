Agent: slur-supervisor · Lane: supervision + RFC-349 staging · Updated: 2026-10-01 (seam 20 — context warning at ~155k)

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
- OWNER RULE (2026-09-30): every Agent-tool subagent runs with `model: "sonnet"`. Put it in every brief.
- ONLY THE OWNER DEPLOYS: `! docker desktop start && ./scripts/deploy.sh`.
- Pushes: workers push their own green commits. The supervisor pushes doc commits.
- Prod: https://slur.kurmah.studio. do-setup owns infra.
- Look (#364 254d267): HDRI cyclorama_hard_light 1k, Environment.rotation 210, intensity 1, Metal + Hull
  baseColor #232324, Neutral tone mapping exposure 1.
- KEY LAYOUT (#368, ADR-032): ↑/↓ throttle/brake, ←/→ strafe, Space jump, E fire fwd, D fire back, S/F
  prev/next slot, X drop, M mute, Esc.
- RFC-349 F3 = GO: F4 one feature per stage, bolt, seeker, mine, boost, shield, portal. One issue per stage.
- Pillars stay identical (ADR-018). Owner closed #396 (per-pillar sizes) 2026-10-01 "for now".
- Black hole look approved 2026-10-01: side 28, minAngle 18, radius 900. No lift dial. No spectator shake.

## Done this seam (2026-09-30 → 10-01)

- #395 F4a bolt landed 85365ecc (workerone, closed). Central 34 → 29; ≤2 not met (D7).
- #393 meteor flash lingers 745fc30b · #392 meteor lands near player 7a90abc6 · #398 meteor shake
  c8d31137 (peak roll median 0.12° → 0.88°; pit strikes step onto deck) — workertwo, all closed.
- #394 black hole prototype 84be557c, bigger + right f7d996d0/1419038d, panel dials e5a6232e — closed
  by supervisor on owner sign-off. #399 into WorldScene, ?blackhole removed, refine hitch 22 → 13 ms
  76426500 — workerthree, closed.
- #396 monolith size variation filed, then closed not-planned (conflicts ADR-018).
- #397 F4b seeker filed; owner approved S1–S6 as recommended (comment on #397).
- #400 hosted room renders near-black filed.

## RFC-349 stages

| Stage | Issue | State |
|---|---|---|
| F2 tug | #390 | landed f4e78880 |
| F4a bolt | #395 | landed 85365ecc |
| F4b seeker | #397 | BUILDING workerone. Shared half done (it broke /test-level once mid-move; fixed, dist rebuilt). Client half next, leaf-first |
| F4c… mine, boost, shield, portal | — | one issue each, in order |
| S4/S5, S6 (closes #70), S12 | — | not filed; S4/S5/S7 touch attach-room-to-world.ts → sequence around F4 |

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2Z:p2 | #397 F4b seeker | building | shared features/seeker/**, combat/{target-lock,constants,power-bag,mine}.ts + tests, run/{combat,portal-run}.ts, schema.ts, sim-config.ts, index.ts, features/registry*, features/tug/*; client features/seeker/**, scene/pickup-layout/, client-features.ts, define-client-feature.ts, net-hud.tsx, net-canvas.tsx, pickup-field.tsx, glyph-atlas.ts, ecs/traits.ts, attach-room-to-world.ts, tests |
| workertwo | w2Z:p3 | #400 dark hosted room | CLEARED to fix | env-band/env-band.state.ts |
| workerthree | w2Z:p5 | — | cleared + resumed, idle | none |
| do-setup | w2Z:p4 | infra | idle | — |

## #400 cause (workertwo, measured)

`env-band.state.ts` caches its band render target in a module object across WebGL contexts. The first
canvas (landing) draws it. The next canvas gets a cache hit and an undrawn texture → black env → black
deck/rocks/hull. Repro: `/test-level` direct = lit; `/` → navigate `/test-level` = black. Fix approved:
renderer in the cache key, dispose and rebuild. Prod likely affected [inferred] → owner deploys after.

## Open owner items

1. #400: after the fix lands, the owner should check a hosted room and decide on a deploy.
2. First-use black hole shader compile: one ~20–29 ms frame at mount; `renderer.compileAsync` candidate
   [untested]. Not filed.
3. workerone's optional idea: give the 22 D7 client files neutral names to reach the ≤2 central target.
4. Exhaust blue tail (handover 66a90ae4): owner to say where it shows.
5. Audit follow-up: one docs issue per doc (GDD, TDD, ADD). The ADD pillar line now matches the code.
6. Triage list still waiting: RFC S4/S5/S6/S12 issues; vertical-reach validator; four art issues.
7. Keep-open issues waiting on owner: #344, #300 S4, #70. Older: #14 Q1/Q2, #16, #312/#313.

## Uncommitted

None of mine.

## Next

1. Wait for workertwo's #400 report; verify the push; tell the owner how to check and that prod needs a deploy.
2. Wait for workerone's #397 landing; verify; file F4c (mine) and get a plan from workerone.
3. workerthree is free: offer the owner a lane (the shader compile hitch, or a triage item).

## Lessons → memory

none (the env-band cross-context cache is workertwo's to record).
