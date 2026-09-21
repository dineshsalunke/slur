export interface HitEvent {
    x: number;
    y: number;
    z: number;
}

const queue: HitEvent[] = [];
const MAX_QUEUED = 32;

export function pushHit( e: HitEvent ): void {
    queue.push( e );
    if ( queue.length > MAX_QUEUED ) queue.shift();
}

export function drainHits( sink: ( e: HitEvent ) => void ): void {
    for ( const e of queue ) sink( e );
    queue.length = 0;
}
