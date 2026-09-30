---
name: stage-a-meteor-strike-on-test-level
description: "Get meteor strikes to land on /test-level: seed Meteor.chance 1, ghost-drive the ship (write server z each rAF) so it never stalls at a wall; strikes fire as the camera passes each 220 u slot and land ~30–70 u ahead; find the impact light by distance 110"
metadata:
  node_type: memory
  type: reference
  originSessionId: ef69ce2d-8ae5-46f7-9069-a58ab94ecde4
  modified: 2026-09-30T09:43:30.897Z
---

Meteor strikes are client-only VFX. Since #392 (7a90abc6) the slot grid (`meteor-schedule.ts`
`strikeAt`, 220 u spacing from z 400) is only the cadence: a strike fires when the **camera** z passes
its slot z and lands at camera x ± 10, camera z + v·flight + `Meteor.ahead` × 0.7–1.3. v is a 0.5 s
held-window dz/dt of the camera. Verified 2026-09-30:

- In a fresh headless profile, write `slur.tuning.v1` = `{ "Meteor.chance": { value: 1, from: 0.15 } }`
  (`from` must equal the schema default; see [[tuning-over-cdp]]).
- **Holding ArrowUp alone stalls the ship at a wall near z 600** — one strike in 45 s. Ghost-drive
  instead: every rAF write the server ship `s.x = 0; s.z = z; s.lastSafeX/Z; s.vz = v` with z advanced
  by v·dt (reach the room as in [[place-the-ship-over-cdp]]). At 55 u/s that gives ~9 strikes in 45 s.
- The ghost write fights reconciliation: ~4% of camera frames step backward and ~4% jump > 5 u. A
  per-frame speed estimate with per-step clamps reads far low (52 at a true 110); use a window.
- **Impact light:** walk the scene (see [[grab-the-scene]]) for `o.isPointLight && o.distance === 110`.
  Detect landing as intensity jumping above 50. Override `intensity` with `Object.defineProperty` to A/B.
- Deck luma: `gl.readPixels` a 32 px box around the projected impact in your own rAF callback,
  registered after R3F's, so it reads the current frame.

Related: [[headless-game-tabs-starve-the-gpu]].
