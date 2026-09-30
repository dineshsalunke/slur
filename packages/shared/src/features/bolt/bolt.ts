import { entryZ, sweptZ } from '../../combat/fire-dir.js';
import { type MineEvent, type MineState, mineEvent, mineShotFront } from '../../combat/mine-hit.js';
import type { HitShip, ProjectileState } from '../../combat/projectiles.js';
import { type Block, segIndexForZ, type Track } from '../../sim/space.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../../sim-config.js';
import { BOLT_SPAWN_AHEAD } from './bolt-constants.js';

export interface BoltGunner {
    x: number;
    y: number;
    z: number;
}

export interface BoltStrike {
    x: number;
    y: number;
    z: number;
    victimId: string;
}

export interface BoltOutcome {
    victims: string[];
    block: Block | null;
    mine: string | null;
    spent: boolean;
}

export function aimBolt(
    bolt: ProjectileState,
    g: BoltGunner,
    ownerId: string,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
    dir = 1,
): void {
    bolt.x = g.x;
    bolt.y = g.y;
    bolt.z = g.z + dir * BOLT_SPAWN_AHEAD;
    bolt.ownerId = ownerId;
    bolt.ttl = cfg.boltTtl;
    bolt.dir = dir;
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

function nearestMine(
    bolt: ProjectileState,
    mines: Iterable< [ string, MineState ] >,
    sweep: number,
    cfg: SimConfig,
): [ string | null, number ] {
    let nearest: string | null = null;
    let front = Number.POSITIVE_INFINITY;
    for ( const [ id, m ] of mines ) {
        const z = mineShotFront( m, bolt, sweep, cfg.boltHalf, cfg );
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

export function stepBolts(
    bolts: Map< string, ProjectileState >,
    ships: readonly HitShip[],
    track: Track,
    broken: Set< number >,
    dt: number,
    onStrike: ( strike: BoltStrike ) => void,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
    mines: Map< string, MineState > = new Map(),
    onMine: ( event: MineEvent ) => void = () => {},
): void {
    stepProjectiles( bolts.values(), dt, cfg );
    const sweep = cfg.boltSpeed * dt;
    const spent: string[] = [];
    bolts.forEach( ( bolt, id ) => {
        const out = resolveBolt( bolt, ships, track, broken, sweep, cfg, mines );
        for ( const victimId of out.victims ) onStrike( { x: bolt.x, y: bolt.y, z: bolt.z, victimId } );
        const mine = out.mine === null ? undefined : mines.get( out.mine );
        if ( out.mine !== null && mine ) {
            mines.delete( out.mine );
            onMine( mineEvent( mine, 'cleared' ) );
        }
        if ( out.block?.kind === 'fractured' ) broken.add( out.block.id );
        if ( out.block ) {
            onStrike( { x: bolt.x, y: bolt.y, z: entryZ( out.block.z0, out.block.z1, bolt.dir ), victimId: '' } );
        }
        if ( out.spent ) spent.push( id );
    } );
    for ( const id of spent ) bolts.delete( id );
}
