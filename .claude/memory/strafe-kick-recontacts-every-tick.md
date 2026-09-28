---
name: strafe-kick-recontacts-every-tick
description: "Holding strafe into a wall re-contacts it every tick (kick floor), so any per-contact penalty ratchets; charge only fresh contacts"
metadata:
  node_type: memory
  type: project
  originSessionId: b2f11429-03a2-46d7-bdbb-bedd0b4508e8
  modified: 2026-09-28T08:31:55.406Z
---

`rampStrafe` floors vx at `strafeKick × strafe` (#305) on every tick that strafe is held. A ship that holds strafe into a block side therefore touches the face every tick, even after the 9 u/s bounce. Measured 2026-09-27 (#334): a per-contact loss of 0.3 × 12% took vz to about 26 in 4 s. With the old stun, which drops the throttle, one re-hit every 17 ticks took vz to 0 in about 3 s.

**Why:** a penalty charged per contact is really charged per tick while the ship scrapes.
**How to apply:** charge scrape or contact costs only on a FRESH contact. Test for one with the previous tick's hull gap to the face: `> 2 × BOUNCE_CLEARANCE` means fresh. After a push-out the hull sits flush at `BOUNCE_CLEARANCE`. See [[obstacle-spacing-from-ship-physics]].
