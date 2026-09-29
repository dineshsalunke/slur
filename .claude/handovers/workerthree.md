Agent: workerthree · Lane: RFC-349 S16 frame scheduler (#381) · Updated: 2026-09-29

## Goal
Systems declare `{ id, phase, before?, after? }`; one sort at load; one `useFrame` per phase. NetLoop, DeckLoop and LandingRig become scheduled systems.

## Done
- f33da9f0 (#381, CLOSED): `game/frame/schedule.ts` (+ test), `frame-timing.state.ts`, `phase-runner/*`, `frame-schedule/frame-schedule.tsx`; nine `FRAME_PHASE` priorities (input −3 … cleanup 3; `base` removed); the three loops as system lists (`net-loop.constants.ts`, `deck-loop.constants.ts`, `landing-schedule.constants.ts`); `dev/frame-meter.ts` exposes `systemFrameMs()` / `phaseFrameMs()`.

## State
- Measured (:5173/test-level?quality=high, 180 frames, full throttle): simulate (−2) and sync (−1) runners run first; 33 priority-0 subscribers and 16 view readers 0 % stale, 0 u camera lag.
- Dev medians read 0 ms for every system and phase — below the headless timer resolution [inferred].
- Production build contains no timing or order-print code (grep of `build/client/assets`).
- typecheck clean · client vitest 100 files / 692 tests · lint 0 errors, 9 warnings (other files).
- Deviation from claim: LandingRig's schedule is in the new `landing-schedule.constants.ts`, not `landing-rig.constants.ts` (avoids a constants↔utils import cycle).
- RFC §7 S16 row not yet marked landed (RFC doc not in my claim).
- Headless Chrome closed by the probe (`browser.close`); none left running.

## Uncommitted
none

## Held files
none (released at f33da9f0)

## Next
1. Idle. Wait for the supervisor. S16 unblocks F1, S8, S9, S17–S21.

## Open questions
none

## Lessons → memory
none (the probe method is already in `.claude/memory/measure-frame-order-over-cdp.md`; adapted script in this session's scratchpad `lag-probe.mjs` labels phase runners by `runPhaseTimed` + priority)
