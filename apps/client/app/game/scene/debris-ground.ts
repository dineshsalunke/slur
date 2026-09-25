import { type Block, type Segment, segIndexForZ, spanHasZ, type Track } from '@slur/shared';
import type * as THREE from 'three';
import type { DebrisBody, DebrisGround } from './debris-physics';

const CACHE_LIMIT = 64;
const WALL_REACH = 0.55;
const WALL_SLIDE = 0.85;

function inside( b: Block, x: number, z: number ): boolean {
    return x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
}

function spanFloor( seg: Segment, x: number, z: number, top: number, best: number ): number {
    for ( const f of seg.floors ) {
        if ( x < f.x0 || x > f.x1 || f.y > top || f.y <= best ) continue;
        if ( spanHasZ( seg, f, z ) ) best = f.y;
    }
    return best;
}

function blockFloor(
    seg: Segment,
    broken: ReadonlySet< number >,
    x: number,
    z: number,
    top: number,
    best: number,
): number {
    for ( const b of seg.blocks ) {
        if ( b.y1 > top || b.y1 <= best || broken.has( b.id ) ) continue;
        if ( inside( b, x, z ) ) best = b.y1;
    }
    return best;
}

function bounceAxis( v: THREE.Vector3, axis: 'x' | 'z', into: number, bounce: number ): void {
    if ( v[ axis ] * into > 0 ) v[ axis ] = -v[ axis ] * bounce;
    v[ axis === 'x' ? 'z' : 'x' ] *= WALL_SLIDE;
}

function shove( body: DebrisBody, b: Block, bounce: number ): void {
    const p = body.p;
    const re = body.reach * WALL_REACH;
    if ( p.y - re >= b.y1 || p.y + re <= b.y0 ) return;
    const left = p.x - ( b.x0 - re );
    const right = b.x1 + re - p.x;
    const front = p.z - ( b.z0 - re );
    const back = b.z1 + re - p.z;
    const least = Math.min( left, right, front, back );
    if ( least <= 0 || b.y1 - ( p.y - re ) < least ) return;
    if ( least === left ) {
        p.x -= left;
        bounceAxis( body.v, 'x', 1, bounce );
    } else if ( least === right ) {
        p.x += right;
        bounceAxis( body.v, 'x', -1, bounce );
    } else if ( least === front ) {
        p.z -= front;
        bounceAxis( body.v, 'z', 1, bounce );
    } else {
        p.z += back;
        bounceAxis( body.v, 'z', -1, bounce );
    }
    body.w.multiplyScalar( WALL_SLIDE );
}

export function trackGround( track: Track, broken: ReadonlySet< number > ): DebrisGround {
    const cache = new Map< number, Segment >();

    const segment = ( i: number ): Segment => {
        const hit = cache.get( i );
        if ( hit ) return hit;
        if ( cache.size >= CACHE_LIMIT ) cache.clear();
        const made = track.segmentAt( i );
        cache.set( i, made );
        return made;
    };

    const floor = ( x: number, z: number, top: number ): number => {
        const i = segIndexForZ( z );
        let best = spanFloor( segment( i ), x, z, top, Number.NEGATIVE_INFINITY );
        for ( let k = i - 1; k <= i + 1; k++ ) best = blockFloor( segment( k ), broken, x, z, top, best );
        return best;
    };

    const walls = ( body: DebrisBody, bounce: number ): void => {
        const i = segIndexForZ( body.p.z );
        for ( let k = i - 1; k <= i + 1; k++ ) {
            for ( const b of segment( k ).blocks ) if ( ! broken.has( b.id ) ) shove( body, b, bounce );
        }
    };

    return { floor, walls };
}
