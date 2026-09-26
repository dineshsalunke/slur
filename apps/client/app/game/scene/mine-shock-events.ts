import type { MineEvent } from '@slur/shared';
import { pushHit } from './hit-events';

export type ShockKind = 'big' | 'small' | 'fizzle';

export interface MineShock {
    x: number;
    y: number;
    z: number;
    kind: ShockKind;
}

const queue: MineShock[] = [];
const MAX_QUEUED = 16;
const SPARK_LIFT = 0.5;

export function pushMineShock( e: MineShock ): void {
    queue.push( e );
    if ( queue.length > MAX_QUEUED ) queue.shift();
}

export function drainMineShocks( sink: ( e: MineShock ) => void ): void {
    for ( const e of queue ) sink( e );
    queue.length = 0;
}

function kindOf( e: MineEvent ): ShockKind {
    if ( e.outcome === 'trigger' ) return 'big';
    return e.outcome === 'fizzle' ? 'fizzle' : 'small';
}

export function burstMine( e: MineEvent ): void {
    pushMineShock( { x: e.x, y: e.y, z: e.z, kind: kindOf( e ) } );
    if ( e.outcome === 'cleared' || e.outcome === 'fizzle' ) pushHit( { x: e.x, y: e.y + SPARK_LIFT, z: e.z } );
}
