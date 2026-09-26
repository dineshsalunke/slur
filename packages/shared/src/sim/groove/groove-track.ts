import { placePickups } from '../pickup-place.js';
import { segmentsTrack } from '../score/emit.js';
import {
    type Anchor,
    BLOCK_HEIGHT,
    type Block,
    blockId,
    type FloorSpan,
    fullFloor,
    HALF_WIDTH,
    SEG_LEN,
    type Segment,
    START_SAFE,
    TRACK_SEGMENTS,
    type Track,
} from '../space.js';
import { type GrooveObstacle, placeObstacles } from './islands.js';
import { composeGroove, type GrooveLine } from './line.js';

export interface GrooveBuild {
    line: GrooveLine;
    obstacles: GrooveObstacle[];
    segments: Segment[];
    anchors: Anchor[];
}

type ZRange = [ number, number ];

function subtractZ( z0: number, z1: number, cuts: readonly ZRange[] ): ZRange[] {
    let out: ZRange[] = [ [ z0, z1 ] ];
    for ( const [ c0, c1 ] of cuts ) {
        const next: ZRange[] = [];
        for ( const [ a, b ] of out ) {
            if ( c1 <= a || c0 >= b ) {
                next.push( [ a, b ] );
                continue;
            }
            if ( c0 > a ) next.push( [ a, c0 ] );
            if ( c1 < b ) next.push( [ c1, b ] );
        }
        out = next;
    }
    return out;
}

export function holeFloors( z0: number, z1: number, holes: readonly GrooveObstacle[] ): FloorSpan[] {
    if ( holes.length === 0 ) return fullFloor( 0 );
    const xs = [ ...new Set( [ -HALF_WIDTH, HALF_WIDTH, ...holes.flatMap( ( h ) => [ h.x0, h.x1 ] ) ] ) ].sort(
        ( a, b ) => a - b,
    );
    const out: FloorSpan[] = [];
    for ( let k = 1; k < xs.length; k++ ) {
        const [ a, b ] = [ xs[ k - 1 ], xs[ k ] ];
        const cuts = holes.filter( ( h ) => h.x0 <= a && h.x1 >= b ).map( ( h ): ZRange => [ h.z0, h.z1 ] );
        if ( cuts.length === 0 ) {
            const prev = out[ out.length - 1 ];
            if ( prev !== undefined && prev.z0 === undefined && prev.x1 === a ) prev.x1 = b;
            else out.push( { x0: a, x1: b, y: 0 } );
            continue;
        }
        for ( const [ s0, s1 ] of subtractZ( z0, z1, cuts ) ) out.push( { x0: a, x1: b, y: 0, z0: s0, z1: s1 } );
    }
    return out;
}

function clipZ( o: GrooveObstacle, z0: number, z1: number ): GrooveObstacle | null {
    const lo = Math.max( o.z0, z0 );
    const hi = Math.min( o.z1, z1 );
    return hi > lo ? { ...o, z0: lo, z1: hi } : null;
}

export function segmentOf( i: number, obstacles: readonly GrooveObstacle[] ): Segment {
    const z0 = i * SEG_LEN;
    const z1 = z0 + SEG_LEN;
    const base = { index: i, z0, z1, isFinish: false };
    if ( i < START_SAFE ) return { ...base, kind: 'plain', floors: fullFloor( 0 ), blocks: [] };
    const here = obstacles.map( ( o ) => clipZ( o, z0, z1 ) ).filter( ( o ) => o !== null );
    const holes = here.filter( ( o ) => o.kind === 'hole' );
    const blocks: Block[] = here
        .filter( ( o ) => o.kind !== 'hole' )
        .map( ( o, k ) => ( {
            id: blockId( i, k ),
            kind: o.kind === 'smash' ? 'fractured' : 'sealed',
            x0: o.x0,
            x1: o.x1,
            y0: 0,
            y1: BLOCK_HEIGHT,
            z0: o.z0,
            z1: o.z1,
        } ) );
    return {
        ...base,
        kind: holes.length > 0 ? 'gap' : blocks.length > 0 ? 'block' : 'plain',
        floors: holeFloors( z0, z1, holes ),
        blocks,
    };
}

export function buildGroove( seed: number, length: number = TRACK_SEGMENTS ): GrooveBuild {
    const line = composeGroove( seed, length );
    const obstacles = placeObstacles( line );
    const segments = Array.from( { length }, ( _, i ) => segmentOf( i, obstacles ) );
    const anchors = placePickups( seed, length, ( i ) => segments[ i ] );
    return { line, obstacles, segments, anchors };
}

export function grooveTrack( seed: number, length: number = TRACK_SEGMENTS ): Track {
    const { segments, anchors } = buildGroove( seed, length );
    return { ...segmentsTrack( segments, length ), anchors };
}
