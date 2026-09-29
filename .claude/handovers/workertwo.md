Agent: workertwo · Lane: seeker lock warning HUD (#372) — DONE, closed · #348 PAUSED · #338/#340/#341 prod verify after deploy · Updated: 2026-09-29

## Goal
Warn the player when a homing seeker is locked on them, now that the rear-view mirror is gone (#371).

## Done
- 85af607 #372 seeker lock warning (pushed to dev; issue closed with the SHA).
  - `game/hud/seeker-warning/*`: red `▲△△ LOCK` row, bars by time to impact, blink, dx slide, commit vignette, ×N, top edge for back-fired seekers.
  - Mounted in `game/net-hud.tsx`, not in overlays (/test-level never mounts Overlays).
  - `/test-level` Leva Pickups → "incoming seeker" (500u behind, locked on me).
  - GDD §5.3 paragraph.
- Earlier: mirror GPU cost measured (cdadd1f).

## State
- 674/674 client tests; typecheck clean; lint 0 errors (9 old file-length warnings).
- Headless /test-level at 1600×900: bars 1→2→3, blink toggles, vignette 0.42 on commit, clears after the hit. Screenshot: the row sits under the slot arc, above the FPS line.
- 844×390 phone (touch emulated): row at x 371–474, y ~319–335. It clears the stick (ends ~x 150).
- The bolt ThreatHud does not show on /test-level (it lives in Overlays) [verified by code read].

## Uncommitted
none.

## Held files
none (released at 85af607).

## Next
1. Report to the supervisor. Wait for the next lane.
2. After the owner's deploy: verify #338/#340/#341 on prod.
3. Later: resume #348.

## Open questions
- Owner: should the bolt ThreatHud also move to NetHud so it shows on /test-level?

## Lessons → memory
test-level-skips-overlays.md (new).
