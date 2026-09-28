Agent: workertwo · Lane: #349 architecture RFC — my section: net / input / client state singletons / server-owned room config · #348 PAUSED · #338/#340/#341 prod verify after deploy · Updated: 2026-09-28

## Goal
#349: write the RFC section on net, input, client state singletons (*.state.ts, *-events queues, pickup-state, blockWorld) and server-owned room config (#70, #23). workerone leads and owns the doc. RFC only, no source edits.

## Done
- 16275c6 #350: open wall-block ends get a front-face seam. Shipped and closed. Owner verifies on /test-level.
- 7c34699 #347 and ff4d722 #346: shipped and closed.
- #341 9b0c726, #338 282428f, #340 cf922f8: landed. They stay OPEN until the owner's final deploy.

## State
- Measured: 20 files named *.state.ts / *-state.ts under apps/client/app (19 in the game plus test-level). block-state.ts exports `blockWorld = createSimWorld()`.
- Measured: 3 event queues: game/scene/hit-events.ts, mine-shock-events.ts, tug-events.ts.
- Measured: koota 0.6.6 has `WORLD_ID_BITS = 4` → `maxWorlds: 2 ** WORLD_ID_BITS` = 16 (node_modules/.pnpm/koota@0.6.6…/dist/chunk-ZWIGMIL4.js:34,74).
- Measured: input sources are keyboardInput, touchInput and gamepadInput, merged in game/input/current-input.ts. Power keys go through power-select.ts handlePowerKey.

- #350 measured: phrase gen seeds 1–10, open ends with a seam ≤1u from the corner 9/4337 before, 4337/4337 after.
- Measured: headless /test-level on the live stack renders at spawn, but the main view goes black after any CDP write to ship z, with or without #350. The rear mirror still renders. Cause not debugged; suspect peers live HMR reflection edits [inferred]. Told supervisor.

## #348 notes (paused) — Blur controls
- Today, keyboard (keyboard.ts, power-select.ts): W/↑ throttle · S/↓ brake · A/D or ←/→ strafe · Space jump · E fire forward · F fire back · Q next power · R previous power · 1/2/3 select slot · X drop · M mute.
- Today, gamepad (gamepad.ts PAD_KEYS): RT throttle · LT brake · left stick or d-pad ←/→ strafe · A jump · B(1) F back · X(2) E · RB(5) E · Y(3) Q · LB(4) Q · Back(8) M · Start(9) Enter.
- Dev keys that can clash: V rear-view toggle (dev/rear-view-toggle.ts, DEV only) · Backquote panel · P freeze · T flight recorder · Backspace reset · Shift+1–5 ship class (test-level). Spectator: Tab / ←/→.
- Blur research is done. Source: the official Blur PC Manual, p.2 "Controls", https://www.scribd.com/document/613527396/Blur-PC-Manual (page scan viewed this session). The console tables come from a third-party guide, pp.19–20, https://www.scribd.com/document/667374813/blur-manual. Its PC table is word-for-word the same as the manual.
  - PC (verified): Q accelerate · A brake/reverse · ←/→ steer · ↓ handbrake · Right Ctrl fire · Left Shift force fire forward · Right Shift force fire back · ↑ toggle (cycle) power-up · Left Ctrl drop · Tab look back · V camera · P pause · Delete minimap zoom.
  - Xbox 360 (guide): RT accelerate · LT brake · left stick or d-pad steer · A fire · B handbrake · X toggle power-up · LB toggle power-up · Y drop · RB camera · Back standings · Start pause · right stick camera. There is NO separate fire-back button listed for consoles. The console fire-back mechanism is UNVERIFIED.
  - Blur cycles power-ups one way only (a single "Toggle"). SLUR has Q next plus R previous.
  - Clashes if copied literally: Blur Q = accelerate but SLUR Q = next power · Blur V = camera but dev V = mirror · Blur P = pause but dev P = freeze · Blur Tab = look back but spectator Tab = cycle target. Blur has no jump. Candidates for jump: Space on keyboard, since Blur puts Space on menus only; B on the pad, since Blur's handbrake has no SLUR equivalent. [inferred proposal, not agreed]

## Uncommitted
none.

## Held files
none. The RFC doc belongs to workerone.

## #349 status
- The outline is agreed with workerone. My part is §4 of docs/RFC-349-ARCHITECTURE.md; workerone alone writes that file.
- The §4 draft is sent to workerone and the supervisor: scratchpad `rfc-349-s4.md` (session 37700c16 scratchpad). It is measured at 4b58658.
- If the scratchpad is gone, the key facts are these: prediction.ts:52 uses DEFAULT_SIM_CONFIG, but test-level-room.ts:40 uses tunedSimConfig. run-room.ts:77–83 passes no config. block-state.ts:3 holds a page-global blockWorld. Queues drop the oldest (hit-events.ts:12) or the newest (block-burst.utils.ts:9). synth-key.ts:2 sends fake keydowns. attach-room-to-world.ts:293 sends on a 30 Hz setInterval. resetSlot() has no caller. koota has 16 live worlds (chunk-ZWIGMIL4.js:34,74,81). MAX_ROOMS is 12.

- DONE: workerone merged the net half into docs/RFC-349-ARCHITECTURE.md at 1a1c39c. Nothing more is needed from me. I told workerone that the schema guard is `index > 64`, but index 64 collides with OPERATION.DELETE = 64. The cap is indexes 0–63.
- §4 is merged by workerone into docs/RFC-349-ARCHITECTURE.md. The second ask (the net half of the feature-module contract, plus action-map options) is sent: scratchpad `rfc-349-s4-modules.md`. Leanings: a6+a3 messages, b5 `schema()` composition, c4 `defineRules` spec, C2 action map.

## Next
1. #349: done unless workerone asks again.
2. —
3. After the owner's deploy: verify #338/#340/#341 on prod and close each one with its SHA.
4. Later: resume #348 from the notes above.

## Open questions
none.

## Lessons → memory
.claude/memory/schema-fields-cap-at-64.md
