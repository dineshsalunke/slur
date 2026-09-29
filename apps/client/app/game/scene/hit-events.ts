import { createEventQueue } from './event-queue';

export interface HitEvent {
    x: number;
    y: number;
    z: number;
}

const MAX_QUEUED = 32;
const queue = createEventQueue< HitEvent >( MAX_QUEUED );

export function pushHit( e: HitEvent ): void {
    queue.push( e );
}

export function drainHits( sink: ( e: HitEvent ) => void ): void {
    queue.drain( sink );
}
