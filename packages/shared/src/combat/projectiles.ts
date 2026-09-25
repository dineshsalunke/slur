import { tuningForShip } from '../ship-classes.js';
import { type Block, segIndexForZ, type Track } from '../sim/space.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import { entryZ, sweptZ } from './fire-dir.js';
import { type MineState, mineBoltFront } from './mine.js';

export interface ProjectileState {
    x: number;
    y: number;
    z: number;
    ownerId: string;
    ttl: number;
    dir: number;
}

export function stepProjectiles(
    projectiles: Iterable< ProjectileState >,
    dt: number,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): void {
    for ( const p of projectiles ) {
        p.z += p.dir * cfg.boltSpeed * dt;
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
    const dir = bolt.dir;
    const [ zLo, zHi ] = sweptZ( bolt.z, half, sweep, dir );
    let hit: Block | null = null;
    for ( let i = segIndexForZ( zLo ); i <= segIndexForZ( zHi ); i++ ) {
        for ( const b of track.segmentAt( i ).blocks ) {
            if ( broken.has( b.id ) || ! boltOverlaps( bolt, b, half, zLo, zHi ) ) continue;
            if ( hit === null || dir * entryZ( b.z0, b.z1, dir ) < dir * entryZ( hit.z0, hit.z1, dir ) ) hit = b;
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
    const [ zLo, zHi ] = sweptZ( bolt.z, half, sweep, bolt.dir );
    for ( const s of ships ) {
        if ( s.id === bolt.ownerId || s.dead || s.spectating ) continue;
        if (
            bolt.x + half > s.x - s.halfW &&
            bolt.x - half < s.x + s.halfW &&
            zHi > s.z - s.halfL &&
            zLo < s.z + s.halfL
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
    mine: string | null;
    spent: boolean;
}

function nearestMine(
    bolt: ProjectileState,
    mines: Iterable< [ string, MineState ] >,
    sweep: number,
    cfg: SimConfig,
): [ string | null, number ] {
    let nearest: string | null = null;
    let front = Number.POSITIVE_INFINITY;
    for ( const [ id, m ] of mines ) {
        const z = mineBoltFront( m, bolt, sweep, cfg.boltHalf, cfg );
        if ( z !== null && bolt.dir * z < front ) {
            nearest = id;
            front = bolt.dir * z;
        }
    }
    return [ nearest, front ];
}

export function resolveBolt(
    bolt: ProjectileState,
    ships: readonly HitShip[],
    track: Track,
    broken: ReadonlySet< number >,
    sweep = 0,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
    mines: Iterable< [ string, MineState ] > = [],
): BoltOutcome {
    const dir = bolt.dir;
    const wall = boltBlockHit( bolt, track, broken, sweep, cfg );
    const wallAt = wall ? dir * entryZ( wall.z0, wall.z1, dir ) : Number.POSITIVE_INFINITY;
    const [ mine, mineAt ] = nearestMine( bolt, mines, sweep, cfg );
    const stopAt = Math.min( wallAt, mineAt );
    const victims = boltHits( bolt, ships, sweep, cfg ).filter( ( id ) => {
        const s = ships.find( ( ship ) => ship.id === id );
        return s !== undefined && dir * entryZ( s.z - s.halfL, s.z + s.halfL, dir ) < stopAt;
    } );
    const hitMine = victims.length === 0 && mine !== null && mineAt < wallAt ? mine : null;
    const block = victims.length === 0 && hitMine === null ? wall : null;
    return {
        victims,
        block,
        mine: hitMine,
        spent: victims.length > 0 || hitMine !== null || wall !== null || bolt.ttl <= 0,
    };
}
