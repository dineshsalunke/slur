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
| workerone | w2P:pD | closing #248 (owner said close) | 14%, clear before a lane | none |
| workertwo | w2P:pF | none (#298 DONE 01f290b, closed) | idle, 9% | none |
| workerthree | w2P:pG | #292 forks: PLAN first (cleared 0%) | working | none yet |
| workerfour | w2P:pH | #295 blink: PLAN first; + ADR-022 bloom item closed (keep flash) | working | DECISIONS.md once claimed |
| workerfive | w2P:pK | #14 reconnection (+#15): PLAN first; verify on hosted room (no reconnection on /test-level) | working | none yet |

## Open owner questions

- Plans for #292, #295 and #14 are coming. Relay each to the owner and build nothing until approval.
- Owner said "go ahead" to 4 items (2026-09-26): #14 lane, close #248, KEEP the exit-ring flash, start #292 + #295.
  "Keep" is my reading of "go ahead" on a keep-or-dim question; I told the owner so.

## Next

1. Relay plans. Serialize #295 against #14 on run-sim.ts and attach-room-to-world.ts.
2. Later candidates: #291 boomerang, #297 membrane, #293 hazards (needs art cues), #294 parry, #299 Seeker.flyY.

## Uncommitted

None of mine.

## Lessons → memory

none
