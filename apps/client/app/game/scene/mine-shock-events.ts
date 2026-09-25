import type { MineEvent } from '@slur/shared';
import { pushHit } from './hit-events';

export interface MineShock {
    x: number;
    y: number;
    z: number;
    big: boolean;
}

const queue: MineShock[] = [];
const MAX_QUEUED = 16;

export function pushMineShock( e: MineShock ): void {
    queue.push( e );
    if ( queue.length > MAX_QUEUED ) queue.shift();
}

export function drainMineShocks( sink: ( e: MineShock ) => void ): void {
    for ( const e of queue ) sink( e );
    queue.length = 0;
}

export function burstMine( e: MineEvent ): void {
    pushMineShock( { x: e.x, y: e.y, z: e.z, big: e.outcome === 'trigger' } );
    if ( e.outcome === 'cleared' ) pushHit( { x: e.x, y: e.y + 0.5, z: e.z } );
}
