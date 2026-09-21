import { HALF_WIDTH, type Segment, type Track } from '@slur/shared';
import { BOUNDARY_H, BOUNDARY_W, isOuterEdge } from './track-geometry';

export interface RailRun {
    x: number;
    y: number;
    z0: number;
    z1: number;
}

function edgeHeight( seg: Segment, left: boolean ): number | null {
    for ( const f of seg.floors ) {
        const x = left ? f.x0 : f.x1;
        if ( isOuterEdge( x ) && ( left ? x < 0 : x > 0 ) ) return f.y;
    }
    return null;
}

export function buildRailRuns(
    track: Track,
    segments: number,
    w = BOUNDARY_W,
    h = BOUNDARY_H,
    lift = h / 2,
): RailRun[] {
    const runs: RailRun[] = [];
    const open: ( RailRun | null )[] = [ null, null ];

    for ( let i = 0; i < segments; i++ ) {
        const seg = track.segmentAt( i );
        for ( let side = 0; side < 2; side++ ) {
            const left = side === 0;
            const top = edgeHeight( seg, left );
            if ( top === null ) {
                open[ side ] = null;
                continue;
            }
            const y = top + lift;
            const cur = open[ side ];
            if ( cur && Math.abs( cur.z1 - seg.z0 ) < 1e-4 && Math.abs( cur.y - y ) < 1e-4 ) {
                cur.z1 = seg.z1;
                continue;
            }
            const run = { x: left ? -HALF_WIDTH - w / 2 : HALF_WIDTH + w / 2, y, z0: seg.z0, z1: seg.z1 };
            runs.push( run );
            open[ side ] = run;
        }
    }

    return runs;
}

export function railRunDistance( run: RailRun, z: number ): number {
    if ( z < run.z0 ) return run.z0 - z;
    if ( z > run.z1 ) return z - run.z1;
    return 0;
}
