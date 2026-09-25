import { FASTEST_CRUISE, tuningForShip } from '../ship-classes.js';
import { type Block, segIndexForZ, type Track } from '../sim/space.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import { SEEKER_SPAWN_AHEAD } from './constants.js';
import { sweptZ } from './fire-dir.js';
import type { HitShip } from './projectiles.js';
import { forgetTrail, recordTrail, trailX } from './seeker-trail.js';

export interface SeekerState {
    x: number;
    y: number;
    z: number;
    vz: number;
    ownerId: string;
    targetId: string;
    ttl: number;
    committed: boolean;
    dir: number;
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

function segmentCrossesBlock( ax: number, az: number, bx: number, bz: number, b: Block, margin: number ): boolean {
    let lo = 0;
    let hi = 1;
    const dx = bx - ax;
    const dz = bz - az;
    const slabs: [ number, number, number, number ][] = [
        [ ax, dx, b.x0 - margin, b.x1 + margin ],
        [ az, dz, b.z0 - margin, b.z1 + margin ],
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
    margin = 0,
): boolean {
    const first = segIndexForZ( Math.min( az, bz ) - margin );
    const last = segIndexForZ( Math.max( az, bz ) + margin );
    for ( let i = first; i <= last; i++ ) {
        for ( const b of track.segmentAt( i ).blocks ) {
            if ( ! broken.has( b.id ) && segmentCrossesBlock( ax, az, bx, bz, b, margin ) ) return false;
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
    dir = 1,
): string {
    let best: SeekerShip | null = null;
    for ( const s of ships ) {
        const dz = dir * ( s.z - shooter.z );
        if ( ! lockable( s, ownerId ) || dz <= 0 || dz > cfg.seekerLockRange ) continue;
        const bestDz = best === null ? 0 : dir * ( best.z - shooter.z );
        if ( best !== null && ( dz > bestDz || ( dz === bestDz && s.id > best.id ) ) ) continue;
        if ( ! lineOfSight( track, broken, shooter.x, shooter.z, s.x, s.z, cfg.seekerHalf ) ) continue;
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
    dir = 1,
): void {
    seeker.x = shooter.x;
    seeker.y = cfg.seekerFlyY;
    seeker.z = shooter.z + dir * SEEKER_SPAWN_AHEAD;
    seeker.vz = dir < 0 ? 0 : shooter.vz;
    seeker.ownerId = ownerId;
    seeker.targetId = targetId;
    seeker.ttl = cfg.seekerTtl;
    seeker.committed = false;
    seeker.dir = dir;
    forgetTrail( seeker );
}

export function inTerminalWindow(
    seeker: SeekerState,
    target: SeekerShip,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): boolean {
    const dz = seeker.dir * ( target.z - seeker.z );
    if ( cfg.seekerWindowMode === 'distance' ) return dz <= cfg.seekerWindowU;
    const closing = seeker.dir * ( seeker.vz - target.vz );
    if ( closing <= CLOSING_EPS ) return false;
    return dz / closing <= cfg.seekerWindowS;
}

function approach( from: number, to: number, maxStep: number ): number {
    return from + Math.max( -maxStep, Math.min( maxStep, to - from ) );
}

function strikes( seeker: SeekerState, t: SeekerShip, sweep: number, cfg: SimConfig ): boolean {
    const half = cfg.seekerHalf;
    const [ zLo, zHi ] = sweptZ( seeker.z, half, sweep, seeker.dir );
    return (
        t.y < cfg.seekerHitBand &&
        seeker.x + half > t.x - t.halfW &&
        seeker.x - half < t.x + t.halfW &&
        zHi > t.z - t.halfL &&
        zLo < t.z + t.halfL
    );
}

function standingBlockIn(
    track: Track,
    broken: ReadonlySet< number >,
    x0: number,
    x1: number,
    y: number,
    z0: number,
    z1: number,
): Block | null {
    for ( let i = segIndexForZ( z0 ); i <= segIndexForZ( z1 ); i++ ) {
        for ( const b of track.segmentAt( i ).blocks ) {
            if ( broken.has( b.id ) ) continue;
            if ( x1 > b.x0 && x0 < b.x1 && y < b.y1 && z1 > b.z0 && z0 < b.z1 ) return b;
        }
    }
    return null;
}

function blockAt(
    seeker: SeekerState,
    prevX: number,
    track: Track,
    broken: ReadonlySet< number >,
    sweep: number,
    cfg: SimConfig,
): Block | null {
    const half = cfg.seekerHalf;
    const { y, z } = seeker;
    const [ zLo, zHi ] = sweptZ( z, half, sweep, seeker.dir );
    return (
        standingBlockIn( track, broken, prevX - half, prevX + half, y - half, zLo, zHi ) ??
        standingBlockIn( track, broken, seeker.x - half, seeker.x + half, y - half, z - half, z + half )
    );
}

function clearTo(
    seeker: SeekerState,
    target: SeekerShip,
    track: Track,
    broken: ReadonlySet< number >,
    cfg: SimConfig,
): boolean {
    const half = cfg.seekerHalf;
    const x0 = Math.min( seeker.x, target.x ) - half;
    const x1 = Math.max( seeker.x, target.x ) + half;
    const [ z0, z1 ] = seeker.dir < 0 ? [ target.z, seeker.z + half ] : [ seeker.z - half, target.z ];
    return standingBlockIn( track, broken, x0, x1, seeker.y - half, z0, z1 ) === null;
}

function crashed(
    seeker: SeekerState,
    prevX: number,
    track: Track,
    broken: Set< number >,
    sweep: number,
    cfg: SimConfig,
): boolean {
    const wall = blockAt( seeker, prevX, track, broken, sweep, cfg );
    if ( ! wall ) return false;
    if ( wall.kind === 'fractured' ) broken.add( wall.id );
    return true;
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
        if ( crashed( seeker, seeker.x, track, broken, sweep, cfg ) ) return 'blocked';
        return seeker.ttl <= 0 ? 'expired' : 'flying';
    }
    return homeOn( seeker, target, track, broken, sweep, dt, cfg );
}

function targetAlive( t: SeekerShip | undefined ): t is SeekerShip {
    return t !== undefined && ! t.dead && ! t.spectating && ! t.finished;
}

export function seekerTopSpeed( cfg: SimConfig = DEFAULT_SIM_CONFIG ): number {
    return cfg.seekerSpeedFactor * FASTEST_CRUISE;
}

function advance( seeker: SeekerState, dt: number, cfg: SimConfig ): number {
    const top = seekerTopSpeed( cfg );
    const accel = top / cfg.seekerRampS;
    const along = seeker.dir * seeker.vz;
    const next = along < top ? Math.min( top, along + accel * dt ) : top;
    seeker.vz = seeker.dir * next;
    const sweep = next * dt;
    seeker.z += seeker.dir * sweep;
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
    const forward = seeker.dir > 0;
    if ( forward ) recordTrail( seeker, target, cfg );
    if ( ! seeker.committed && inTerminalWindow( seeker, target, cfg ) ) seeker.committed = true;
    const prevX = seeker.x;
    if ( seeker.committed ) {
        seeker.x = approach( seeker.x, target.x, cfg.seekerTurn * dt );
        seeker.y = approach( seeker.y, cfg.seekerStrikeY, cfg.seekerDropRate * dt );
    } else {
        const hold = forward ? trailX( seeker ) : seeker.x;
        const goal = clearTo( seeker, target, track, broken, cfg ) ? target.x : hold;
        seeker.x = approach( seeker.x, goal, cfg.seekerTrackTurn * dt );
    }

    if ( crashed( seeker, prevX, track, broken, sweep, cfg ) ) return 'blocked';
    if ( strikes( seeker, target, sweep, cfg ) ) return 'hit';
    if ( seeker.dir * ( seeker.z - target.z ) - cfg.seekerHalf > target.halfL ) return 'miss';
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
