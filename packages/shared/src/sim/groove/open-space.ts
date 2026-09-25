import { openRunsAtSlice, type Run } from '../clearance.js';
import {
    type Block,
    HALF_WIDTH,
    MIN_LANE,
    SEG_LEN,
    type Segment,
    START_SAFE,
    segIndexForZ,
    type Track,
} from '../space.js';

export const OPEN_TARGETS = {
    wideLanes: 5,
    wideShare: 0.8,
    minLanes: 2,
    narrowLanes: 4,
    longestNarrow: 60,
    longestWall: 60,
    arenaLen: 240,
    arenaSpacing: 1200,
} as const;

export interface OpenSpaceReport {
    wideShare: number;
    minLanes: number;
    longestNarrow: number;
    longestWall: number;
    longestArenaGap: number;
    arenas: number;
}

const RUN_EPS = 1e-6;
const FULL_WIDTH = 2 * HALF_WIDTH;

function mergedRuns( runs: Run[] ): Run[] {
    const out: Run[] = [];
    for ( const [ lo, hi ] of runs ) {
        const prev = out[ out.length - 1 ];
        if ( prev !== undefined && lo <= prev[ 1 ] + RUN_EPS ) prev[ 1 ] = Math.max( prev[ 1 ], hi );
        else out.push( [ lo, hi ] );
    }
    return out;
}

export function openWidthAt( seg: Segment, z: number ): number {
    let w = 0;
    for ( const [ lo, hi ] of mergedRuns( openRunsAtSlice( seg, z ) ) ) if ( hi - lo >= MIN_LANE ) w += hi - lo;
    return w;
}

function trackBlocks( track: Track, segs: Segment[] ): Block[] {
    const out: Block[] = [];
    for ( const s of segs ) if ( s.z0 < track.finishZ ) out.push( ...s.blocks );
    return out;
}

export function longestWallRun( blocks: readonly Block[] ): number {
    const sorted = [ ...blocks ].sort( ( a, b ) => a.z0 - b.z0 );
    const parent = sorted.map( ( _, k ) => k );
    const find = ( k: number ): number => {
        while ( parent[ k ] !== k ) {
            parent[ k ] = parent[ parent[ k ] ];
            k = parent[ k ];
        }
        return k;
    };
    for ( let a = 0; a < sorted.length; a++ ) {
        for ( let b = a + 1; b < sorted.length && sorted[ b ].z0 < sorted[ a ].z1 + MIN_LANE; b++ ) {
            const A = sorted[ a ];
            const B = sorted[ b ];
            if ( A.x0 < B.x1 && B.x0 < A.x1 ) parent[ find( b ) ] = find( a );
        }
    }
    const lo = new Map< number, number >();
    const hi = new Map< number, number >();
    sorted.forEach( ( blk, k ) => {
        const r = find( k );
        lo.set( r, Math.min( lo.get( r ) ?? blk.z0, blk.z0 ) );
        hi.set( r, Math.max( hi.get( r ) ?? blk.z1, blk.z1 ) );
    } );
    let best = 0;
    for ( const [ r, z0 ] of lo ) best = Math.max( best, ( hi.get( r ) ?? z0 ) - z0 );
    return best;
}

export function openSpace( track: Track, dz = 1 ): OpenSpaceReport {
    const z0 = START_SAFE * SEG_LEN;
    const segs: Segment[] = [];
    for ( let i = 0; i * SEG_LEN < track.finishZ; i++ ) segs.push( track.segmentAt( i ) );
    let samples = 0;
    let wide = 0;
    let minLanes = Number.POSITIVE_INFINITY;
    let narrowRun = 0;
    let longestNarrow = 0;
    let fullStart: number | null = null;
    let lastArenaEnd = z0;
    let longestArenaGap = 0;
    let arenas = 0;
    const closeFull = ( end: number ): void => {
        if ( fullStart !== null && end - fullStart >= OPEN_TARGETS.arenaLen ) {
            longestArenaGap = Math.max( longestArenaGap, fullStart - lastArenaEnd );
            lastArenaEnd = end;
            arenas++;
        }
        fullStart = null;
    };
    for ( let z = z0 + dz / 2; z < track.finishZ; z += dz ) {
        const lanes = openWidthAt( segs[ segIndexForZ( z ) ], z ) / MIN_LANE;
        samples++;
        if ( lanes >= OPEN_TARGETS.wideLanes ) wide++;
        minLanes = Math.min( minLanes, lanes );
        narrowRun = lanes < OPEN_TARGETS.narrowLanes ? narrowRun + dz : 0;
        longestNarrow = Math.max( longestNarrow, narrowRun );
        const full = lanes * MIN_LANE >= FULL_WIDTH - RUN_EPS;
        if ( full && fullStart === null ) fullStart = z - dz / 2;
        if ( ! full ) closeFull( z - dz / 2 );
    }
    closeFull( track.finishZ );
    longestArenaGap = Math.max( longestArenaGap, track.finishZ - lastArenaEnd );
    return {
        wideShare: samples === 0 ? 0 : wide / samples,
        minLanes: samples === 0 ? 0 : minLanes,
        longestNarrow,
        longestWall: longestWallRun( trackBlocks( track, segs ) ),
        longestArenaGap,
        arenas,
    };
}

export function openSpaceFailures( r: OpenSpaceReport ): string[] {
    const out: string[] = [];
    if ( r.wideShare < OPEN_TARGETS.wideShare ) out.push( `wideShare ${ r.wideShare.toFixed( 3 ) }` );
    if ( r.minLanes < OPEN_TARGETS.minLanes ) out.push( `minLanes ${ r.minLanes.toFixed( 2 ) }` );
    if ( r.longestNarrow > OPEN_TARGETS.longestNarrow ) out.push( `longestNarrow ${ r.longestNarrow }` );
    if ( r.longestWall > OPEN_TARGETS.longestWall ) out.push( `longestWall ${ r.longestWall }` );
    if ( r.longestArenaGap > OPEN_TARGETS.arenaSpacing ) out.push( `longestArenaGap ${ r.longestArenaGap }` );
    return out;
}
