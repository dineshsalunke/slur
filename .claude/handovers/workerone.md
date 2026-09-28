Agent: workerone · Lane: #349 architecture RFC (LEAD, just started) · #345 shipped, owner check pending · #337/#339 open until deploy · Updated: 2026-09-28

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#349 "Architecture RFC: code organisation, ECS drift, server-owned game config". RFC ONLY, no source
edits. Supervisor says it is THE priority now. I LEAD and own the doc. workertwo writes the
net/input/state/server-config section. workerthree writes the render/useFrame-schedule/quality-tier
section. They send me their sections; I merge them and keep one voice.

## Done

- #349: read the issue (`gh issue view 349`) and `conventions/ecs.md` (TL;DR rules 1–6 and the systems-loop
  section). Sent slur-supervisor a claim for NEW `docs/RFC-349-ARCHITECTURE.md`. No answer yet.
- `8c94537` #345 option 6 (track metal #7b7f86, `Hull.baseColor` #4a4d52, KeyLight, docs rev. 9 / ADR-029).
  Commented on #345 and left it open for the owner. Owner brief sent to the supervisor.
- `7022faf` memory index line. Earlier: #339 `fda4814` `e8bb786` `8fc2486`, #337 `59a4599` (not deployed).

## State

- Issue #349 asks for: a measured current map (koota entities vs module singletons, useFrame count and
  order, where constants live), problems ranked by cost to dev speed and to look/perf work, ≥5 options
  per mechanism (NN-13), a staged migration that never blocks feature work, and the files each stage touches.
- Issue inputs, all [unmeasured] by me: only ships/bolts/seekers/mines are koota entities; blockWorld,
  pickup-state, the *-events queues and ~14 *.state.ts singletons hold the rest; ~44 useFrame callbacks
  with no schedule; server koota is capped at 16 worlds per process (WORLD_ID_BITS 4). Gameplay constants
  should become server-owned room config in 3 tiers: rules / track gen / look (relates to #70, #23).
- Measured by me in #345: three useFrames run at priority 0.25 (`AFTER_RENDER_SYNC` in engine-light,
  exhaust-field, boost-streaks). Any priority > 0 turns off R3F auto-render
  (`@react-three/fiber` events-*.esm.js:1117). PlainRender (priority 1) or the composer renders.

## Uncommitted

- none.

## Held files

- Claim pending: `docs/RFC-349-ARCHITECTURE.md` (new).

## Next

1. Get the supervisor's answer on the doc path.
2. SendMessage workertwo and workerthree with a section outline and agree on it. Draft outline:
   §1 Current map (measured) · §2 Problems ranked · §3 Entities and state (mine: ECS drift, singletons,
   tags vs values) · §4 Net/input/state + server-owned config tiers (workertwo) · §5 Render, useFrame
   schedule, quality tiers (workerthree) · §6 Code organisation and constants (mine) · §7 Staged migration
   + files per stage (mine, merging theirs) · §8 Open questions. Each mechanism: ≥5 options, weighed.
3. Measure my part: `grep -rn "useFrame(" apps/client/app`, list `*.state.ts`, `world.spawn`/traits in
   `game/ecs`, and module-level `let`/`Map` singletons. Verify WORLD_ID_BITS in node_modules/koota.
4. Write the doc, merge the sections, send the supervisor a summary to relay.
5. #345: close after the owner signs off. After deploy: prod /metrics, then close #337/#339.

## Open questions

- Owner (#345): hulls dark (#4a4d52, current) or bright (#7b7f86)?
- Kick button on the results rows (#342 follow-up)? Still with the owner.

## Lessons → memory

- none this seam.
