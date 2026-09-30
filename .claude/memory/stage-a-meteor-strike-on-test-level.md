---
name: stage-a-meteor-strike-on-test-level
description: "Get a meteor strike to land in view on /test-level: seed tuning Meteor.chance 1 + Meteor.ahead 20, spawn ?start=0,1650 (slot 8 impact x 0.1 z 1721), tap ArrowUp 1.5 s; find the impact light by distance 110 and pin its intensity for A/Bs"
metadata:
  node_type: memory
  type: reference
  originSessionId: ef69ce2d-8ae5-46f7-9069-a58ab94ecde4
  modified: 2026-09-30T09:30:28.390Z
---

Meteor strikes are client-only VFX on a fixed slot grid (`meteor-schedule.ts` `strikeAt`, 220 u
spacing, seeded per slot). With the defaults a strike rarely lands in view, so a probe needs staging.
Verified 2026-09-30 (#393):

- In a fresh headless profile, write `slur.tuning.v1` =
  `{ "Meteor.chance": { value: 1, from: 0.15 }, "Meteor.ahead": { value: 20, from: 110 } }` (the
  `from` values must equal the schema defaults; see [[tuning-over-cdp]]).
- Load `/test-level?start=0,1650`. Slot 8 lands at x 0.1, z 1721 in a clear corridor. Parked, the
  launch lead is 30·flight + ahead = 62 u, so nothing launches yet.
- Hold ArrowUp for 1.5 s. The strike launches and lands ~16 u ahead of the ship, dead centre in the
  chase view, about 1.4 s later.
- **Impact light:** walk the scene (see [[grab-the-scene]]) for `o.isPointLight && o.distance === 110`.
  Detect landing as the intensity jumping above 50. Override `intensity` with `Object.defineProperty`
  (the setter keeps the real value, the getter returns 0) to A/B the light out.
- Deck luma: `gl.readPixels` a 32 px box around the projected impact in your own rAF callback,
  registered after R3F's, so it reads the current frame.

To list slots, recompute `strikeAt` in node from the seed formula in `meteor-schedule.ts`. The slot
table moves if #392 changes the placement. Related: [[headless-game-tabs-starve-the-gpu]].
