---
name: obstacle-spacing-from-ship-physics
description: "OWNER RULE — post/pin spacing is derived from forward speed, lateral accel/clamp and strafe kick, never a fixed number"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 5b787660-1256-4117-af08-ccabd332042d
  modified: 2026-09-26T20:14:14.697Z
---

Obstacle spacing (slalom posts, motif pins) must be derived from ship physics: forward distance at the
design speed while the ship reacts (0.3 s), crosses to the next gap with the strafe kick + strafeAccel +
strafeClamp, settles via strafeDamp, and clears its hull. Measure the move with the real `simulate()` and
the kick-aware `strafeToward`, never a hand formula. Design speed by act: 100% / 90% / 75% of maxCruise,
max over classes.

**Why:** fixed pitches (24/36/52u) made the #300 slalom unreadable — posts stacked into one dark mass and
the next gap could not be anticipated. The owner: "one thing to be difficult and another to not be able
to anticipate the next step". After the physics-derived spacing went live: "now its turning out well".

**How to apply:** any generator that places obstacles a ship must dodge in sequence. Difficulty comes from
narrower lanes and longer runs, not from spacing below reaction time. See
[[fractional-strafe-pilots-trip-strafe-kick]], [[rate-clamp-is-not-flyability]].
