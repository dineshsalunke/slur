import type { Block } from '@slur/shared';
import { blockWorld } from '../block-state';

const SPAWN_RANGE = 400;
const QUEUE_LIMIT = 16;

const seen = new Set< number >();
const queue: Block[] = [];

export function fractureYaw( id: number ): number {
    return ( Math.imul( id, 0x9e37_79b1 ) >>> 16 ) & 1 ? Math.PI : 0;
}

export function noteBreak( b: Block, fromZ: number ): void {
    if ( seen.has( b.id ) ) return;
    seen.add( b.id );
    if ( b.z0 - fromZ > SPAWN_RANGE || queue.length >= QUEUE_LIMIT ) return;
    queue.push( b );
}

export function forgetMended(): void {
    for ( const id of seen ) if ( ! blockWorld.broken.has( id ) ) seen.delete( id );
}

export function drainBreaks( sink: ( b: Block ) => void ): void {
    for ( const b of queue ) sink( b );
    queue.length = 0;
}
