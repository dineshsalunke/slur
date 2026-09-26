Agent: workerfour · Lane: #289 portal pickup (BC4) — DONE, issue closed · Updated: 2026-09-26, late night

## Goal

Build a portal pickup: two placed ends, tap = near, double tap = far, any racer can use it, 9 s lifetime.
The teleport runs in the shared `simulate()`, so prediction replays it (BC4).

## Done

- 21bb3fb — `combat/portal.ts` (pure): placement, clear-spot search, `hopThroughPortal`. 18 tests.
- 6dd1368 — slice 1: `SimWorld.portals`, `portalHops`, the hop inside `simulate()`, replay test.
- 664cc60 — slice 2: schema `Portal` + `RunState.portals`, `HeldPower.portal/portalB`, messages, `run/portal-run.ts`.
- 7857886 — slice 3: prediction mirror, hop snaps render/interp/camera, pickup body, `PORTAL_RATIO` 0.1.
- ff00915 — slice 4 part A: `scene/portal-field/` rings.
- 3124971 — slice 4 part B: field mounted, hop/fizzle VFX, HUD label + glyph, audio.
- 077796b — slice 5: GDD §5.3 Portal block + table row, §5.7 BC4 LIVE + Teleports row, ADR-022.
- #289 closed with all SHAs.

## State

- At 3124971: typecheck 0, lint exit 0, shared 479/479, client 441/441, server 40/40 (measured).
- At 077796b: lint exit 0 (measured). Docs only.
- /test-level live at 3124971 (headless, closed): HUD PORTAL → PORTAL B, lone end dim, armed end bright, hop + spark.

## Uncommitted

None of mine.

## Held files

None. GDD released to workertwo (messaged).

## Next

1. Wait for the supervisor's next lane.
2. If the owner rules on the exit-ring bloom: change `scene/portal-field/` (dim the exit end after a hop, or cap
   the pulse near the camera).

## Open questions

- Exit-ring flash (< ~150 ms full-frame orange): keep or dim? With the owner via the supervisor.

## Lessons → memory

- none.
