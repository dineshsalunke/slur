import { tuningForShip } from '../ship-classes.js';
import { type Block, segIndexForZ, type Track } from '../sim/space.js';
import type { HitShip } from './projectiles.js';

export interface TargetShip extends HitShip {
    vz: number;
    finished: boolean;
}

export interface TargetRacer {
    x: number;
    y: number;
    z: number;
    vz: number;
    shipId: string;
    dead: boolean;
    spectating: boolean;
    finished: boolean;
}

export function targetShipsOf( racers: Iterable< [ string, TargetRacer ] > ): TargetShip[] {
    const ships: TargetShip[] = [];
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

function lockable( s: TargetShip, ownerId: string ): boolean {
    return s.id !== ownerId && ! s.dead && ! s.spectating && ! s.finished;
}

export function lockTarget(
    shooter: { x: number; z: number },
    ownerId: string,
    ships: readonly TargetShip[],
    track: Track,
    broken: ReadonlySet< number >,
    range: number,
    margin: number,
    dir = 1,
): string {
    let best: TargetShip | null = null;
    for ( const s of ships ) {
        const dz = dir * ( s.z - shooter.z );
        if ( ! lockable( s, ownerId ) || dz <= 0 || dz > range ) continue;
        const bestDz = best === null ? 0 : dir * ( best.z - shooter.z );
        if ( best !== null && ( dz > bestDz || ( dz === bestDz && s.id > best.id ) ) ) continue;
        if ( ! lineOfSight( track, broken, shooter.x, shooter.z, s.x, s.z, margin ) ) continue;
        best = s;
    }
    return best?.id ?? '';
}
