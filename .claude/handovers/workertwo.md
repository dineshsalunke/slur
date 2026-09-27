Agent: workertwo · Lane: /test-level pickup grant buttons #324 (DONE, closed) · Updated: 2026-09-27

## Goal
Buttons in the /test-level debug panel that give the local ship each pickup, server-authoritative.

## Done
- 16f962d #324: `routes/test-level/pickup-grants/` — leva folder "Pickups" (bolt, seeker, mine, boost, shield, portal, tug) in the Backquote tuning panel; each writes the HeldPower id into the first empty slot of `room.sim.state` (server), full bag = no-op. Mounted from route.tsx via PickupGrantsMount (only while the panel is shown).

## State
- Tests: pickup-grants 2/2, routes/test-level 65/65; client typecheck clean; lint clean on my files.
- Headless /test-level check (scratch grant-check.mjs): 7 buttons appear on Backquote, gone when hidden; mine+tug → slots [3,8,0] server and client; portal then bolt on full bag → [3,8,6]; KeyE fires slot 0 → [0,8,6]; no page errors.

## Uncommitted
none

## Held files
none

## Next
1. Lane finished. Await a new lane from slur-supervisor.

## Open questions
- none

## Lessons → memory
- none
