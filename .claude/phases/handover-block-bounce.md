# Handover — a block bounces the ship (ADR-014)

**Date:** 2026-09-23 · **Commit:** `6678600` · **Issue:** #213 · **Decision:** `docs/DECISIONS.md` ADR-014

## What shipped

Touching an obstacle block no longer derezzes the ship.

- `blockPush()` in `packages/shared/src/sim/step.ts` finds an overlapping block and the shallowest of
  its four lateral faces. `bounceOffBlock()` pushes the hull out along that face, sets the velocity
  into it to `-bounceBack` (9u/s), and raises `stunTimer` to `bounceStun` (0.25s).
- `markDead()` now fires only for `y < t.deathY`. **A gap is the only death in the game.**
- `applyLongitudinal()` no longer clamps `vz` at zero. Floor is `-t.bounceBack`, coast drag pulls
  toward zero from either side, and the brake still bottoms out at 0, so no input drives a ship
  backwards.
- `bounceBack` and `bounceStun` are new `FlightTuning` fields, uniform across the roster today.

No `SimShip` field was added, so the wire format and prediction/reconciliation are unchanged.

## Owner's three calls (asked before building)

1. Hit cost = **bounce + brief stun** (not a pure bounce, not N-hits-then-derez).
2. Falling = **unchanged**, still kills and respawns.
3. Bounce feel = **hard stop + small shove**, not a real ricochet.

## Two behaviours to feel before tuning

- **A graze glances off.** A wing 0.3u into a pillar has a shallower x-face than z-face, so the ship
  is nudged sideways and flies on — with the full stun. This falls out of the shallowest-face rule;
  it was not designed. If a 0.3u clip costing 0.25s of control reads as unfair, the fix is a
  penetration threshold below which no stun fires, not a different push rule.
- **9u/s and 0.25s are guesses.** Neither was played. Both are `DEFAULT_TUNING` edits in
  `packages/shared/src/constants.ts`.

## Left undone

- **No VFX on a bounce.** `pushHit()` is still called only from the server's bolt-hit message
  (`apps/client/app/net/attach-room-to-world.ts:135`), so a wall hit gets the stun blink and the
  `hit`/`stun` sounds but no spark. Wiring the *predicted* bounce into `hit-events.ts` is the
  follow-up — note it fires client-side from prediction, so it must not double-fire when the
  server's own hit message lands.
- **The generator's pressure is now softer everywhere.** `sim/track.test.ts`'s fairness caps still
  hold in letter, but ADR-006's intensity curve was tuned against a *lethal* block. Re-tuning
  intensity against a non-lethal one is not done.
- **The respawn probe lost its block coverage.** `sim/respawn.test.ts` now builds its track with
  `blockDensity: 0` — with bouncing, a straight-line probe stalls against the first wall forever
  instead of reaching a gap. Nothing now exercises respawn on a track that also has blocks.
- Open in ADR-014: whether a bounce should scrub lateral speed, whether armour should scale
  `bounceStun` the way `stunDurationForShip()` scales the bolt stun, and what breakable blocks
  (ADR-009) do on contact.

## Session state

Tree clean at `6678600`. Gate green this session: `pnpm typecheck`, 144 shared / 182 client / 4
server tests, `pnpm lint` at its 8 pre-existing warnings.

Earlier in the same session: `c291941` (one metal across every surface + `ShipShadow`) and
`77349b4` (its notes) — see [[handover-metal-and-ship-shadow]]. **`Shadow.opacity` 0.8 and
`Shadow.softness` 1.2 were never re-verified against the `slur.tuning.v1` store**; check `value` vs
`from` on those keys before believing what the page shows.
