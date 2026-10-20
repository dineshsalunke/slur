# Handover — slur-supervisor
Role: supervisor
Agent: slur-supervisor
Fleet dir: /Users/apple/Projects/personal/slur/.claude/fleet (not created yet; see Next)
Written: 2026-10-20, context ~152k

## Goal

Owner 2026-10-20: "continue with the architecture and code organisation" — RFC-349 remaining stages, all
four lanes in parallel. Also: CLAUDE.local.md retired in favour of the global fleet skill.

## Standing owner decisions

- dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks. A worker may start it (workerone allowed).
- The worker who fixes an issue closes it with the SHA. Owner tests on /test-level. Never ask by bare issue number.
- Every Agent-tool subagent runs with `model: "sonnet"`. Only the owner deploys; deploy F4c–F4f LATER (after these lanes).
- Plan gate: supervisor may approve bit-equal plans on an established pattern; wire/behaviour/contract → owner.
  Post every approved plan as a comment on its issue.
- ADR-035 (rules config) owner-approved all-recommended: child RulesState, no preset; 10 dialled keys;
  SLUR_DEV_RULES=1 fail-closed; whole sparse map message. Committed 0beaf14e (local, unpushed docs).
- Typed messages: malformed commands ignored silently (owner). P4 (run-room.ts messages table) lands before S6.
- S11 decisions: shader-patch → track/, canvas-gl → post/, asteroids+meteors → sky/, no 5th group.
  Order post → track → sky → ships.

## Workers (herdr workspace w3C, all Opus 5.5 1M, auto mode)

| Worker | Pane | Lane | Issues | State |
|---|---|---|---|---|
| workerone | w3C:p4 | ECS state S4 → S5 → S7 → S9 | #407 #408 #409 #410 | S4 building (plan on #407) |
| workertwo | w3C:p5 | Rules config S6 | #411 (+ #70) | resumed after clear; landing define-sim-feature.ts + index.ts first |
| workerthree | w3C:p6 | Scene grouping S11 | #412 | post pushed ff3f5162; track group cleared, building |
| workerfour | w3C:p7 | Typed messages S12 | #413 | resumed after clear; P1 building |

## Claims

- workerone (S4): ecs/traits.ts, ecs/status-tags.ts(+test), ecs/net-systems.ts, net/attach-room-to-world.ts,
  game/spectator.ts(+test), net-loop.utils, scene/ship-dead, ship-model/ship-model.tsx (not .state/.utils),
  ship-shadow, explosion-field.utils, exhaust-drive(+test), camera/boost-surplus(+test), boost-streaks.utils,
  power-arc.state, remote-engine-audio, beat-deck deck-flight + deck-ship, features/shield/{traits,mirror,dome}.
- workerthree (S11 track group): 93 track files → game/scene/track/ + their importers (incl. sky files,
  ship-model.state/utils one import line each) + ART_SCALE_REFERENCE, ADD.md, 3 memory files.
  Sky group waits for workertwo's dev/tuning-schema.ts; ships group waits for workerone S4.
- workertwo (S6): DECISIONS.md, new shared rules/*, tug-rules, seeker-rules, tug.feature, seeker.feature,
  schema.ts, run-sim.ts(+test), define-sim-feature.ts, shared index.ts, server package.json, new
  room-rules.test, new client net/host-rules/*, dev/tuning-schema.ts, tuned-sim-config.ts, conventions/features.md.
  Waiting: run-room.ts (after workerfour P4), attach-room-to-world.ts (after workerone S4).
- workerfour (S12): shared run/{standard-schema, command-format, run-commands(+test), run-event, combat,
  input-queue}, combat/constants, sim/bounce-contact, sim/input, chat, moderation, race/director, ship-classes,
  features/*/…-constants, registry.test; client loopback-room.ts, run-room-like.ts.
  QUEUED re-claim: shared index.ts + define-sim-feature.ts when workertwo releases them. Then run-room.ts (P4).

## Done this seam

- Filed #407–#413 (S4, S5, S7, S9, S6, S11, S12). Spawned 4 workers. Posted approved plans on #407 #411 #412 #413.
- Deleted CLAUDE.local.md (gitignored; backup at
  /private/tmp/claude-501/-Users-apple-Projects-personal-slur/6fab0c88-6a63-450b-bcbb-3206255300ae/scratchpad/CLAUDE.local.md.bak).
  Memory refs fixed 248740e5.
- Ported to the global fleet skill (~/.claude/skills/fleet, not a git repo; backup in the same scratchpad
  folder as fleet-skill-backup/): supervisor.md — brief `Tracker` line, plan gate + approved plan recorded on the
  issue, work log section; worker.md — plan first, close your tracker issue. Owner chose all four.

## Uncommitted (not mine)

`.claude/skills/perf-analysis/SKILL.md` is modified by someone unknown — ask before touching. Rest of the dirty tree is
workers' in-flight lanes.

## Next

1. Migration to the fleet skill, owner choice "at each worker's next seam":
   a. `fleet init` (creates .claude/fleet/{board.md,…}); fill the board from this handover (goal, decisions, task table
      with issue links, claims).
   b. Set `FLEET_HANDOVER_DIR=.claude/handovers` for this project (project `.claude/settings.json` env block) so
      `fleet handover <name>` = `.claude/handovers/<name>.md` and existing files keep working.
   c. `fleet register supervisor supervisor slur-supervisor`; register each worker
      (`fleet register worker <name> <name>` from its session, or the hook) at its next seam, then resume it with
      `fleet reset <name> .claude/handovers/<name>.md` instead of raw herdr.
2. Route claims as they arrive: the define-sim-feature/index.ts handoff from workertwo to workerfour; run-room.ts to
   workerfour P4 then workertwo; attach-room-to-world.ts after workerone S4; sky group after workertwo; ships after S4.
3. Verify each landed SHA (`git show --stat`) before telling the owner.

## Gotchas

- CLAUDE.local.md is gone: resume prompts must carry the rules inline (claims, pathspec commits, 3 suites, close issue,
  AT A SEAM) until workers run under `/fleet resume`.
- After herdr `/clear`, the status bar lags; re-read until it shows 0k.
- Colyseus 0.17.47 validate(): a throw or `issues` kicks the client, even with no payload (memory
  colyseus-validate-kicks-on-issues.md, workerfour).

## Lessons → memory

none

## Late update

- workertwo landed define-sim-feature.ts + shared index.ts in 383ef6b5 (local, unpushed; checked with git show --stat). Both handed back to workerfour.
- workertwo shared half landed: 383ef6b5 + e2a5d0ee (RunState.rules field 15, RunSim.setRules; A/B bit-equal 6 seeds, control diverges; local, unpushed). Call: after workerfour P4 is pushed, run-commands.ts + run-room.ts pass to workertwo for the SET_RULES_MESSAGE entry (parseRuleOverrides → RuleOverrides|null, null = drop) and the SLUR_DEV_RULES gate in RunRoom. Meanwhile workertwo does host-rules, tuning-schema, tuned-sim-config.
- Context at 2026-10-20: workerone 161k (seam due), workertwo 138k, workerthree 145k, workerfour 138k.
- Fleet skill: plan gate now says the worker runs its plan past the built-in advisor first; the supervisor checks only scope, conflicts, earlier owner decisions and owner-only choices.
