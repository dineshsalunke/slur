import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';

export interface ProjectileState {
    x: number;
    y: number;
    z: number;
    ownerId: string;
    ttl: number;
}

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

export interface HitShip {
    id: string;
    x: number;
    y: number;
    z: number;
    halfW: number;
    halfL: number;
    dead: boolean;
    spectating: boolean;
}

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
            bolt.z + half > s.z - s.halfL &&
            bolt.z - half - sweep < s.z + s.halfL
        ) {
            victims.push( s.id );
        }
    }
    return victims;
}
