import type { TugEvent } from '@slur/shared';
import { createEventQueue } from './event-queue';

const MAX_QUEUED = 16;
const queue = createEventQueue< TugEvent >( MAX_QUEUED );

export function pushTug( e: TugEvent ): void {
    queue.push( e );
}

export function drainTugs( sink: ( e: TugEvent ) => void ): void {
    queue.drain( sink );
}
