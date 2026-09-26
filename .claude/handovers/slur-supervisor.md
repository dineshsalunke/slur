Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-26, late night (seam at ~165k)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "│ [█░]* [0-9]*%"` (a bare
`[0-9]+%` catches the weekly-usage figure). The first reads after /clear often show the old percent; loop
reads until 0%. Clear a worker before assigning if it is past 10%. Use `bash -c '…'` for herdr loops.
Never brief a worker to build or serve an old commit: that is a scratch stack (owner rule).

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE (memory owner-tests-on-test-level): the owner tests everything on /test-level. Every brief says so.
- Single-player mode will come later, without a server room. #288's LoopbackRoom is its base (not dev-gated).
- WIDTH 96u. MATERIAL: dark graphite pitted metal. Hosted rooms default to GROOVE.
- Every power fires forward (E) or back (F). Audio sci-fi; reuse existing sfx for new pickups for now.
- Bag today 6/4/4/3/3 (bolt/seeker/mine/boost/shield). Portal approved at 2/20 (bolt 6→5, seeker 4→3). Tug share TBD.

## Shipped / filed this session

- #269 blur 16bc5ef — OPEN for owner feel test. #268 rear-view 09cb486 — OPEN for owner look test.
- #288 one run path DONE + CLOSED (workerone), pushed to 851ed25. RunSim shared; /test-level on LoopbackRoom.
- Filed: #289 portal, #290 tug line (= Tractor beam; grapple folded in), #291 boomerang, #292 forks (wall OR gap),
  #293 triggered hazards (dedicated key in range; instant trigger, per-hazard lead time e.g. gate 0.75 s),
  #294 parry (shield timing), #295 blink (after #289), #296 RFC polarity lanes (`rfc` label), #297 membrane.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | none | idle, ~14% | none |
| workertwo | w2P:pF | #290 tug line, APPROVED, building S1 first; will ping workerfour directly on commit | working | S1 CLEARED: shared schema.ts, sim/types.ts, sim/step.ts, sim-config.ts, index.ts, sim/tug-status(.test).ts, combat/tug(.test).ts, combat/tug-constants.ts |
| workerthree | w2P:pG | none | idle, ~11% | none |
| workerfour | w2P:pH | #289 portal, APPROVED; new files only until tug S1 commits — PING IT when tug S1 lands | working | shared combat/portal.ts, combat/portal.test.ts, sim/portal-hop.test.ts |
| workerfive | w2P:pK | none | idle, ~11% | none |

## Owner answers already sent

#290: back fire pulls the chaser FORWARD toward you and disables/degrades their strafe + jump (dial); reuse sfx;
start values OK; back with no rival = no fire; block reel z-only, releases 0.35 s before impact.
#289: all 8 of workerfour's proposals approved (on the issue).

## Serialization (#289 vs #290)

Core sim files: packages/shared/src/schema.ts, sim/types.ts, sim/step.ts, sim-config.ts, shared index.ts.
ORDER: workertwo tug S1 first; workerfour may build new files (combat/portal.ts + tests) meanwhile, then appends
after tug S1 commits. PlayerState append order = commit order (tug: tugTimer, slowTimer, tugAnchorZ; portal:
portalHops). Shared S2 files one at a time: combat/constants.ts, combat/power-bag.ts, run/combat.ts, run/run-sim.ts,
HUD power-cell/power-gem, sfx-map + bind-room-audio, pickup-field, net-canvas/world-scene, attach-room-to-world.
Bag: workertwo proposes the tug share in its S2 claim → relay to owner.

## Open owner questions

#290 tug S1 DONE 403f8de (pushed; also touched race/director.test.ts, now free). workerfour told. workertwo's S2 claim
(combat/constants.ts, power-bag.ts, sim-config.ts + tug-constants.ts, run/combat.ts, tests) is QUEUED behind portal's
S2 on the same files — clear it only after portal S2 commits. BAG DECISION for owner: tug 2/20 from bolt 5→4, mine
4→3 → bolt 4 · seeker 3 · mine 3 · boost 3 · shield 3 · portal 2 · tug 2 (bolt stays most common; seamSafe needs it).
workertwo CLEARED at seam (0%), NOT resumed (nothing to do). When portal S2 commits: herdr agent prompt w2P:pF
"You are workertwo. Resume from .claude/handovers/workertwo.md. Read CLAUDE.local.md first. Your #290 S2 claim is CLEAR."
(only after the owner answers the bag share, or tell it to use 4/3/3/3/3/2/2 if approved).
Portal S1 DONE 6dd1368 (pushed; hop inside simulate()). workerfour cleared + resumed on S2 (PRE-CLEARED: schema
Portal+RunState.portals, combat/constants.ts, run/combat.ts, power-bag.ts, run-sim.ts, run/portal-run.ts; bag
bolt5 seeker3 mine4 boost3 shield3 portal2). It messages workertwo + me on commit. workertwo is cleared and idle:
its message may sit unread — resume it via herdr (line above).
Portal S2: extra claim CLEARED (seeker-pickups.tsx/.utils.ts/.test.ts, pickup-field.tsx). My decision: S2 ships
portalRatio 0, turned on (2/20) in S3 once the client draws portals — no invisible hops on /test-level.
workerfour portal S1 CLEARED (schema portalHops, types, step, sim-config, index, director.test, portal-hop.test,
portal.ts). Then portal S2 first on shared fire/bag files; workerfour tells workertwo directly when S2 commits.
#289 portal loop (on the issue): a chaser in your far end is thrown back, meets the far end again and loops until
they strafe around or the pair expires. Soften with a per-ship hop cooldown? Owner to decide.
workerfour committed pure portal module 21bb3fb; holds only sim/portal-hop.test.ts; blocked on tug S1.
Older: #269 brake-cancel + streak length; #270 dome opacity; #280 derezz zap as fizzle; landing backdrop weave→groove.

## Next

1. Answer claims from workertwo/workerfour per the order above.
2. Idle workerone/three/five: candidates #291 boomerang (touches combat/bag: serialize), #292 forks (generator only,
   safe now), #297 membrane (step.ts: after tug+portal S1), #293 hazards (needs art cues). Clear past 10% first.

## Uncommitted

None of mine.

## Lessons → memory

owner-tests-on-test-level.md (2208026).
