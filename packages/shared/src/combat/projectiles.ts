import { tuningForShip } from '../ship-classes.js';
import { type Block, segIndexForZ, type Track } from '../sim/space.js';
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

function boltOverlaps( bolt: ProjectileState, b: Block, half: number, zLo: number, zHi: number ): boolean {
    return (
        bolt.x + half > b.x0 &&
        bolt.x - half < b.x1 &&
        bolt.y + half > b.y0 &&
        bolt.y - half < b.y1 &&
        zHi > b.z0 &&
        zLo < b.z1
    );
}

export function boltBlockHit(
    bolt: ProjectileState,
    track: Track,
    broken: ReadonlySet< number >,
    sweep = 0,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): Block | null {
    const half = cfg.boltHalf;
    const zLo = bolt.z - half - sweep;
    const zHi = bolt.z + half;
    let hit: Block | null = null;
    for ( let i = segIndexForZ( zLo ); i <= segIndexForZ( zHi ); i++ ) {
        for ( const b of track.segmentAt( i ).blocks ) {
            if ( broken.has( b.id ) || ! boltOverlaps( bolt, b, half, zLo, zHi ) ) continue;
            if ( hit === null || b.z0 < hit.z0 ) hit = b;
        }
    }
    return hit;
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

export interface Racer {
    x: number;
    y: number;
    z: number;
    shipId: string;
    dead: boolean;
    spectating: boolean;
}

export function hitShipsOf( racers: Iterable< [ string, Racer ] > ): HitShip[] {
    const ships: HitShip[] = [];
    for ( const [ id, r ] of racers ) {
        if ( r.spectating ) continue;
        const t = tuningForShip( r.shipId );
        ships.push( { id, x: r.x, y: r.y, z: r.z, halfW: t.halfW, halfL: t.halfL, dead: r.dead, spectating: false } );
    }
    return ships;
}

export interface BoltOutcome {
    victims: string[];
    block: Block | null;
    spent: boolean;
}

export function resolveBolt(
    bolt: ProjectileState,
    ships: readonly HitShip[],
    track: Track,
    broken: ReadonlySet< number >,
    sweep = 0,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): BoltOutcome {
    const wall = boltBlockHit( bolt, track, broken, sweep, cfg );
    const wallZ = wall?.z0 ?? Number.POSITIVE_INFINITY;
    const victims = boltHits( bolt, ships, sweep, cfg ).filter( ( id ) => {
        const s = ships.find( ( ship ) => ship.id === id );
        return s !== undefined && s.z - s.halfL < wallZ;
    } );
    return {
        victims,
        block: victims.length === 0 ? wall : null,
        spent: victims.length > 0 || wall !== null || bolt.ttl <= 0,
    };
}
