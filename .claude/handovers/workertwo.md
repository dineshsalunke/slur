Agent: workertwo · Lane: bolt ThreatHud → NetHud (#373) — DONE · #348 PAUSED · #338/#340/#341 prod verify after deploy · Updated: 2026-09-29

## Goal
Show the bolt ThreatHud on /test-level by mounting it in NetHud instead of Overlays.

## Done
- 65bcef2 #373: `game/overlays/threat-hud/*` → `game/hud/threat-hud/*` (test beside it, as `threat-hud.utils.test.ts`); mounted in `game/net-hud.tsx` after SeekerWarning; removed from `overlays.tsx`.
- 85af607 #372 seeker lock warning (earlier lane).

## State
- 674/674 client tests; typecheck clean; lint 0 errors (9 old warnings).
- NetHud mounts once (`net-canvas.tsx:96`), so there is one tick element, not two. Headless on both viewports: 1 tick element, `◀ ⚠`, opacity 1.
- 1600×900: tick y 64–80; seeker row bottom y 747–774, top (back-fired) y 126–153; slot arc ~y 645–690. No overlap.
- 844×390 touch: tick x 403–441 y 64–80; back-fired seeker row x 371–474 y 55–71 → OVERLAP. It already existed on /game (both were mounted there before). I did not fix it, because a move commit changes no behaviour.
- No way to fire a bolt at the player on /test-level (no second racer; own bolts ignored). Not added; the supervisor is asking the owner.

## Uncommitted
none.

## Held files
none after the report (claim: overlays.tsx, net-hud.tsx, hud/threat-hud/*).

## Next
1. Wait for the owner: (a) "incoming bolt" Leva button? (b) fix the phone overlap?
2. After the owner's deploy: verify #338/#340/#341 on prod.
3. Later: resume #348.

## Open questions
- Owner: add an "incoming bolt" button to /test-level Pickups (sibling of incoming seeker)?
- Owner: phone overlap of the bolt tick and a back-fired seeker row. Option: move the tick below the ahead row on short screens.

## Lessons → memory
stage-enemy-fire-on-test-level.md (new); test-level-skips-overlays.md (updated).
