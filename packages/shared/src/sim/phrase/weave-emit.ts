import { CELL, type FlightTuning } from '../../constants.js';
import { ALL_CLASS_TUNINGS } from '../../ship-classes.js';
import type { GrooveBand } from '../groove/grammar.js';
import type { GrooveObstacle, ObstacleKind } from '../groove/islands.js';
import { hash2, mulberry32 } from '../rng.js';
import { HALF_WIDTH, MIN_LANE } from '../space.js';
import { classLead, leadDistance } from './pitch.js';

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
export const WEAVE_GAPS: readonly number[] = [ 4, 6, 8 ];
export const WEAVE_WALL_MIN = 1;

const SALT_WEAVE = 0x6e3b1f27 | 0;
const SALT_WEAVE_LINE = 0x1f8d4ab3 | 0;

const runUpMemo = new Map< string, number >();

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

export function weavePitch( spec: WeaveSpec, k: number ): number {
    return WEAVE_POST_LEN + leadDistance( spec.act, spec.bands[ k ] - WEAVE_SLALOM_GAP );
}

function rowCentre( z: number ): number {
    return Math.floor( z / CELL ) * CELL + CELL / 2;
}

export function weaveLanes( spec: WeaveSpec ): WeaveBand[] {
    const half = spec.gap / 2;
    if ( spec.bands.length === 1 ) return [ { lo: -spec.bands[ 0 ] / 2, hi: spec.bands[ 0 ] / 2 } ];
    return [
        { lo: -half - spec.bands[ 0 ], hi: -half },
        { lo: half, hi: half + spec.bands[ 1 ] },
    ];
}

function laneCentre( b: WeaveBand ): number {
    return ( b.lo + b.hi ) / 2;
}

function edgeLead( t: FlightTuning, act: GrooveBand, centres: readonly number[] ): number {
    const edge = HALF_WIDTH - t.halfW;
    return Math.max(
        ...[ -edge, edge ].map( ( x ) => {
            const c = centres.reduce( ( best, v ) => ( Math.abs( v - x ) < Math.abs( best - x ) ? v : best ) );
            return classLead( t, act, c - x, x );
        } ),
    );
}

export function weaveRunUp( spec: WeaveSpec ): number {
    const centres = weaveLanes( spec ).map( laneCentre );
    const key = `${ spec.act }:${ centres.join( ',' ) }`;
    let d = runUpMemo.get( key );
    if ( d === undefined ) {
        d =
            Math.ceil( Math.max( ...ALL_CLASS_TUNINGS.map( ( t ) => edgeLead( t, spec.act, centres ) ) ) / CELL ) *
            CELL;
        runUpMemo.set( key, d );
    }
    return d;
}

export function weaveExitOffset( spec: WeaveSpec, x: number ): number {
    return Math.max( ...weaveLanes( spec ).map( ( b ) => Math.abs( laneCentre( b ) - x ) ) );
}

function postSide( spec: WeaveSpec, z0: number, z1: number, k: number, z: number ): number | null {
    const zc = rowCentre( z );
    const pitch = weavePitch( spec, k );
    const along = zc - z0 - pitch;
    if ( along < 0 || along % pitch >= WEAVE_POST_LEN ) return null;
    const i = Math.floor( along / pitch );
    if ( z0 + ( i + 1 ) * pitch + WEAVE_POST_LEN > z1 ) return null;
    return ( i + hash2( spec.salt, k ) ) & 1;
}

export function weaveBandsAt( spec: WeaveSpec, z0: number, z1: number, z: number ): WeaveBand[] {
    return weaveLanes( spec ).map( ( lane, k ) => {
        const side = postSide( spec, z0, z1, k, z );
        if ( side === null ) return lane;
        return side === 0
            ? { lo: lane.hi - WEAVE_SLALOM_GAP, hi: lane.hi }
            : { lo: lane.lo, hi: lane.lo + WEAVE_SLALOM_GAP };
    } );
}

function rowPieces( spec: WeaveSpec, z0: number, z1: number, z: number ): Piece[] {
    const lanes = weaveLanes( spec );
    const open = weaveBandsAt( spec, z0, z1, z );
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
        if ( k === 0 && spec.divider === 'hole' ) {
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
