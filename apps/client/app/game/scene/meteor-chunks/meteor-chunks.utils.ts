import { mulberry32 } from '@slur/shared';
import type * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { addHullPoint, resetBody, setBoxInertia } from '../debris-physics';
import type { Chunk, ChunkBurst, Spawner } from './meteor-chunks';
import { BASE_COUNT, CARRY, COUNT_PER_SIZE, HULL_SHRINK, LIMIT, QUEUE } from './meteor-chunks.constants';
import { pending } from './meteor-chunks.state';

export function queueChunks( b: ChunkBurst ): void {
    if ( pending.length < QUEUE ) pending.push( b );
}

export function launch(
    c: Chunk,
    hull: readonly THREE.Vector3[],
    b: ChunkBurst,
    rand: () => number,
    now: number,
): void {
    const body = c.body;
    resetBody( body );
    const s = b.size * ( 0.07 + 0.15 * rand() * rand() );
    c.scale.set( s * ( 0.8 + 0.4 * rand() ), s * ( 0.55 + 0.35 * rand() ), s * ( 0.8 + 0.4 * rand() ) );
    c.born = now;
    for ( const p of hull ) {
        addHullPoint(
            body,
            p.x * c.scale.x * HULL_SHRINK,
            p.y * c.scale.y * HULL_SHRINK,
            p.z * c.scale.z * HULL_SHRINK,
        );
    }
    setBoxInertia( body, 2 * c.scale.x, 2 * c.scale.y, 2 * c.scale.z );
    const a = rand() * Math.PI * 2;
    const d = rand() * b.size * 0.5;
    body.p.set( b.x + Math.cos( a ) * d, b.y + c.scale.y * 1.2 + rand() * b.size * 0.3, b.z + Math.sin( a ) * d );
    const spray = num( 'Meteor.spray' );
    const out = spray * ( 0.3 + 0.9 * rand() );
    body.v.set(
        Math.cos( a ) * out + b.vx * CARRY * ( 0.6 + 0.8 * rand() ),
        spray * ( 0.45 + 0.7 * rand() ),
        Math.sin( a ) * out + b.vz * CARRY * ( 0.6 + 0.8 * rand() ),
    );
    body.w
        .set( rand() - 0.5, rand() - 0.5, rand() - 0.5 )
        .normalize()
        .multiplyScalar( ( 2 + 4 * rand() ) / Math.max( 0.6, s ) );
}

export function spawnPending( chunks: Chunk[], hull: readonly THREE.Vector3[], s: Spawner, now: number ): void {
    for ( const b of pending ) {
        const rand = mulberry32( Math.imul( s.seed++, 0x9e37_79b1 ) );
        const n = Math.round( ( BASE_COUNT + b.size * COUNT_PER_SIZE ) * num( 'Meteor.chunks' ) );
        for ( let k = 0; k < n; k++ ) {
            launch( chunks[ s.cursor ], hull, b, rand, now );
            s.cursor = ( s.cursor + 1 ) % LIMIT;
        }
    }
    pending.length = 0;
}
