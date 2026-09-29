import { type Anchor, type Segment, spanHasZ, type Track } from '@slur/shared';
import { PICKUP_CLEAR_REACH, PICKUP_CLEAR_STEP, PICKUP_DECK_TOLERANCE } from './pickup-reflections.constants';

export interface ClearBox {
    x0: number;
    x1: number;
    z0: number;
    z1: number;
}

export function deckInterval( seg: Segment, x: number, z: number, y: number ): [ number, number ] | null {
    const spans = seg.floors
        .filter( ( f ) => spanHasZ( seg, f, z ) && Math.abs( f.y - y ) <= PICKUP_DECK_TOLERANCE )
        .sort( ( a, b ) => a.x0 - b.x0 );
    let run: [ number, number ] | null = null;
    for ( const f of spans ) {
        if ( run && f.x0 <= run[ 1 ] + 1e-3 ) {
            run[ 1 ] = Math.max( run[ 1 ], f.x1 );
            continue;
        }
        if ( run && x >= run[ 0 ] && x <= run[ 1 ] ) return run;
        run = [ f.x0, f.x1 ];
    }
    return run && x >= run[ 0 ] && x <= run[ 1 ] ? run : null;
}

function march( track: Track, p: Anchor, dirZ: 1 | -1, box: ClearBox ): number {
    let seg = track.segmentAtZ( p.z );
    for ( let run = PICKUP_CLEAR_STEP; run <= PICKUP_CLEAR_REACH; run += PICKUP_CLEAR_STEP ) {
        const at = p.z + dirZ * run;
        if ( at < seg.z0 || at >= seg.z1 ) seg = track.segmentAtZ( at );
        const span = deckInterval( seg, p.x, at, p.y );
        if ( ! span ) return run - PICKUP_CLEAR_STEP;
        box.x0 = Math.max( box.x0, span[ 0 ] );
        box.x1 = Math.min( box.x1, span[ 1 ] );
    }
    return PICKUP_CLEAR_REACH;
}

export function clearBox( track: Track, p: Anchor ): ClearBox {
    const here = deckInterval( track.segmentAtZ( p.z ), p.x, p.z, p.y );
    if ( ! here ) return { x0: p.x, x1: p.x, z0: p.z, z1: p.z };
    const box = { x0: here[ 0 ], x1: here[ 1 ], z0: p.z, z1: p.z };
    box.z0 = p.z - march( track, p, -1, box );
    box.z1 = p.z + march( track, p, 1, box );
    return box;
}

export function placePickupEmitters( matrices: Float32Array, layout: readonly Anchor[], track: Track ): void {
    matrices.fill( 0 );
    for ( let i = 0; i < layout.length; i++ ) {
        const at = i * 16;
        const p = layout[ i ];
        const box = clearBox( track, p );
        matrices[ at ] = 1;
        matrices[ at + 4 ] = box.x0;
        matrices[ at + 5 ] = box.x1;
        matrices[ at + 6 ] = box.z0;
        matrices[ at + 7 ] = box.z1;
        matrices[ at + 12 ] = p.x;
        matrices[ at + 13 ] = p.y;
        matrices[ at + 14 ] = p.z;
        matrices[ at + 15 ] = 1;
    }
}

export function syncPickupEmitters(
    matrices: Float32Array,
    layout: readonly Anchor[],
    isTaken: ( id: string ) => boolean,
): boolean {
    let changed = false;
    for ( let i = 0; i < layout.length; i++ ) {
        const alive = isTaken( layout[ i ].id ) ? 0 : 1;
        const at = i * 16;
        if ( matrices[ at ] === alive ) continue;
        matrices[ at ] = alive;
        changed = true;
    }
    return changed;
}
