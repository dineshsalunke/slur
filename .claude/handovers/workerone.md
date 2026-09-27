Agent: workerone · Lane: #320 portal gate width + hop cue · Updated: 2026-09-27 (lane done, closed)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#320: the drawn gate matches the sim catch (6u × 5u), and a hop has a clear cue. Owner approved A + 1 + 2.

## Done

- #318: 4b17a2e, fc85cd7. Closed.
- #320: b760826 (pushed). Issue closed with the SHA.
  - The gate is an arch: legs to 2u, a radius-3 top at 5u (`archGeometry`, `archSleeveGeometry` in portal-ring.ts). The feet are outside the aperture.
  - Hop cue: MineShock kinds `portalIn`/`portalOut` (upright, lift 2u) at the gates. `camera/hop-kick.ts` FOV +10° over 0.3 s. `game/local-hop.ts` fires on the predicted hop and on a reconcile that adds a hop. The local sound comes via `onLocalHop`; the server message covers only other ships.
  - Docs: ART_SCALE_REFERENCE §7b (portal gate, with decisions + departures), GDD §5 Hop cue + Gate bullets.

## State

- Live /test-level (headless, DPR 1, 1280×720): clear width 5.94u at y = 0.35 / 0.8 / 1.25 / 2, top 4.97u.
- Draws: open deck 125, pair 131 (+6, the same as #303), 135–136 while the rings show.
- FOV 70 → 78.9 on the hop frame, back to 70 in about 0.3 s.
- Screenshots: the exit ring bursts around the ship, and the entry ring collapses in the rear-view mirror.
- 519 client tests pass, typecheck 0, lint 0 errors (8 old warnings; attach-room-to-world.ts was already over 300 lines: 333 → 337).
- Files claimed after the plan: `game/local-hop.ts` (+test) and `audio/bind-room-audio.ts`. No one else held them.

## Uncommitted

None of mine. Owner data in `tracks/` is not mine. Do not commit it.

## Held files

None. Lane finished.

## Next

1. Wait for the next lane from slur-supervisor.

## Open questions

- Owner: is the near-arch bloom on the exit frame (the screen goes amber for about 1 frame) too strong? Tune `PORTAL_ARMED_INTENSITY` or the `portalOut` `bright` if so.
- #315, #308, `unionRects` order: still open from an earlier lane.

## Lessons → memory

`.claude/memory/raycast-instanced-mesh-clear-bounds.md`
