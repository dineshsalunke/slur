Agent: workertwo · Lane: #360 asteroids drift + vanish — DONE · #348 PAUSED · #338/#340/#341 prod verify after deploy · Updated: 2026-09-29

## Goal
#360: asteroid movement very subtle; asteroids never disappear. Done.

## Done
- cd742d0 #360: band-rock travel in asteroid-surface.ts changed from a sawtooth (wrap + dither fade each 36 s cycle) to a bounded sine sway, no fade; vRockFade varying removed. Rock.speed 16 → 0.6, Rock.spin 3.35 → 0.5 (tuning-schema.ts). Meteor/loose rocks untouched. Pushed, issue closed.
- Earlier: 93df4d2 #358, f0469bd, d4f12ae #357, 16275c6 #350, 7c34699 #347, ff4d722 #346. #341 9b0c726, #338 282428f, #340 cf922f8 stay OPEN until the owner's final deploy.

## State
- Measured, headless /test-level on :5173, frozen at spawn (KeyP), % sky pixels changing per second: before ~8%; after ~2%; Rock.speed 0 + spin 0 floor 0.01%. Before: at t=20 s rocks were mid-dither-fade and one large rock was gone. After: t0 vs t10 look identical by eye, no rock lost.
- Two after-runs hit a full-frame black/reload mid-run; inferred to be HMR from a peer's uncommitted scene-environment.tsx / env-band edits.
- Streaming window (BACK 240, AHEAD 900), instance limits (≤ ~70 used of 112–176), frustumCulled=false: checked in source, not a cause.
- biome clean on both files; client vitest app/game/scene 330/330. Full typecheck not run [unmeasured].
- Driver: scratchpad drift.mjs (session scratch, not kept).

## Uncommitted
none.

## Held files
none. asteroid-surface.ts released; tuning-schema.ts returned to the supervisor after cd742d0.

## Next
1. Idle. Wait for the supervisor's next lane.
2. After the owner's deploy: verify #338/#340/#341 on prod and close each one with its SHA.
3. Later: resume #348 (gamepad side of Blur controls). Blur Xbox 360 notes: RT accelerate · LT brake · stick/d-pad steer · A fire · B handbrake · X/LB toggle power-up · Y drop · RB camera (third-party guide, https://www.scribd.com/document/667374813/blur-manual). Fire-back on console is UNVERIFIED.

## Open questions
- Owner: is 0.6 u/s sway + 0.5 spin subtle enough? Both are live dials (Rock.speed, Rock.spin) on /test-level; 0 stops the motion.

## Lessons → memory
freeze-does-not-stop-asteroid-drift.md updated (drift is now small; zero the dials for a clean diff).
