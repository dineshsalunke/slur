Agent: workertwo · Lane: #346 phone pad + #347 fullscreen — DONE, both closed · #338/#340/#341 prod verify after deploy · Updated: 2026-09-28

## Goal
#347: fullscreen on the play gesture; iPhone Add to Home Screen hint. #346: floating stick + d-pad on phones. Both shipped. What is left: owner device checks, and the prod verify of #338/#340/#341.

## Done
- 7c34699 #347: ui/fullscreen.ts fullscreenForPlay (home Form onSubmit + lobby Go onClick). slur.fullscreen follows the last state the player reached (Esc → off). The toggle moved to ui/fullscreen-toggle/ and also sits on the home header. ui/home-screen-hint/ (iPhone, one-time). fullscreenchange releases keys + touches. root min-h-dvh. TDD §3 note. Closed.
- ff4d722 #346: game/hud/touch-pad/ (touch-stick + touch-dpad), game/input/touch-latch.ts (hysteresis), touch-state.ts API holdStick/moveStick/pressJump/releasePointer, KeyR previous slot (power-select NEXT_SLOT_KEY/PREVIOUS_SLOT_KEY), dev mirror toggle R → V, power-rack hint "Q R Cycle", GDD touch + R + line 84 (4–20u, #311). Old touch-button/ deleted. Closed.
- #341 landed earlier (9b0c726); #338 282428f, #340 cf922f8 — all three stay OPEN until the owner's final deploy.

## State
- ff4d722: client 640/640, typecheck 0, lint 0 errors (9 warnings, all pre-existing).
- Headless Chrome on :5173 (Playwright; Chrome closed after): Create → fullscreen, which survives the navigation to /game; Esc → pref off, and Go stays windowed; the toggle turns it back on.
- Touch emulation at 844×390: thrust vz 42.5 after 1.5 s; stick right x −16; stick down vz 56 → 17; stick + jump with two fingers → jumpsUsed 1; arms send Q/R/E/F; one slide right→up→left sends Q, E, R.
- Reading selectedSlot() through a CDP import did not change after arm taps. That is most likely the HMR-orphan module ([[cdp-import-of-tuning-hits-an-hmr-orphan]]); the keydown counter proved the keys fire. [inferred]
- [unmeasured] Real fullscreen resize on Windows Chrome; iPhone Home Screen launch in landscape + notch; stick feel on a real phone; the iOS 26.1 -webkit-touch-callout report.

## Uncommitted
none.

## Held files
none — release everything from #346/#347.

## Next
1. Owner checks (via the supervisor): iPhone 12 full race with the pad + Home Screen launch; Windows Chrome fullscreen; /test-level R = previous power-up, V = mirror.
2. Tune if the owner asks: STICK_RADIUS 56 (touch-stick.constants.ts), STRAFE_ON/OFF 0.45/0.25 and BRAKE_ON/OFF 0.5/0.35 (touch-latch.ts), DPAD_CENTRE 0.42 / DPAD_SLOP 1.2 (touch-dpad.constants.ts).
3. After the owner's final deploy: verify #338/#340/#341 on prod, then gh issue close each with its SHA.

## Open questions
none.

## Lessons → memory
none new.
