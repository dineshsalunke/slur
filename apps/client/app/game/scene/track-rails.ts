import { HALF_WIDTH, isFullSpan, LEAD_SEGMENTS, type Segment, type Track } from '@slur/shared';
import { isOuterEdge, RAIL_W } from './track-geometry';

export interface RailRun {
    x: number;
    y: number;
    z0: number;
    z1: number;
}

function edgeHeight( seg: Segment, left: boolean ): number | null {
    for ( const f of seg.floors ) {
        if ( ! isFullSpan( f ) ) continue;
        const x = left ? f.x0 : f.x1;
        if ( isOuterEdge( x ) && ( left ? x < 0 : x > 0 ) ) return f.y;
    }
    return null;
}

export function buildRailRuns( track: Track, segments: number ): RailRun[] {
    const runs: RailRun[] = [];
    const open: ( RailRun | null )[] = [ null, null ];

    for ( let i = -LEAD_SEGMENTS; i < segments; i++ ) {
        const seg = track.segmentAt( i );
        for ( let side = 0; side < 2; side++ ) {
            const left = side === 0;
            const y = edgeHeight( seg, left );
            if ( y === null ) {
                open[ side ] = null;
                continue;
            }
            const cur = open[ side ];
            if ( cur && Math.abs( cur.z1 - seg.z0 ) < 1e-4 && Math.abs( cur.y - y ) < 1e-4 ) {
                cur.z1 = seg.z1;
                continue;
            }
            const x = ( left ? -1 : 1 ) * ( HALF_WIDTH + RAIL_W / 2 );
            const run = { x, y, z0: seg.z0, z1: seg.z1 };
            runs.push( run );
            open[ side ] = run;
        }
    }

    return runs;
}
