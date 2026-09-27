Agent: workerone · Lane: #325 portal gate as a full 6u ring · Updated: 2026-09-27 (lane done, closed)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#325: replace the #320 arch with a full 6u ring (owner: P1, circular catch).

## Done

- #318: 4b17a2e, fc85cd7. #320: b760826. #322: 7696144. #323: e499eee + bc96f51. All closed.
- #325: 1fc6aef (pushed). Issue closed with the SHA.
  - Shared `combat/portal.ts`: `portalH` is gone. `portalY` 3 + `portalRideY` 0.8 + `portalHalfChord()`. `enters()` tests the circle at `s.y + portalRideY`.
  - Client: `portal-ring.ts` lost the arch builders and gained `ringSleeveGeometry` (continuous). `portal-field` builds the ring at `GATE_Y`; the feet cradle the outer rim; `LUG_Y` is at the ring top.
  - `mine-shock.constants.ts`: gate-ring lift = `portalY`.
  - GDD hop + gate bullets; ART_SCALE_REFERENCE §7b rewritten with a departure note.

## State

- The sim ship is at y 0 when grounded (`step.ts` `DECK_Y`); the 0.35–1.25 hover is client-only (`Hover.base` 0.35 + `speedLift` 0.9). That is why the catch has `portalRideY`.
- /test-level, headless DPR 1, ship split-crown: grounded dx 3.54 → no hop; dx 3.19 → hop.
- Draws at a fixed camera: 130 with a pair, 124 after TTL. That is +6 (3 instanced meshes × chase + mirror) [inferred].
- Shared 529/529, client 550/550, server 40/40; typecheck 0; lint 0 errors (8 old warnings).
- Screenshots in session scratchpad 438be093: `ring-front.png`, `ring-hop-low-edge.png`.

## Uncommitted

None of mine. `tug-line/*` is workertwo's; `tracks/` is owner data.

## Held files

None. Lane finished.

## Next

1. Wait for the next lane from slur-supervisor.

## Open questions

- #325: the marigold sleeve blooms strongly at distance (see `ring-front.png`). Owner: tune `PORTAL_ARMED_INTENSITY` if it is too loud.
- From #320: is the exit-frame bloom too strong?
- #315, #308, `unionRects` order: still open from an earlier lane.

## Lessons → memory

`.claude/memory/sim-ship-y-is-zero-on-deck.md`
