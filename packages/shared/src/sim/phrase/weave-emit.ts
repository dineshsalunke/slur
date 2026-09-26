import { CELL } from '../../constants.js';
import type { GrooveBand } from '../groove/grammar.js';
import type { GrooveObstacle, ObstacleKind } from '../groove/islands.js';
import { hash2, mulberry32 } from '../rng.js';
import { HALF_WIDTH, lerp, MIN_LANE, SEG_LEN } from '../space.js';
import { leadDistance } from './pitch.js';

export type WeaveDivider = 'hole' | 'wall';

export interface WeaveSpec {
    act: GrooveBand;
    bands: number[];
    divider: WeaveDivider | null;
    gap: number;
    salt: number;
}

export interface WeaveBand {
    lo: number;
    hi: number;
}

interface Piece {
    kind: ObstacleKind;
    x0: number;
    x1: number;
}

export const WEAVE_BAND: Readonly< Record< GrooveBand, number > > = { low: 20, mid: 16, high: 14 };

export const WEAVE_PARALLEL: Readonly< Record< GrooveBand, { chance: number; bands: readonly number[] } > > = {
    low: { chance: 0, bands: [] },
    mid: { chance: 1 / 3, bands: [ 20, 16 ] },
    high: { chance: 1 / 2, bands: [ 16, 14 ] },
};

export const WEAVE_SLALOM_GAP = MIN_LANE;
export const WEAVE_POST_LEN = CELL;
export const WEAVE_FUNNEL = 2 * SEG_LEN;
export const WEAVE_GAPS: readonly number[] = [ 4, 6, 8 ];
export const WEAVE_WALL_MIN = 1;

const SALT_WEAVE = 0x6e3b1f27 | 0;
const SALT_WEAVE_LINE = 0x1f8d4ab3 | 0;

export function rollWeave( seed: number, act: GrooveBand, slot: number ): WeaveSpec {
    const rand = mulberry32( hash2( ( seed ^ SALT_WEAVE ) | 0, slot ) );
    const salt = hash2( ( seed ^ SALT_WEAVE_LINE ) | 0, slot );
    const parallel = WEAVE_PARALLEL[ act ];
    if ( rand() >= parallel.chance ) return { act, bands: [ WEAVE_BAND[ act ] ], divider: null, gap: 0, salt };
    const bands = rand() < 0.5 ? [ ...parallel.bands ] : [ ...parallel.bands ].reverse();
    const divider = rand() < 0.5 ? 'hole' : 'wall';
    const gap = WEAVE_GAPS[ Math.floor( rand() * WEAVE_GAPS.length ) ];
    return { act, bands, divider, gap, salt };
}

export function weaveOpenness( z0: number, z1: number, z: number ): number {
    return Math.max( 0, Math.min( 1, ( z - z0 ) / WEAVE_FUNNEL, ( z1 - z ) / WEAVE_FUNNEL ) );
}

export function weavePitch( spec: WeaveSpec, k: number ): number {
    return WEAVE_POST_LEN + leadDistance( spec.act, spec.bands[ k ] - WEAVE_SLALOM_GAP );
}

function rowCentre( z: number ): number {
    return Math.floor( z / CELL ) * CELL + CELL / 2;
}

export function weaveLanesAt( spec: WeaveSpec, z0: number, z1: number, z: number ): WeaveBand[] {
    const t = weaveOpenness( z0, z1, rowCentre( z ) );
    const half = ( spec.gap * t ) / 2;
    const single = spec.bands.length === 1;
    return spec.bands.map( ( w, k ) => {
        const lo = single || k === 0 ? -HALF_WIDTH : half;
        const hi = single || k === 1 ? HALF_WIDTH : -half;
        const at = single ? -w / 2 : k === 0 ? hi - w : lo;
        return {
            lo: Math.max( lo, Math.floor( lerp( lo, at, t ) ) ),
            hi: Math.min( hi, Math.ceil( lerp( hi, at + w, t ) ) ),
        };
    } );
}

export function weaveExitOffset( spec: WeaveSpec, x: number ): number {
    const lanes = weaveLanesAt( spec, 0, 4 * WEAVE_FUNNEL, 2 * WEAVE_FUNNEL );
    return Math.max( ...lanes.map( ( b ) => Math.abs( ( b.lo + b.hi ) / 2 - x ) ) );
}

function postSide( spec: WeaveSpec, z0: number, z1: number, k: number, z: number ): number | null {
    const start = z0 + WEAVE_FUNNEL;
    const end = z1 - WEAVE_FUNNEL;
    const zc = rowCentre( z );
    if ( zc < start || zc > end ) return null;
    const pitch = weavePitch( spec, k );
    const along = zc - start - pitch;
    if ( along < 0 || along % pitch >= WEAVE_POST_LEN ) return null;
    const i = Math.floor( along / pitch );
    if ( start + ( i + 1 ) * pitch + WEAVE_POST_LEN > end ) return null;
    return ( i + hash2( spec.salt, k ) ) & 1;
}

export function weaveBandsAt( spec: WeaveSpec, z0: number, z1: number, z: number ): WeaveBand[] {
    return weaveLanesAt( spec, z0, z1, z ).map( ( lane, k ) => {
        const side = postSide( spec, z0, z1, k, z );
        if ( side === null ) return lane;
        return side === 0
            ? { lo: lane.hi - WEAVE_SLALOM_GAP, hi: lane.hi }
            : { lo: lane.lo, hi: lane.lo + WEAVE_SLALOM_GAP };
    } );
}

function rowPieces( spec: WeaveSpec, z0: number, z1: number, z: number ): Piece[] {
    const lanes = weaveLanesAt( spec, z0, z1, z );
    const open = weaveBandsAt( spec, z0, z1, z );
    const holed = spec.divider === 'hole' && weaveOpenness( z0, z1, rowCentre( z ) ) === 1;
    const out: Piece[] = [];
    const block = ( x0: number, x1: number ): void => {
        if ( x1 - x0 >= WEAVE_WALL_MIN ) out.push( { kind: 'island', x0, x1 } );
    };
    let cursor = -HALF_WIDTH;
    lanes.forEach( ( lane, k ) => {
        block( cursor, lane.lo );
        block( lane.lo, open[ k ].lo );
        block( open[ k ].hi, lane.hi );
        cursor = lane.hi;
        if ( k === 0 && holed ) {
            block( cursor, -spec.gap / 2 );
            out.push( { kind: 'hole', x0: -spec.gap / 2, x1: spec.gap / 2 } );
            cursor = spec.gap / 2;
        }
    } );
    block( cursor, HALF_WIDTH );
    return out;
}

export function emitWeave( spec: WeaveSpec, z0: number, z1: number, event: number ): GrooveObstacle[] {
    const out: GrooveObstacle[] = [];
    let open = new Map< string, GrooveObstacle >();
    for ( let z = z0; z < z1; z += CELL ) {
        const next = new Map< string, GrooveObstacle >();
        for ( const p of rowPieces( spec, z0, z1, z ) ) {
            const key = `${ p.kind }:${ p.x0 }:${ p.x1 }`;
            const run = open.get( key );
            if ( run !== undefined ) {
                run.z1 = z + CELL;
                next.set( key, run );
            } else {
                const o = { ...p, z0: z, z1: z + CELL, event };
                out.push( o );
                next.set( key, o );
            }
        }
        open = next;
    }
    return out;
}
