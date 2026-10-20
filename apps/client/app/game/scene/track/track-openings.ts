import { type FloorSpan, isFullSpan, type Segment, spanZ0, spanZ1 } from '@slur/shared';

export interface SpanEdges {
    z0: number;
    z1: number;
    outer: boolean;
    capFront: boolean;
    capBack: boolean;
}

function abuts( other: Segment | null, f: FloorSpan, z: number, front: boolean ): boolean {
    if ( ! other ) return false;
    return other.floors.some( ( o ) => {
        if ( o.x0 > f.x0 + 1e-4 || o.x1 < f.x1 - 1e-4 ) return false;
        if ( Math.abs( o.y - f.y ) > 1e-4 ) return false;
        return Math.abs( ( front ? spanZ1( other, o ) : spanZ0( other, o ) ) - z ) < 1e-4;
    } );
}

export function spanEdges( seg: Segment, prev: Segment | null, next: Segment | null, f: FloorSpan ): SpanEdges {
    const z0 = spanZ0( seg, f );
    const z1 = spanZ1( seg, f );
    return {
        z0,
        z1,
        outer: isFullSpan( f ),
        capFront: z0 > seg.z0 + 1e-4 || ! abuts( prev, f, z0, true ),
        capBack: z1 < seg.z1 - 1e-4 || ! abuts( next, f, z1, false ),
    };
}
