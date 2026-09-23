import { type FloorSpan, type Segment, spanHasZ, spanZ0, spanZ1 } from './space.js';

export type Run = [ number, number ];

const SLICE_EPS = 1e-3;

export function sliceCentres( seg: Segment, z0 = seg.z0, z1 = seg.z1 ): number[] {
    const bounds: number[] = [ z0, z1 ];
    const edge = ( z: number ): void => {
        if ( z > z0 + SLICE_EPS && z < z1 - SLICE_EPS ) bounds.push( z );
    };
    for ( const b of seg.blocks ) {
        edge( b.z0 );
        edge( b.z1 );
    }
    for ( const f of seg.floors ) {
        edge( spanZ0( seg, f ) );
        edge( spanZ1( seg, f ) );
    }
    bounds.sort( ( a, b ) => a - b );
    const out: number[] = [];
    for ( let k = 1; k < bounds.length; k++ ) {
        if ( bounds[ k ] - bounds[ k - 1 ] > SLICE_EPS ) out.push( ( bounds[ k - 1 ] + bounds[ k ] ) / 2 );
    }
    return out;
}

function wallsOnSlice( seg: Segment, f: FloorSpan, zc: number ): Run[] {
    const walls: Run[] = [];
    for ( const b of seg.blocks ) {
        if ( b.z0 <= zc && zc < b.z1 ) {
            const lo = Math.max( f.x0, b.x0 );
            const hi = Math.min( f.x1, b.x1 );
            if ( hi > lo ) walls.push( [ lo, hi ] );
        }
    }
    walls.sort( ( a, b ) => a[ 0 ] - b[ 0 ] );
    return walls;
}

export function openRunsAtSlice( seg: Segment, zc: number ): Run[] {
    const runs: Run[] = [];
    for ( const f of seg.floors ) {
        if ( ! spanHasZ( seg, f, zc ) ) continue;
        let cursor = f.x0;
        for ( const [ lo, hi ] of wallsOnSlice( seg, f, zc ) ) {
            if ( lo > cursor ) runs.push( [ cursor, lo ] );
            cursor = Math.max( cursor, hi );
        }
        if ( f.x1 > cursor ) runs.push( [ cursor, f.x1 ] );
    }
    runs.sort( ( a, b ) => a[ 0 ] - b[ 0 ] );
    return runs;
}

export function intersectRuns( a: Run[], b: Run[] ): Run[] {
    const out: Run[] = [];
    for ( const [ a0, a1 ] of a ) {
        for ( const [ b0, b1 ] of b ) {
            const lo = Math.max( a0, b0 );
            const hi = Math.min( a1, b1 );
            if ( hi > lo ) out.push( [ lo, hi ] );
        }
    }
    return out;
}

function widestRun( runs: Run[] ): Run | null {
    let best: Run | null = null;
    for ( const r of runs ) {
        if ( best === null || r[ 1 ] - r[ 0 ] > best[ 1 ] - best[ 0 ] ) best = r;
    }
    return best;
}

export function passableCorridorWidth( seg: Segment ): number {
    if ( seg.floors.length === 0 ) return 0;
    let worst = Number.POSITIVE_INFINITY;
    for ( const zc of sliceCentres( seg ) ) {
        const widest = widestRun( openRunsAtSlice( seg, zc ) );
        worst = Math.min( worst, widest === null ? 0 : widest[ 1 ] - widest[ 0 ] );
    }
    return worst === Number.POSITIVE_INFINITY ? 0 : worst;
}

export function openCenterX( seg: Segment ): number {
    let common: Run[] | null = null;
    for ( const zc of sliceCentres( seg ) ) {
        const runs = openRunsAtSlice( seg, zc );
        common = common === null ? runs : intersectRuns( common, runs );
        if ( common.length === 0 ) break;
    }
    const threading = common !== null && common.length > 0;
    const runs = threading ? ( common as Run[] ) : openRunsAtSlice( seg, ( seg.z0 + seg.z1 ) / 2 );
    const widest = widestRun( runs );
    return widest === null ? 0 : ( widest[ 0 ] + widest[ 1 ] ) / 2;
}
