// SimConfig — the sim's combat/world RULESET as plain, passed-in data (issue #71). Sibling to the per-ship
// FlightTuning table (ship-classes.ts): FlightTuning is per-SHIP flight, SimConfig is the shared combat/world
// knobs the sim reads every tick. Both flow INTO simulate()/the combat step as arguments, so the sim depends
// on the CONFIG ABSTRACTION, not on module globals — the same "depends on the abstraction, not its source"
// property as the Track contract (ADR-000).
//
// WHY a passed struct, not the raw constants: it de-hardcodes the values so a room can run its own ruleset
// (#70 per-room tuning) and, later, vary it mid-round — with NO sim-code change, because the sim already
// reads `cfg` from its parameter, resolved per step, never cached across ticks and never re-imported as a
// global. Keep this a PLAIN SERIALIZABLE struct (numbers only, no functions/closures) so #70 can promote it
// to synced schema state without reshaping.

import { BOLT_HALF, BOLT_SPEED, BOLT_TTL, PICKUP_RESPAWN_S, STUN_SECONDS } from './combat/constants.js';
import { DRAG_SPEED_FRAC } from './constants.js';

export interface SimConfig {
    boltSpeed: number; // bolt forward speed (u/s, +z). Advance per tick = boltSpeed·dt.
    boltTtl: number; // seconds a bolt lives before expiry — caps range at ~boltSpeed·boltTtl.
    boltHalf: number; // half-extent (u) of the bolt's own AABB (x AND z), added to the ship footprint on hit-test.
    stunSeconds: number; // base input-freeze on a bolt hit (s); per-ship armour scales it (stunDurationForShip).
    pickupRespawnS: number; // seconds a grabbed pickup slot stays hidden before it re-appears.
    dragSpeedFrac: number; // inside a drag block, vz is clamped to this × the ship's maxCruise (per-class fair).
}

// The DEFAULT ruleset = today's exact values, sourced straight from the raw tuning constants so it can NEVER
// drift from them (guarantees "zero behaviour change"). The sim reads `cfg`, not these constants directly;
// the constants remain the canonical default source (and the named literals the tests assert against).
export const DEFAULT_SIM_CONFIG: SimConfig = {
    boltSpeed: BOLT_SPEED,
    boltTtl: BOLT_TTL,
    boltHalf: BOLT_HALF,
    stunSeconds: STUN_SECONDS,
    pickupRespawnS: PICKUP_RESPAWN_S,
    dragSpeedFrac: DRAG_SPEED_FRAC,
};
