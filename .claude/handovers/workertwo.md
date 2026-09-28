Agent: workertwo · Lane: #349 architecture RFC — my section: net / input / client state singletons / server-owned room config · #348 PAUSED · #338/#340/#341 prod verify after deploy · Updated: 2026-09-28

## Goal
#349: write the RFC section on net, input, client state singletons (*.state.ts, *-events queues, pickup-state, blockWorld) and server-owned room config (#70, #23). workerone leads and owns the doc. RFC only, no source edits.

## Done
- 7c34699 #347 and ff4d722 #346: shipped and closed.
- #341 9b0c726, #338 282428f, #340 cf922f8: landed. They stay OPEN until the owner's final deploy.

## State
- Measured: 20 files named *.state.ts / *-state.ts under apps/client/app (19 in the game plus test-level). block-state.ts exports `blockWorld = createSimWorld()`.
- Measured: 3 event queues: game/scene/hit-events.ts, mine-shock-events.ts, tug-events.ts.
- Measured: koota 0.6.6 has `WORLD_ID_BITS = 4` → `maxWorlds: 2 ** WORLD_ID_BITS` = 16 (node_modules/.pnpm/koota@0.6.6…/dist/chunk-ZWIGMIL4.js:34,74).
- Measured: input sources are keyboardInput, touchInput and gamepadInput, merged in game/input/current-input.ts. Power keys go through power-select.ts handlePowerKey.

## #348 notes (paused) — Blur controls
- Today, keyboard (keyboard.ts, power-select.ts): W/↑ throttle · S/↓ brake · A/D or ←/→ strafe · Space jump · E fire forward · F fire back · Q next power · R previous power · 1/2/3 select slot · X drop · M mute.
- Today, gamepad (gamepad.ts PAD_KEYS): RT throttle · LT brake · left stick or d-pad ←/→ strafe · A jump · B(1) F back · X(2) E · RB(5) E · Y(3) Q · LB(4) Q · Back(8) M · Start(9) Enter.
- Dev keys that can clash: V rear-view toggle (dev/rear-view-toggle.ts, DEV only) · Backquote panel · P freeze · T flight recorder · Backspace reset · Shift+1–5 ship class (test-level). Spectator: Tab / ←/→.
- Blur research: a researcher subagent was launched this seam. Its result had not arrived at pause time. Re-run it if it is lost. It must cite the manual.

## Uncommitted
none.

## Held files
none. The RFC doc belongs to workerone.

## Next
1. Agree the outline of my section with workerone.
2. Measure the current map for my section, then write options (≥5 per mechanism) and a staged migration.
3. After the owner's deploy: verify #338/#340/#341 on prod and close each one with its SHA.
4. Later: resume #348 from the notes above.

## Open questions
none.

## Lessons → memory
none new.
