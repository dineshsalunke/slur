Agent: workertwo · Lane: none (idle) · #358 DONE · #348 PAUSED · #338/#340/#341 prod verify after deploy · Updated: 2026-09-29

## Goal
#358: keyboard controls follow the Blur (2010) PC default layout. Done.

## Done
- 93df4d2 #358: Q throttle · A/↓ brake · ←/→ strafe · Right Ctrl or Left Shift fire · Right Shift fire back · ↑ cycle · Left Ctrl or X drop. Space jump and M mute kept. W/S/E/F/X/R stay as silent extras. The HUD hint is per platform (power-rack.utils.ts). GDD §8 and CLAUDE.md are updated. Pushed, issue closed.
- f0469bd: #358 research handover + scribd memory.
- Earlier: d4f12ae #357, 16275c6 #350, 7c34699 #347, ff4d722 #346. #341 9b0c726, #338 282428f, #340 cf922f8 stay OPEN until the owner's final deploy.

## State
- Measured, headless /test-level on the owner's :5173: Q held 1.5 s → vz 43.5; A held 1 s → vz 0; ← held 0.4 s → x +16.1; staged [bolt, seeker, mine] then ↑ + Left Shift → slot 1 fired; Right Shift → slot 2 fired; Left Ctrl → slot 0 dropped. HUD reads "L Shift Fire · R Shift Back · ↑ Cycle · X Drop" on the Mac UA and "R Ctrl Fire · R Shift Back · ↑ Cycle · L Ctrl Drop" on a Windows UA.
- pnpm typecheck clean; client vitest 658/658; lint: no new warnings on the touched files.
- Known risk [unverified]: on Windows, Ctrl+W (close tab) cannot be blocked by a page. W is a silent throttle extra, so W then Left Ctrl in the wrong order could close the tab. Blur players use Q.

## Uncommitted
none.

## Held files
none. The #358 claim is released.

## Next
1. Idle. Wait for the supervisor's next lane.
2. After the owner's deploy: verify #338/#340/#341 on prod and close each one with its SHA.
3. Later: resume #348 (gamepad side of Blur controls). Blur Xbox 360 notes: RT accelerate · LT brake · stick/d-pad steer · A fire · B handbrake · X/LB toggle power-up · Y drop · RB camera (third-party guide, https://www.scribd.com/document/667374813/blur-manual). Fire-back on console is UNVERIFIED.

## Open questions
none.

## Lessons → memory
scribd-needs-headless-chrome.md (written at the research seam, f0469bd).
