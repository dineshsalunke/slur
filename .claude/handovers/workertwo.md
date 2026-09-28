Agent: workertwo · Lane: #357 DONE · next #356 (waiting for the supervisor's clear on scene-environment.tsx) · #348 PAUSED · #338/#340/#341 prod verify after deploy · Updated: 2026-09-28

## Goal
#357: make the low-tier sky follow the #353 tone-mapping dials. Owner picked option A: tone-map it like every other material, and accept a darker low sky at default.

## Done
- d4f12ae #357: the sky is a full-screen quad (ShaderLib.background shaders, toneMapped default, renderOrder -1), not scene.background. Pushed. Issue closed with the SHA.
- 16275c6 #350, 7c34699 #347, ff4d722 #346: shipped and closed.
- #341 9b0c726, #338 282428f, #340 cf922f8: landed. They stay OPEN until the owner's final deploy.
- #349 §4: merged by workerone at 1a1c39c. Nothing more is needed from me.

## State
- Measured: Neutral at exposure 1 shifts the nebula JPG by 12.5 sRGB levels on average (mean pixel 28/255). Most of the image lies in Neutral's dark-offset region.
- Measured, /test-level headless 1280x720, sky region x100–380 y250–340: low None 26.3 · Neutral 16.8 · Neutral at exposure 2.5 31.3.
- Measured, same page with the old scene.background swapped back in over __THREE_DEVTOOLS__: low full frame 74.1 old → 68.3 new (noise 0.07); high difference 1.74 vs noise 1.88, so high is unchanged.
- Cost: same single quad three drew before [unmeasured, inferred from WebGLBackground.js].
- Tone-mode numbers: 0 None · 1 Linear · 2 Reinhard · 3 Cineon · 4 ACES · 5 Custom (not a real dial choice) · 6 AgX · 7 Neutral.

## #348 notes (paused) — Blur controls
- Today, keyboard (keyboard.ts, power-select.ts): W/↑ throttle · S/↓ brake · A/D or ←/→ strafe · Space jump · E fire forward · F fire back · Q next power · R previous power · 1/2/3 select slot · X drop · M mute.
- Today, gamepad (gamepad.ts PAD_KEYS): RT throttle · LT brake · left stick or d-pad ←/→ strafe · A jump · B(1) F back · X(2) E · RB(5) E · Y(3) Q · LB(4) Q · Back(8) M · Start(9) Enter.
- Dev keys that can clash: V rear-view toggle · Backquote panel · P freeze · T flight recorder · Backspace reset · Shift+1–5 ship class (test-level). Spectator: Tab / ←/→.
- Blur PC (verified, Blur PC Manual p.2, https://www.scribd.com/document/613527396/Blur-PC-Manual): Q accelerate · A brake/reverse · ←/→ steer · ↓ handbrake · Right Ctrl fire · Left Shift force fire forward · Right Shift force fire back · ↑ cycle power-up · Left Ctrl drop · Tab look back · V camera · P pause.
- Blur Xbox 360 (third-party guide pp.19–20, https://www.scribd.com/document/667374813/blur-manual): RT accelerate · LT brake · stick/d-pad steer · A fire · B handbrake · X/LB toggle power-up · Y drop · RB camera. Console fire-back is UNVERIFIED.
- Clashes if copied literally: Q, V, P, Tab. Jump candidates: Space (keyboard), B (pad) [inferred proposal, not agreed].

## Uncommitted
none.

## Held files
none. The scene-backdrop/* claim is released.

## Next
1. #356: marigold env band back into the PMREM env. It needs scene-environment.tsx, which workerthree holds. Wait for the supervisor's clear, then claim.
2. After the owner's deploy: verify #338/#340/#341 on prod and close each one with its SHA.
3. Later: resume #348 from the notes above.

## Open questions
none.

## Lessons → memory
none. The A/B method (swap the old path back in over the devtools hook, compare against a same-page noise floor) is already covered by three-devtools-hook-gives-the-scene.md.
