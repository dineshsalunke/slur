import { tuningForShip } from '../ship-classes.js';
import { type Block, segIndexForZ, type Track } from '../sim/space.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import { SEEKER_SPAWN_AHEAD } from './constants.js';
import type { HitShip } from './projectiles.js';

export interface SeekerState {
    x: number;
    y: number;
    z: number;
    vz: number;
    ownerId: string;
    targetId: string;
    ttl: number;
    committed: boolean;
}

export interface SeekerShip extends HitShip {
    vz: number;
    finished: boolean;
}

export interface SeekerShooter {
    x: number;
    y: number;
    z: number;
    vz: number;
}

export type SeekerOutcome = 'flying' | 'hit' | 'miss' | 'blocked' | 'lost' | 'expired';

export interface SeekerEvent {
    outcome: 'hit' | 'miss' | 'blocked';
    x: number;
    y: number;
    z: number;
    targetId: string;
    ownerId: string;
}

export interface SeekerRacer {
    x: number;
    y: number;
    z: number;
    vz: number;
    shipId: string;
    dead: boolean;
    spectating: boolean;
    finished: boolean;
}

const CLOSING_EPS = 1e-3;

export function seekerShipsOf( racers: Iterable< [ string, SeekerRacer ] > ): SeekerShip[] {
    const ships: SeekerShip[] = [];
    for ( const [ id, r ] of racers ) {
        if ( r.spectating ) continue;
        const t = tuningForShip( r.shipId );
        ships.push( {
            id,
            x: r.x,
            y: r.y,
            z: r.z,
            vz: r.vz,
            halfW: t.halfW,
            halfL: t.halfL,
            dead: r.dead,
            spectating: false,
            finished: r.finished,
        } );
    }
    return ships;
}

function segmentCrossesBlock( ax: number, az: number, bx: number, bz: number, b: Block ): boolean {
    let lo = 0;
    let hi = 1;
    const dx = bx - ax;
    const dz = bz - az;
    const slabs: [ number, number, number, number ][] = [
        [ ax, dx, b.x0, b.x1 ],
        [ az, dz, b.z0, b.z1 ],
    ];
    for ( const [ p, d, min, max ] of slabs ) {
        if ( d === 0 ) {
            if ( p <= min || p >= max ) return false;
            continue;
        }
        const t0 = ( min - p ) / d;
        const t1 = ( max - p ) / d;
        lo = Math.max( lo, Math.min( t0, t1 ) );
        hi = Math.min( hi, Math.max( t0, t1 ) );
        if ( lo >= hi ) return false;
    }
    return true;
}

export function lineOfSight(
    track: Track,
    broken: ReadonlySet< number >,
    ax: number,
    az: number,
    bx: number,
    bz: number,
): boolean {
    const first = segIndexForZ( Math.min( az, bz ) );
    const last = segIndexForZ( Math.max( az, bz ) );
    for ( let i = first; i <= last; i++ ) {
        for ( const b of track.segmentAt( i ).blocks ) {
            if ( ! broken.has( b.id ) && segmentCrossesBlock( ax, az, bx, bz, b ) ) return false;
        }
    }
    return true;
}

function lockable( s: SeekerShip, ownerId: string ): boolean {
    return s.id !== ownerId && ! s.dead && ! s.spectating && ! s.finished;
}

export function lockTarget(
    shooter: { x: number; z: number },
    ownerId: string,
    ships: readonly SeekerShip[],
    track: Track,
    broken: ReadonlySet< number >,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): string {
    let best: SeekerShip | null = null;
    for ( const s of ships ) {
        const dz = s.z - shooter.z;
        if ( ! lockable( s, ownerId ) || dz <= 0 || dz > cfg.seekerLockRange ) continue;
        if ( best !== null && ( dz > best.z - shooter.z || ( dz === best.z - shooter.z && s.id > best.id ) ) ) continue;
        if ( ! lineOfSight( track, broken, shooter.x, shooter.z, s.x, s.z ) ) continue;
        best = s;
    }
    return best?.id ?? '';
}

export function aimSeeker(
    seeker: SeekerState,
    shooter: SeekerShooter,
    ownerId: string,
    targetId: string,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): void {
    seeker.x = shooter.x;
    seeker.y = shooter.y;
    seeker.z = shooter.z + SEEKER_SPAWN_AHEAD;
    seeker.vz = shooter.vz;
    seeker.ownerId = ownerId;
    seeker.targetId = targetId;
    seeker.ttl = cfg.seekerTtl;
    seeker.committed = false;
}

export function inTerminalWindow(
    seeker: SeekerState,
    target: SeekerShip,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): boolean {
    const dz = target.z - seeker.z;
    if ( cfg.seekerWindowMode === 'distance' ) return dz <= cfg.seekerWindowU;
    const closing = seeker.vz - target.vz;
    if ( closing <= CLOSING_EPS ) return false;
    return dz / closing <= cfg.seekerWindowS;
}

function approach( from: number, to: number, maxStep: number ): number {
    return from + Math.max( -maxStep, Math.min( maxStep, to - from ) );
}

function cruiseHeight( dz: number, cfg: SimConfig ): number {
    const t = Math.max( 0, Math.min( 1, dz / cfg.seekerDiveDz ) );
    return cfg.seekerStrikeY + ( cfg.seekerCruiseY - cfg.seekerStrikeY ) * t;
}

function strikes( seeker: SeekerState, t: SeekerShip, sweep: number, cfg: SimConfig ): boolean {
    const half = cfg.seekerHalf;
    return (
        t.y < cfg.seekerHitBand &&
        seeker.x + half > t.x - t.halfW &&
        seeker.x - half < t.x + t.halfW &&
        seeker.z + half > t.z - t.halfL &&
        seeker.z - half - sweep < t.z + t.halfL
    );
}

function diveBlock(
    seeker: SeekerState,
    track: Track,
    broken: ReadonlySet< number >,
    sweep: number,
    cfg: SimConfig,
): Block | null {
    const half = cfg.seekerHalf;
    const zLo = seeker.z - half - sweep;
    const zHi = seeker.z + half;
    for ( let i = segIndexForZ( zLo ); i <= segIndexForZ( zHi ); i++ ) {
        for ( const b of track.segmentAt( i ).blocks ) {
            if ( broken.has( b.id ) ) continue;
            if (
                seeker.x + half > b.x0 &&
                seeker.x - half < b.x1 &&
                seeker.y - half < b.y1 &&
                zHi > b.z0 &&
                zLo < b.z1
            ) {
                return b;
            }
        }
    }
    return null;
}

export function stepSeeker(
    seeker: SeekerState,
    ships: readonly SeekerShip[],
    track: Track,
    broken: Set< number >,
    dt: number,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): SeekerOutcome {
    seeker.ttl -= dt;
    const target = seeker.targetId === '' ? undefined : ships.find( ( s ) => s.id === seeker.targetId );
    if ( seeker.targetId !== '' && ! targetAlive( target ) ) return 'lost';
    const sweep = advance( seeker, dt, cfg );
    if ( ! target ) {
        seeker.y = approach( seeker.y, cfg.seekerCruiseY, cfg.seekerClimb * dt );
        return seeker.ttl <= 0 ? 'expired' : 'flying';
    }
    return homeOn( seeker, target, track, broken, sweep, dt, cfg );
}

function targetAlive( t: SeekerShip | undefined ): t is SeekerShip {
    return t !== undefined && ! t.dead && ! t.spectating && ! t.finished;
}

function advance( seeker: SeekerState, dt: number, cfg: SimConfig ): number {
    const accel = cfg.seekerSpeed / cfg.seekerRampS;
    seeker.vz = seeker.vz < cfg.seekerSpeed ? Math.min( cfg.seekerSpeed, seeker.vz + accel * dt ) : cfg.seekerSpeed;
    const sweep = seeker.vz * dt;
    seeker.z += sweep;
    return sweep;
}

function homeOn(
    seeker: SeekerState,
    target: SeekerShip,
    track: Track,
    broken: Set< number >,
    sweep: number,
    dt: number,
    cfg: SimConfig,
): SeekerOutcome {
    if ( ! seeker.committed && inTerminalWindow( seeker, target, cfg ) ) seeker.committed = true;
    const lateral = ( seeker.committed ? cfg.seekerTurn : cfg.seekerTrackTurn ) * dt;
    seeker.x = approach( seeker.x, target.x, lateral );
    seeker.y = approach( seeker.y, cruiseHeight( target.z - seeker.z, cfg ), cfg.seekerClimb * dt );

    const wall = target.z - seeker.z <= cfg.seekerDiveDz ? diveBlock( seeker, track, broken, sweep, cfg ) : null;
    if ( wall ) {
        if ( wall.kind === 'fractured' ) broken.add( wall.id );
        return 'blocked';
    }
    if ( strikes( seeker, target, sweep, cfg ) ) return 'hit';
    if ( seeker.z - cfg.seekerHalf > target.z + target.halfL ) return 'miss';
    return seeker.ttl <= 0 ? 'expired' : 'flying';
}

export function stepSeekers(
    seekers: Map< string, SeekerState >,
    ships: readonly SeekerShip[],
    track: Track,
    broken: Set< number >,
    dt: number,
    onEvent: ( event: SeekerEvent ) => void,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): void {
    const spent: string[] = [];
    seekers.forEach( ( seeker, id ) => {
        const outcome = stepSeeker( seeker, ships, track, broken, dt, cfg );
        if ( outcome === 'flying' ) return;
        spent.push( id );
        if ( outcome === 'hit' || outcome === 'miss' || outcome === 'blocked' ) {
            const { x, y, z, targetId, ownerId } = seeker;
            onEvent( { outcome, x, y, z, targetId, ownerId } );
        }
    } );
    for ( const id of spent ) seekers.delete( id );
}
