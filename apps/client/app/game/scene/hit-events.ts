// One-shot hit-impact events, module-singleton queue (lives OUTSIDE React, like spectator.ts). The room→world
// bridge pushes an entry when the server broadcasts 'hit'; the <HitSpark> field drains it each frame to spawn a
// cosmetic burst. A queue (not React state) keeps the WebGL VFX fully imperative — zero re-render on a hit.
export interface HitEvent {
    x: number;
    y: number;
    z: number;
}

const queue: HitEvent[] = [];
const MAX_QUEUED = 32; // guard: drop the oldest if a burst of hits arrives faster than a frame drains them

export function pushHit( e: HitEvent ): void {
    queue.push( e );
    if ( queue.length > MAX_QUEUED ) queue.shift();
}

// Drain every pending hit into `sink` (called from HitSpark's useFrame), then clear. Empties on each frame so a
// brief unmount can't accumulate stale sparks beyond one frame's worth.
export function drainHits( sink: ( e: HitEvent ) => void ): void {
    for ( const e of queue ) sink( e );
    queue.length = 0;
}
