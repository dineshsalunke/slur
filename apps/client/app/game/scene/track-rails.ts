import { HALF_WIDTH, type Segment, type Track } from '@slur/shared';
import { BOUNDARY_H, BOUNDARY_W, isOuterEdge } from './track-geometry';

/** One unbroken stretch of boundary strip, as the emitter array sees it: a line at fixed x and y. */
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

/**
 * The rails as light sources: static for the life of the track, because the strip is baked into the deck
 * and neither moves. A gap in the deck has no outer edge, so it ends the run rather than dimming it.
 *
 * `lift` must stay ABOVE the deck: a source in the deck's own plane lights it at exactly zero, so a strip
 * flush with the surface cannot illuminate it at all. ADR-012's outboard rail stands proud for this reason.
 */
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
            const run = { x: left ? -HALF_WIDTH + w / 2 : HALF_WIDTH - w / 2, y, z0: seg.z0, z1: seg.z1 };
            runs.push( run );
            open[ side ] = run;
        }
    }

    return runs;
}

/** Gap from `z` to the run's span, 0 while inside it — the ordering the K-nearest selection sorts on. */
export function railRunDistance( run: RailRun, z: number ): number {
    if ( z < run.z0 ) return run.z0 - z;
    if ( z > run.z1 ) return z - run.z1;
    return 0;
}
