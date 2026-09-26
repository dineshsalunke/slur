Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-26, late night (seam at ~153k)

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
- OWNER RULE (new, memory owner-tests-on-test-level): the owner tests everything on /test-level. Every brief
  says "verify on /test-level".
- Single-player mode will come later and must run without a server room. #288's loopback room is its base
  (not dev-gated; dev extras in a separate layer).
- WIDTH 96u. MATERIAL: dark graphite pitted metal. Hosted rooms default to GROOVE.
- Every power fires forward (E) or back (F). Audio sci-fi. CC-BY/CC-BY-SA ok. Ship trails parked.
- Bag today 6/4/4/3/3 (bolt/seeker/mine/boost/shield).

## Closed / shipped this session

- #269 blur made readable 16bc5ef (workerfive). #269 OPEN for owner feel test on /test-level.
- #268 rear-view: reopened, fixed 09cb486 (workerthree): opaque, feathered, no bezel/lip. OPEN for owner look.
- #288 one run path DONE + CLOSED (workerone): dab29d4 268dcb2 d39de1c a79bfc3 5336f7e, pushed to 851ed25.
  RunSim is shared; /test-level runs it through LoopbackRoom.
- Filed: #289 portal, #290 tug line (= Tractor beam; grapple folded in as no-rival → latch nearest block),
  #291 boomerang, #292 forks (wall OR gap divider), #293 triggered hazards, #294 parry (shield timing),
  #295 blink (blocked by #289), #296 RFC polarity lanes (new `rfc` label).

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | none (#288 done) | idle, ~14% | none |
| workertwo | w2P:pF | #290 tug line, PLAN sent, waiting on owner | idle | none |
| workerthree | w2P:pG | none | idle, ~11% | none |
| workerfour | w2P:pH | #289 portal, PLAN sent, waiting on owner | idle | none |
| workerfive | w2P:pK | none | idle, ~11% | none |

## Open owner questions (relayed, unanswered)

#290 tug (workertwo plan): Q1 back-fire effect on the chaser: (a) same slow, (b) sideways yank toward your
lane [my pick], (c) literal pull forward. Q2 audio: reuse existing sfx [my pick]. Q3 start values: range 150u,
kick +40 u/s, cap +50% 0.6 s, target ×0.7 then cap 60% 1 s. ALSO tell workertwo: its plan predates the grapple
fold; "no target → no fire" must become "no rival → latch nearest block ahead and reel in".

#289 portal (workerfour plan): 1 lone first end expires at 9 s? 2 arm delay 0.3 s + near lead 0.4 s? 3 one live
pair per owner? 4 mix 2/20 portals taken from bolt 6→5, seeker 4→3? 5 seeker misses when target hops? 6 can jump
over an end? 7 fizzle keeps the charge? 8 placeholder marigold rings, Codex review later?

Other: one-way membrane (sideways) — file/park/drop? #293 trigger input (interact key vs shoot) + trigger delay.
Older: #269 brake-cancel + streak length; #270 dome opacity; #280 derezz zap as fizzle; landing backdrop weave→groove.

## File serialization (#289 vs #290) — decide before clearing either build

Both plans list as "mine only" files the other also writes: packages/shared/src/schema.ts (PlayerState appends:
tug tugTimer+slowTimer, portal portalHops), sim/types.ts (SimShip keys), sim/step.ts, sim-config.ts, shared
index.ts. Plus the declared shared set: combat/constants.ts, combat/power-bag.ts, run/combat.ts, run/run-sim.ts,
HUD power-cell/power-gem, sfx-map + bind-room-audio, pickup-field, net-canvas/world-scene, attach-room-to-world.
Plan: run tug S1 (sim) to commit first, then portal S1 on top; S2 fire-dispatch/bag slices one at a time. Field
append order in schema = commit order. Bag totals must be agreed across both (20 per run).

## Next

1. Get the owner's answers above; send each worker its answers and the serialization order; clear claims per slice.
2. Idle workerone/three/five: candidates #291 boomerang, #292 forks, #294 parry (#294 touches shield + combat —
   serialize with #289/#290). Clear a worker past 10% before assigning.

## Uncommitted

None of mine.

## Lessons → memory

owner-tests-on-test-level.md (2208026).
