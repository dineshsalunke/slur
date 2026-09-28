Agent: workertwo · Lane: #341 stalled race never ends (PLAN, awaiting owner pick) · also #338/#340 open until final deploy · Updated: 2026-09-28

## Goal
A race must always end. Today an AFK or wedged racer with no finisher holds the room forever (no cap since #301).

## Done
- #340 built: cf922f8. #338: 282428f. Both stay open until the owner's final deploy; then verify prod and close.
- #341 plan sent to slur-supervisor (no edits).

## State
- `raceShouldEnd` (director.ts:69) ends only on: no racers · all finished · grace deadline (45 s after first finisher).
- Dropped racers already leave after RECONNECT_SECONDS 20 (run-room.ts:30, onDrop), so a "grace after first drop-out" adds nothing.
- No auto-cruise: coastDrag 40 u/s² (constants.ts:75) stops an idle ship in ≤ 3.1 s from 124 u/s. So "no new best z" catches AFK and wedged alike.
- finishZ measured this session: weave 8,000u; phrase 14,820–15,300u (seeds ×20). groove uses the same segment count as weave [inferred 8,000u].
- Slowest maxCruise = interceptor 84 u/s; fastest = freighter 124 u/s (ship-classes.ts).
- The client shows no grace countdown: no client read of `finishDeadline` outside test-room.ts.

## Plan (recommended: A + B, C as owner option)
- A. Stall retire: a racer with no new best z for STALL_SECONDS 30 counts as done for race end (still DNF, still flies, reversible on progress). HUD warning from 20 s.
- B. Cap: raceCap = 3 × finishZ / 84 → 286 s on 8,000u, ≤ 546 s on phrase.
- C. Host "End race": host-only button, two-step confirm, END_RACE_MESSAGE → finished.

## Uncommitted
none

## Held files
none (claims requested in the plan)

## Next
1. Wait for owner pick via supervisor.
2. Build shared + client first; take run-sim.ts / run-room.ts after workerone's #339 commit.

## Open questions
- A+B only, or A+B+C?
- Stall 30 s / cap factor 3 — accept?

## Lessons → memory
none
