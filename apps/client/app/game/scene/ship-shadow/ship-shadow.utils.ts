import { spanHasZ, type Track } from '@slur/shared';

export function floorBelow( track: Track, x: number, y: number, z: number ): number | null {
    const seg = track.segmentAtZ( z );
    let best: number | null = null;
    for ( const f of seg.floors ) {
        if ( ! spanHasZ( seg, f, z ) ) continue;
        if ( x < f.x0 || x > f.x1 ) continue;
        if ( f.y > y + 1e-3 ) continue;
        if ( best === null || f.y > best ) best = f.y;
    }
    return best;
}
