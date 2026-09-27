Agent: workertwo · Lane: editor flight recorder #321 (PLAN SENT) · Updated: 2026-09-27

## Goal
T starts/stops a recording of ship x/z/speed + events on /test-level; Edit traces the last 3 takes on the 2D map. Editor New Track: gen (default phrase) + seed field + roll.

## Done
- 59feea6 #319 boost glides over gaps (earlier lane, closed).
- #321 plan sent to slur-supervisor (files, tick-hook weighing, drawing, 5 owner questions, /test-level brief). No edits.

## State
- Editor map is Canvas2D (attachMap → drawMap), not SVG; trace reuses screenX/screenY for the #317 mirror.
- Ship state: room.sim.state.players.get(sessionId); bumps: BOUNCE_MESSAGE via room.onMessage.
- RunSim.advance has no per-tick hook; plan picks an optional RunSimHooks.onTick (Q1).
- Seed is hard-wired TEST_LEVEL_SEED; DEFAULT_TRACK_GEN = 'groove'.

## Uncommitted
none

## Held files
none yet (claims listed in the plan; take them on approval)

## Next
1. Wait for the owner's answers to Q1–Q5 via slur-supervisor.
2. On approval: shared hook → loopback onTick → recorder store + tests → T key + REC badge → trace draw + takes panel → new-track panel + ?seed plumbing → typecheck/lint/test → /test-level check → commit → close #321 with SHA.

## Open questions
- Q1 shared onTick hook OK? Q2 keep takes across tracks? Q3 Edit auto-stops take? Q4 bare /test-level default to phrase? Q5 speed = vz scaled to maxCruise?

## Lessons → memory
none
