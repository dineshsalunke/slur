// One-shot hit-impact events on a module-singleton queue, outside React. The room→world bridge pushes on a
// server 'hit'; <HitSpark> drains each frame. A queue rather than React state keeps the VFX re-render-free.
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

// Drain every pending hit into `sink`, then clear — so a brief unmount cannot accumulate stale sparks
// beyond one frame's worth.
export function drainHits( sink: ( e: HitEvent ) => void ): void {
    for ( const e of queue ) sink( e );
    queue.length = 0;
}
