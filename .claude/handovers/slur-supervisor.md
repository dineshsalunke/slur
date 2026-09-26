Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-26, late night

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "│ [█░]* [0-9]*%"` (a bare
`[0-9]+%` catches the weekly-usage figure). The first reads after /clear often show the old percent; loop
reads until 0%. Clear a worker before assigning if it is past 10%. Use `bash -c '…'` for herdr loops.
Never brief a worker to build or serve an old commit: that is a scratch stack (owner rule).
A `/clear` sent while a worker is mid-turn queues behind that turn; wait for 0% before the resume prompt.

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE (memory owner-tests-on-test-level): the owner tests everything on /test-level. Every brief says so.
- Single-player mode will come later, without a server room. #288's LoopbackRoom is its base (not dev-gated).
- WIDTH 96u. MATERIAL: dark graphite pitted metal. Hosted rooms default to GROOVE.
- Every power fires forward (E) or back (F). Audio sci-fi; reuse existing sfx for new pickups for now.
- Bag (owner-final): bolt 4 · seeker 3 · mine 3 · boost 3 · shield 3 · portal 2 · tug 2.
- Portal loop stays as built (GDD §10 Q8, 7980f45; comment on #289).

## Shipped / filed this session

- #269 blur 16bc5ef — OPEN for owner feel test. #268 rear-view 09cb486 — OPEN for owner look test.
- #288 one run path DONE + CLOSED (workerone).
- #289 portal DONE + CLOSED (workerfour): 6dd1368 · 664cc60 · 7857886 · ff00915 · 3124971 · docs 077796b (ADR-022).
- #290 tug line DONE + CLOSED (workertwo): 403f8de · 72eafc0 · 86060aa · docs 387302c · archive eefe99f.
- Filed: #291 boomerang, #292 forks, #293 triggered hazards, #294 parry, #295 blink (unblocked now), #296 RFC
  polarity lanes, #297 membrane, #298 pickup grab box.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | none | idle, 14% (clear before assigning) | none |
| workertwo | w2P:pF | #298 pickup grab box (GDD line 4830bee done) | working | combat/pickups.ts, combat/constants.ts, sim-config.ts, combat/combat-step.ts, run/run-sim.ts, combat/combat.test.ts, client dev/tuning-schema.ts, dev/tuning-panel/tuning-panel.tsx, net/loopback-room/loopback-room.ts (+ .utils.ts) |
| workerthree | w2P:pG | none | idle, 11% | none |
| workerfour | w2P:pH | none (#289 done) | idle | none |
| workerfive | w2P:pK | none | idle, 11% | none |

## Open owner questions

- Exit-ring bloom (#289, ADR-022 open item): passing the exit ring blooms the frame orange < ~150 ms. Keep as a
  hop flash, or dim the exit end after a hop?
- Next lanes for idle workers (asked; no answer yet).

## Next

1. Answer workertwo on #298 when it commits; it closes #298.
2. Idle workers: candidates #292 forks (generator only, safe now), #295 blink (after #289, now unblocked; BC4
   like portal), #291 boomerang (combat/bag: after #298), #297 membrane (step.ts), #293 hazards (needs art
   cues), #294 parry. Clear past 10% first.

## Uncommitted

None of mine.

## Lessons → memory

none
