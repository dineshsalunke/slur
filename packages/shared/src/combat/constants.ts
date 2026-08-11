// S5 combat tuning + wire messages — framework-free (NO @colyseus/schema here; the Projectile SCHEMA
// class lives in schema.ts, the ONLY schema-importing file). Both ends import these so bolt flight, stun
// duration, and pickup respawn are IDENTICAL on client prediction (cosmetic) and server authority.
// Every constant is a derived, unit-carrying tuning surface (house rule: tune here, not raw physics).

// Discrete reliable client→server message: "fire my held power-up". Routed via a keydown that ignores
// e.repeat → room.send (the keys-1–5 hot-swap pattern), NOT an input axis — an axis would machine-gun on
// hold. No payload: the server reads the firer's authoritative pose + heldPower.
export const USE_POWERUP_MESSAGE = 'usePowerUp';

// Bolt = a dumb forward projectile (+z). Straight ribbon ⇒ forward-fire needs no auto-lock (BC8 deferred).
// NEAR-INSTANT (#55): a bolt crosses typical combat range in a blink but is NOT hitscan — a short travel
// window preserves the dodge-by-weaving axis (GDD §5.5). At 60Hz this steps ~10u/tick, which WOULD tunnel a
// short hull between ticks → `boltHits` uses SWEPT collision (the traveled z-interval, not a point). The exact
// value is a feel-gate #11 call; retune freely (the swept test is decoupled from it).
export const BOLT_SPEED = 1800; // units/second forward (z+). Near-instant (~30u/tick); ≫ any maxCruise. Feel-gate tuned up from 600.
export const BOLT_TTL = 0.5; // seconds a bolt lives before expiry — caps range at ~BOLT_SPEED·BOLT_TTL ≈ 900u. Feel-gate tunable.
export const BOLT_HALF = 1.5; // half-extent (units) of the bolt's OWN AABB in x AND z — added to the ship footprint on hit-test.

export const STUN_SECONDS = 1.2; // seconds of input-freeze on a bolt hit (§5.4 disruption-not-death; the track does the killing).
export const PICKUP_RESPAWN_S = 3; // seconds a grabbed pickup stays hidden before it re-appears (fast respawn → lots of ammo).

// Held power-up slot value (uint8 on PlayerState). Single held slot; 0 = empty. A const-object "enum"
// (not a TS enum) so it stays a plain wire number both ends resolve the same.
export const HeldPower = { none: 0, bolt: 1 } as const;
export type HeldPower = ( typeof HeldPower )[ keyof typeof HeldPower ];
