---
name: tuningforship-takes-a-ship-id
description: "tuningForShip('fighter') silently returns the fallback ship (freighter, 124 u/s, halfL 3) — it takes a ShipId, not a class id; use SHIP_CLASSES.<class>.tuning"
metadata:
  node_type: memory
  type: project
  originSessionId: db2e8265-e875-4b04-9de4-aef9e2e18868
  modified: 2026-09-25T13:17:29.583Z
---

`tuningForShip` takes a `ShipId` (`executioner`, `challenger`, `bob`, `dispatcher`, `split-crown`), not a
`ShipClassId`. A class name such as `'fighter'` does not throw. It returns the fallback tuning: maxCruise 124,
halfL 3, the freighter numbers. `mine.test.ts` has used `tuningForShip( 'fighter' )` as its HULL since #261.

**Why:** in #263 a timing test used it. It read 124 u/s instead of 96 u/s and failed for a reason in the
test, not in the code.

**How to apply:** in a test that needs a class, use `SHIP_CLASSES.<class>.tuning`. Use `tuningForShip`
only with a real ship id. Related: [[fixtures-must-be-width-relative]].
