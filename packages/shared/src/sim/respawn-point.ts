import type { FlightTuning } from '../constants.js';
import { intersectRuns, openRunsAtSlice, type Run, sliceCentres } from './clearance.js';
import { HALF_WIDTH, type Track } from './space.js';

const EDGE_CLEARANCE = 1e-3;

export interface RespawnPoint {
    x: number;
    z: number;
}

function footprintRuns( track: Track, z: number, halfL: number ): Run[] {
    const lo = z - halfL;
    const hi = z + halfL;
    let common: Run[] | null = null;
    for ( let i = track.segmentAtZ( lo ).index; i <= track.segmentAtZ( hi ).index; i++ ) {
        const seg = track.segmentAt( i );
        for ( const zc of sliceCentres( seg, Math.max( seg.z0, lo ), Math.min( seg.z1, hi ) ) ) {
            const runs = openRunsAtSlice( seg, zc );
            common = common === null ? runs : intersectRuns( common, runs );
            if ( common.length === 0 ) return common;
        }
    }
    return common ?? [];
}

function closer( a: number, b: number, anchor: number ): boolean {
    const da = Math.abs( a - anchor );
    const db = Math.abs( b - anchor );
    if ( da !== db ) return da < db;
    if ( Math.abs( a ) !== Math.abs( b ) ) return Math.abs( a ) < Math.abs( b );
    return a < b;
}

function nearestClearX( runs: Run[], anchor: number, halfW: number, limit: number ): number | null {
    let best: number | null = null;
    for ( const [ r0, r1 ] of runs ) {
        const lo = Math.max( -limit, r0 + halfW );
        const hi = Math.min( limit, r1 - halfW );
        if ( lo > hi ) continue;
        const x =
            anchor < lo
                ? Math.min( hi, lo + EDGE_CLEARANCE )
                : anchor > hi
                  ? Math.max( lo, hi - EDGE_CLEARANCE )
                  : anchor;
        if ( best === null || closer( x, best, anchor ) ) best = x;
    }
    return best;
}

export function respawnPoint( track: Track, x: number, z: number, t: FlightTuning ): RespawnPoint {
    const limit = HALF_WIDTH - t.halfW;
    const anchor = Math.min( limit, Math.max( -limit, x ) );
    const step = 2 * t.halfL;
    for ( let zc = z; ; zc -= step ) {
        const clear = nearestClearX( footprintRuns( track, zc, t.halfL ), anchor, t.halfW, limit );
        if ( clear !== null ) return { x: clear, z: zc };
        if ( zc <= 0 ) return { x: anchor, z: zc };
    }
}
