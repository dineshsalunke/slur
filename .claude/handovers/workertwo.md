Agent: workertwo · Lane: #358 Blur keyboard controls (waiting on owner choices) · #348 PAUSED · #338/#340/#341 prod verify after deploy · Updated: 2026-09-29

## Goal
#358: change SLUR's keyboard controls to Blur (2010) PC defaults. Update HUD hints, docs and the CLAUDE.md controls line. Touch controls stay the same.

## Done
- Research. The mapping and 3 owner choices were sent to slur-supervisor on 2026-09-29. No code yet.
- Earlier: d4f12ae #357, 16275c6 #350, 7c34699 #347, ff4d722 #346. #341 9b0c726, #338 282428f, #340 cf922f8 stay OPEN until the owner's final deploy.

## State
- Verified this session: Blur PC Manual p.2 (https://www.scribd.com/document/613527396/Blur-PC-Manual, text read with headless Chrome because WebFetch/curl hit a bot challenge). Accelerate Q · Brake/Reverse A · Fire Power-up Right CTRL · Force Fire Forward Left Shift · Force Fire Back Right Shift · Handbrake Down Arrow · Steer ←/→ · Toggle Power-up Up Arrow · Drop Power-up Left CTRL · Pause P · Camera V · Mini-Map Zoom Delete · Look Back Tab.
- Key files: game/input/keyboard.ts (throttle/brake/strafe/jump), game/input/power-select.ts (1/2/3, NEXT_SLOT_KEY Q, PREVIOUS_SLOT_KEY R, E fire, F back, X drop; it returns early on shift/ctrl modifiers), game/input/gamepad.ts PAD_KEYS (hardcodes 'KeyQ'/'KeyE'/'KeyF'), touch-dpad.constants.ts ARM_KEYS (KeyE/KeyF + slot constants), hud/power-rack/power-rack.tsx hint "E Fire · F Back · Q R Cycle · X Drop", docs/GDD.md §8 table, CLAUDE.md line 197, beat-deck deck-status hint.
- Owner choices sent: (1) no Right Ctrl on MacBook, so fire is Left Shift only or also Right Option; (2) macOS Ctrl+arrows switch Spaces, so drop is Left Ctrl, Left Ctrl + X, or X only; (3) keep W/S/E/F/X/R as silent extras. The two macOS facts are [recalled].

## Uncommitted
none.

## Held files
none. The claim list was sent with the plan and is not cleared yet.

## Next
1. Wait for the owner's answers from the supervisor, then for "clear" on the claim.
2. Build: keyboard.ts, power-select.ts (accept Shift/Ctrl codes, NEXT_SLOT_KEY → ArrowUp, preventDefault game keys), gamepad.ts (use the constant), power-rack hint, GDD §8, CLAUDE.md, beat-deck hint. Update the tests.
3. `pnpm typecheck && pnpm test && pnpm lint`. Brief the owner for /test-level. Commit, push, then `gh issue close 358` with the SHA.
4. After the deploy: verify #338/#340/#341 on prod and close each one.

## Open questions
- Owner choices 1–3 above (relayed through the supervisor).

## Lessons → memory
scribd-needs-headless-chrome.md
