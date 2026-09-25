import { CELL, FRACTURE_MAX_DEPTH, FRACTURE_MAX_WIDTH, MAX_SHIP_WIDTH } from '../../constants.js';
import { FRACTURE_SHADOW_Z } from '../fracture-shadow.js';
import { hash2, mulberry32 } from '../rng.js';
import { HALF_WIDTH, MIN_LANE, SEG_LEN } from '../space.js';
import { GROOVE_BEAT_Z, type GrooveBand, pickWeighted } from './grammar.js';
import { GROOVE_MOVE_BEATS, type GrooveEvent, type GrooveLine } from './line.js';

export const ISLAND_CHANCE: Readonly< Record< GrooveBand, number > > = { low: 0.7, mid: 0.85, high: 1 };
export const ISLAND_WIDTHS = [ CELL, 2 * CELL, 3 * CELL ] as const;
export const ISLAND_DEPTHS = [ 4 * CELL, 6 * CELL, 8 * CELL, 12 * CELL ] as const;
export const ISLAND_LEAD_BEATS = 0.75;
export const ISLAND_MIN_DEPTH = 2 * CELL;
export const POST_OFFSET = MAX_SHIP_WIDTH / 2 + 1;
export const HOLE_WIDTHS = [ 4 * CELL, 6 * CELL, 8 * CELL ] as const;
export const HOLE_LEAD = 2 * CELL;
export const HOLE_DEPTH = SEG_LEN;
export const HOLE_SPACING_BEATS = 2;
export const SEP_X = 2 * MIN_LANE;
export const SEP_Z = 3 * CELL;
export const SMASH_WIDTH = Math.min( 3 * CELL, FRACTURE_MAX_WIDTH );
export const SMASH_DEPTH = Math.min( 2 * CELL, FRACTURE_MAX_DEPTH );
export const SMASH_LEAD = CELL;

const SALT_ISLAND = 0x6e21b4f7 | 0;

export type ObstacleKind = 'island' | 'hole' | 'smash';

export interface GrooveObstacle {
    kind: ObstacleKind;
    x0: number;
    x1: number;
    z0: number;
    z1: number;
    event: number;
}

function snapZ( z: number ): number {
    return Math.round( z / CELL ) * CELL;
}

export function reachZ( o: GrooveObstacle ): number {
    return o.kind === 'smash' ? o.z1 + FRACTURE_SHADOW_Z : o.z1;
}

export function conflicts( a: GrooveObstacle, b: GrooveObstacle ): boolean {
    if ( a.kind === 'hole' && b.kind === 'hole' && Math.abs( a.z0 - b.z0 ) < HOLE_SPACING_BEATS * GROOVE_BEAT_Z )
        return true;
    const zNear = a.z0 < reachZ( b ) + SEP_Z && b.z0 < reachZ( a ) + SEP_Z;
    const xGap = Math.max( a.x0 - b.x1, b.x0 - a.x1 );
    return zNear && xGap < SEP_X;
}

function holeOf( e: GrooveEvent, k: number, rand: () => number ): GrooveObstacle | null {
    const w = HOLE_WIDTHS[ pickWeighted( [ 1, 1, 1 ], rand() ) ];
    let x0 = Math.max( -HALF_WIDTH, e.from - w / 2 );
    let x1 = Math.min( HALF_WIDTH, e.from + w / 2 );
    if ( x0 + HALF_WIDTH < MIN_LANE ) x0 = -HALF_WIDTH;
    if ( HALF_WIDTH - x1 < MIN_LANE ) x1 = HALF_WIDTH;
    if ( 2 * HALF_WIDTH - ( x1 - x0 ) < SEP_X ) return null;
    const z0 = snapZ( e.z + HOLE_LEAD );
    return { kind: 'hole', x0, x1, z0, z1: z0 + HOLE_DEPTH, event: k };
}

function islandOf( e: GrooveEvent, k: number, rand: () => number ): GrooveObstacle | null {
    const roll = rand();
    const w = ISLAND_WIDTHS[ pickWeighted( [ 1, 1, 1 ], rand() ) ];
    const depth = ISLAND_DEPTHS[ pickWeighted( [ 1, 1, 1, 1 ], rand() ) ];
    if ( roll >= ISLAND_CHANCE[ e.band ] || e.dx < MIN_LANE ) return null;
    const d = Math.sign( e.to - e.from );
    const near = e.from + d * POST_OFFSET;
    const far = near - d * w;
    const x0 = Math.max( -HALF_WIDTH, Math.min( near, far ) );
    const x1 = Math.min( HALF_WIDTH, Math.max( near, far ) );
    if ( x1 - x0 < CELL ) return null;
    const z0 = snapZ( e.z + ISLAND_LEAD_BEATS * GROOVE_BEAT_Z );
    const z1 = Math.min( z0 + depth, snapZ( e.nextZ ) );
    if ( z1 - z0 < ISLAND_MIN_DEPTH ) return null;
    return { kind: 'island', x0, x1, z0, z1, event: k };
}

function inOneSegment( z0: number ): number {
    const segEnd = ( Math.floor( z0 / SEG_LEN ) + 1 ) * SEG_LEN;
    return z0 + SMASH_DEPTH <= segEnd ? z0 : segEnd;
}

function smashesOf( e: GrooveEvent, k: number ): GrooveObstacle[] {
    const x0 = Math.max( -HALF_WIDTH, Math.min( HALF_WIDTH - SMASH_WIDTH, e.to - SMASH_WIDTH / 2 ) );
    const out: GrooveObstacle[] = [];
    for ( let z = snapZ( e.z + GROOVE_MOVE_BEATS * GROOVE_BEAT_Z + SMASH_LEAD ); ; z += CELL ) {
        const z0 = inOneSegment( z );
        const z1 = z0 + SMASH_DEPTH;
        if ( z1 + FRACTURE_SHADOW_Z > e.nextZ ) return out;
        out.push( { kind: 'smash', x0, x1: x0 + SMASH_WIDTH, z0, z1, event: k } );
    }
}

export function placeObstacles( line: GrooveLine ): GrooveObstacle[] {
    const placed: GrooveObstacle[] = [];
    const fits = ( o: GrooveObstacle ): boolean =>
        ! line.arenas.some( ( a ) => o.z0 < a.z1 && a.z0 < o.z1 ) && ! placed.some( ( p ) => conflicts( p, o ) );
    const place = ( o: GrooveObstacle | null | undefined ): void => {
        if ( o !== null && o !== undefined && fits( o ) ) placed.push( o );
    };
    const rolls = line.events.map( ( _, k ) => mulberry32( hash2( ( line.seed ^ SALT_ISLAND ) | 0, k ) ) );
    line.events.forEach( ( e, k ) => {
        if ( e.kind === 'jump' ) place( holeOf( e, k, rolls[ k ] ) );
    } );
    line.events.forEach( ( e, k ) => {
        if ( e.kind === 'strafe' ) place( islandOf( e, k, rolls[ k ] ) );
    } );
    line.events.forEach( ( e, k ) => {
        if ( e.kind === 'strafe' ) place( smashesOf( e, k ).find( fits ) );
    } );
    return placed.sort( ( a, b ) => a.z0 - b.z0 || a.x0 - b.x0 );
}
