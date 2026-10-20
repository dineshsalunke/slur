Agent: slur-supervisor · Lane: supervision · Updated: 2026-10-20

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear, resume and spawn steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read a worker's context with `grep -oE "[0-9]+k/1.0M"` on
`herdr pane read <pane>`. Older history: `git log -p -- .claude/handovers/slur-supervisor.md`.

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks. A worker may start it.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Owner tests on /test-level.
- OWNER RULE: never ask about an issue by number alone. Subagents run with `model: "sonnet"`.
- ONLY THE OWNER DEPLOYS. Prod at b156a41, without F4c–F4f. Owner 2026-10-20: deploy later, after the next lanes.
- Plan gate: supervisor may approve bit-equal plans on an established pattern; wire, behaviour and
  feature-contract changes go to the owner. Post every approved plan as a comment on its issue.

## Current work (owner 2026-10-20: "continue with the architecture and code organisation", all four lanes)

| Worker | Pane | Lane | Issues | State |
|---|---|---|---|---|
| workerone | w3C:p4 | ECS state S4 → S5 → S7 → S9 | #407 #408 #409 #410 | S4 plan approved (on #407), building; may start the stack |
| workertwo | w3C:p5 | Room rules config S6 | #411 (+ #70) | owner approved ADR-035 all-recommended (on #411); claim list pending |
| workerthree | w3C:p6 | Scene grouping S11, order post → track → sky → ships | #412 | plan approved (on #412), building post |
| workerfour | w3C:p7 | Typed messages S12, P1–P3 then P4 (run-room.ts) before S6 | #413 | approved (on #413); owner: bad commands ignored silently |

File clashes to police: `net/attach-room-to-world.ts` (workerone vs workerfour), `apps/server/src/rooms/run-room.ts`
and `packages/shared/src/schema.ts` (workertwo vs workerfour), S11 importer rewrites (workerthree vs everyone).
S13 (action edges in PlayerInput) not filed: needs a netcode ADR and S12.

## Claims

- workerone (S4): ecs/traits.ts, ecs/status-tags.ts (new), ecs/net-systems.ts, net/attach-room-to-world.ts,
  game/spectator.ts, net-loop/net-loop.utils.ts, scene/ship-dead.ts, ship-model, ship-shadow,
  explosion-field.utils, exhaust-drive(+test), camera/boost-surplus(+test), boost-streaks.utils,
  power-arc.state, remote-engine-audio, beat-deck deck-flight + deck-ship, features/shield/{shield.traits,
  shield-mirror, shield-dome}, status-tags.test, spectator.test.
- workerthree (S11 post group): scene-effects/, boost-blur/, tone-mapping, canvas-gl → scene/post/; importers
  tuning-panel.utils, net-canvas.tsx, world-scene.tsx, beat-deck-canvas, landing-scene, prepare-landing.
  Ships group waits for workerone; sky waits for workertwo's tuning-schema.ts.
- workerfour (S12 P1–P3): shared run/{standard-schema, command-format, run-commands(+test), run-event,
  combat, input-queue}.ts, combat/constants, sim/bounce-contact, sim/input, chat, moderation, race/director,
  ship-classes, features/*/…-constants, define-sim-feature, registry.test, shared index.ts; client
  loopback-room.ts, run-room-like.ts. Next: server run-room.ts (P4), claim then.
- workertwo: run/run-sim.ts released to it; rest of claim pending.

## Open owner items

1. Deploy F4c–F4f later. Boost and shield moved wire fields, so open tabs must reload.
2. `msgpackr-extract` native compile fails in the Docker build stage (no Python). Not blocking. Not filed.
3. No conventions rule card for `@colyseus/schema` (`/conventions-build`).
4. First-use black hole shader compile hitch, ~20–29 ms at mount. Not filed.

## Uncommitted

None.

## Next

1. Review plans as they arrive; relay workertwo's ADR to the owner.
2. Answer claims; keep the table above current.

## Lessons → memory

none
