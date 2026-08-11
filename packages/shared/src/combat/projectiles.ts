// S5 projectiles — pure, headlessly-tested step + hit-test (server-only caller; the client interpolates,
// never predicts, projectiles). Framework-free: runs on the plain ProjectileState (tests) AND the
// Projectile schema instance (server) with identical math — the SimShip/PlayerState mirror discipline.

import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';

// Structural projectile state — mirrors the Projectile SCHEMA (schema.ts) field-for-field, so the schema
// instance structurally satisfies this and the functions below mutate it in place. `ttl` counts DOWN.
export interface ProjectileState {
    x: number;
    y: number;
    z: number;
    ownerId: string; // sessionId of the firer — owner-immune (a bolt never hits its shooter)
    ttl: number; // seconds remaining before expiry; the CALLER prunes when ttl <= 0
}

// Advance every live bolt one fixed step: forward (+z) and count ttl down. PURE mutation, no hit-test and
// no pruning here — the server orders advance → boltHits → prune explicitly (delete from the MapSchema).
export function stepProjectiles(
    projectiles: Iterable< ProjectileState >,
    dt: number,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): void {
    for ( const p of projectiles ) {
        p.z += cfg.boltSpeed * dt;
        p.ttl -= dt;
    }
}

// A ship a bolt can hit — STRUCTURAL so the server resolves shipId → tuning → halfW/halfL BEFORE calling
// (keeps this fn framework-free + pure). Dead/spectating ships aren't targetable.
export interface HitShip {
    id: string;
    x: number;
    y: number;
    z: number;
    halfW: number; // lateral half-extent of the target footprint (from its FlightTuning)
    halfL: number; // forward half-extent of the target footprint
    dead: boolean;
    spectating: boolean;
}

// AABB overlap of ONE bolt against a set of ships → the ids it hits this tick. Owner-immune (skips
// ownerId), skips dead/spectating. Lateral (x) + vertical (y IGNORED, v1) as before; the forward (z) test is
// SWEPT: `sweep` is how far the bolt travelled THIS tick (the caller passes cfg.boltSpeed·dt right after
// stepProjectiles), so we test the whole segment [z-sweep, z] — extended by ±cfg.boltHalf — against the ship's
// z-band, not just the post-step point. Without this a near-instant bolt (~10u/tick) tunnels a short hull
// (Comet/Interceptor) between 60Hz ticks and the hit is silently missed. `sweep = 0` (the default) reduces to
// the exact point test, so existing callers/tests are unchanged. Returns every victim (usually 0 or 1).
export function boltHits(
    bolt: ProjectileState,
    ships: readonly HitShip[],
    sweep = 0,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): string[] {
    const victims: string[] = [];
    const half = cfg.boltHalf;
    for ( const s of ships ) {
        if ( s.id === bolt.ownerId || s.dead || s.spectating ) continue;
        if (
            bolt.x + half > s.x - s.halfW &&
            bolt.x - half < s.x + s.halfW &&
            bolt.z + half > s.z - s.halfL && // front of the bolt box has reached/passed the ship's back edge
            bolt.z - half - sweep < s.z + s.halfL // back of the SWEPT box hasn't yet passed the ship's front edge
        ) {
            victims.push( s.id );
        }
    }
    return victims;
}
