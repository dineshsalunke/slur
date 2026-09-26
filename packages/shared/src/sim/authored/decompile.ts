import { HALF_WIDTH, SEG_LEN, type Segment, spanZ0, spanZ1, type Track } from '../space.js';
import {
    AUTHORED_LEVEL_VERSION,
    type AuthoredBlock,
    type AuthoredLevel,
    type AuthoredRect,
    type AuthoredSource,
} from './authored-level.js';

export interface DecompileMeta {
    id: string;
    name?: string;
    source?: AuthoredSource | null;
    savedAt?: string;
}

interface Box {
    x0: number;
    x1: number;
    z0: number;
    z1: number;
}

type ZRange = [ number, number ];

function uncovered( z0: number, z1: number, cover: readonly ZRange[] ): ZRange[] {
    const out: ZRange[] = [];
    let z = z0;
    for ( const [ c0, c1 ] of [ ...cover ].sort( ( a, b ) => a[ 0 ] - b[ 0 ] ) ) {
        if ( c0 > z ) out.push( [ z, Math.min( c0, z1 ) ] );
        z = Math.max( z, c1 );
        if ( z >= z1 ) break;
    }
    if ( z < z1 ) out.push( [ z, z1 ] );
    return out.filter( ( [ a, b ] ) => b > a );
}

function segmentHoles( seg: Segment ): Box[] {
    const xs = [ ...new Set( [ -HALF_WIDTH, HALF_WIDTH, ...seg.floors.flatMap( ( f ) => [ f.x0, f.x1 ] ) ] ) ]
        .filter( ( x ) => x >= -HALF_WIDTH && x <= HALF_WIDTH )
        .sort( ( a, b ) => a - b );
    const holes: Box[] = [];
    for ( let k = 1; k < xs.length; k++ ) {
        const [ a, b ] = [ xs[ k - 1 ], xs[ k ] ];
        const cover = seg.floors
            .filter( ( f ) => f.x0 <= a && f.x1 >= b )
            .map( ( f ): ZRange => [ spanZ0( seg, f ), spanZ1( seg, f ) ] );
        for ( const [ z0, z1 ] of uncovered( seg.z0, seg.z1, cover ) ) holes.push( { x0: a, x1: b, z0, z1 } );
    }
    return mergeAcrossX( holes );
}

function mergeAcrossX( boxes: Box[] ): Box[] {
    const out: Box[] = [];
    for ( const b of [ ...boxes ].sort( ( p, q ) => p.z0 - q.z0 || p.z1 - q.z1 || p.x0 - q.x0 ) ) {
        const prev = out[ out.length - 1 ];
        if ( prev !== undefined && prev.z0 === b.z0 && prev.z1 === b.z1 && prev.x1 === b.x0 ) prev.x1 = b.x1;
        else out.push( { ...b } );
    }
    return out;
}

function mergeAcrossZ< T extends Box >( boxes: T[], joins: ( prev: T, next: T ) => boolean ): T[] {
    const out: T[] = [];
    for ( const b of [ ...boxes ].sort( ( p, q ) => p.x0 - q.x0 || p.x1 - q.x1 || p.z0 - q.z0 ) ) {
        const prev = out[ out.length - 1 ];
        if ( prev !== undefined && prev.x0 === b.x0 && prev.x1 === b.x1 && prev.z1 === b.z0 && joins( prev, b ) )
            prev.z1 = b.z1;
        else out.push( { ...b } );
    }
    return out;
}

function rectOf( b: Box ): AuthoredRect {
    return { x: b.x0, z: b.z0, w: b.x1 - b.x0, l: b.z1 - b.z0 };
}

export function decompileTrack( track: Track, meta: DecompileMeta ): AuthoredLevel {
    const length = Math.round( track.finishZ / SEG_LEN );
    const segments = Array.from( { length }, ( _, i ) => track.segmentAt( i ) );
    const blocks = mergeAcrossZ(
        segments.flatMap( ( s ) =>
            s.blocks.map( ( b ) => ( { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1, fractured: b.kind === 'fractured' } ) ),
        ),
        ( prev, next ) => prev.fractured === next.fractured && next.z0 % SEG_LEN === 0,
    );
    const gaps = mergeAcrossZ( segments.flatMap( segmentHoles ), () => true );
    const byZThenX = ( a: AuthoredRect, b: AuthoredRect ) => a.z - b.z || a.x - b.x;
    return {
        version: AUTHORED_LEVEL_VERSION,
        id: meta.id,
        name: meta.name ?? meta.id,
        length,
        source: meta.source ?? null,
        savedAt: meta.savedAt ?? '',
        blocks: blocks
            .map( ( b ): AuthoredBlock => ( { ...rectOf( b ), destructible: b.fractured } ) )
            .sort( byZThenX ),
        gaps: gaps.map( rectOf ).sort( byZThenX ),
    };
}
