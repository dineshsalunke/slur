// S5 combat tuning + wire messages — framework-free (NO @colyseus/schema here; the Projectile SCHEMA
// class lives in schema.ts, the ONLY schema-importing file). Both ends import these so bolt flight, stun
// duration, and pickup respawn are IDENTICAL on client prediction (cosmetic) and server authority.
// Every constant is a derived, unit-carrying tuning surface (house rule: tune here, not raw physics).

// Discrete reliable client→server message: "fire my held power-up". Routed via a keydown that ignores
// e.repeat → room.send (the keys-1–5 hot-swap pattern), NOT an input axis — an axis would machine-gun on
// hold. No payload: the server reads the firer's authoritative pose + heldPower.
export const USE_POWERUP_MESSAGE = 'usePowerUp';

// Bolt = a dumb forward projectile (+z). Straight ribbon ⇒ forward-fire needs no auto-lock (BC8 deferred).
export const BOLT_SPEED = 120; // units/second forward (z+). > any maxCruise (55) so a bolt overtakes ships ahead.
export const BOLT_TTL = 2.5; // seconds a bolt lives before it expires (pruned) — caps range at ~BOLT_SPEED·BOLT_TTL u.
export const BOLT_HALF = 1.5; // half-extent (units) of the bolt's OWN AABB in x AND z — added to the ship footprint on hit-test.

export const STUN_SECONDS = 1.2; // seconds of input-freeze on a bolt hit (§5.4 disruption-not-death; the track does the killing).
export const PICKUP_RESPAWN_S = 5; // seconds a grabbed pickup stays hidden before it re-appears (short respawn).

// Held power-up slot value (uint8 on PlayerState). Single held slot; 0 = empty. A const-object "enum"
// (not a TS enum) so it stays a plain wire number both ends resolve the same.
export const HeldPower = { none: 0, bolt: 1 } as const;
export type HeldPower = ( typeof HeldPower )[ keyof typeof HeldPower ];
