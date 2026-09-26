import type { TugEvent } from '@slur/shared';

const queue: TugEvent[] = [];
const MAX_QUEUED = 16;

export function pushTug( e: TugEvent ): void {
    queue.push( e );
    if ( queue.length > MAX_QUEUED ) queue.shift();
}

export function drainTugs( sink: ( e: TugEvent ) => void ): void {
    for ( const e of queue ) sink( e );
    queue.length = 0;
}
