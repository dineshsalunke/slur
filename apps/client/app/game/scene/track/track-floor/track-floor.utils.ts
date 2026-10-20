import { CELL, LEAD_SEGMENTS, SEG_LEN, type Track } from '@slur/shared';
import type * as THREE from 'three';
import {
    BACKWARD,
    DOWN,
    FORWARD,
    LEFT,
    packGeometry,
    pushQuad,
    RIGHT,
    SLAB_THICKNESS,
    UP,
    type V3,
} from '../track-geometry';
import { AHEAD } from '../track-instancing';
import { spanEdges } from '../track-openings';
import type { Buffers } from './track-floor';
import { FLOOR_SIDE_GROUP, FLOOR_TOP_GROUP } from './track-floor.constants';

export const buffers = (): Buffers => ( { pos: [], uv: [] } );

export const isOffGrid = ( v: number ) => {
    const m = Math.abs( v % CELL );
    return m > 1e-4 && Math.abs( m - CELL ) > 1e-4;
};

export function emitSpan(
    top: Buffers,
    sides: Buffers,
    span: { x0: number; x1: number; y: number },
    z0: number,
    z1: number,
    capFront: boolean,
    capBack: boolean,
): void {
    const { x0, x1 } = span;
    const t = span.y;
    const b = span.y - SLAB_THICKNESS;
    const { pos, uv } = sides;

    pushQuad( top.pos, top.uv, [ x0, t, z0 ], [ x0, t, z1 ], [ x1, t, z1 ], [ x1, t, z0 ], 'deck', UP );

    pushQuad( pos, uv, [ x0, b, z0 ], [ x0, t, z0 ], [ x0, t, z1 ], [ x0, b, z1 ], 'zy', LEFT );
    pushQuad( pos, uv, [ x1, t, z0 ], [ x1, b, z0 ], [ x1, b, z1 ], [ x1, t, z1 ], 'zy', RIGHT );

    const cap = ( z: number, n: V3 ) =>
        pushQuad( pos, uv, [ x0, b, z ], [ x1, b, z ], [ x1, t, z ], [ x0, t, z ], 'xy', n );
    if ( capFront ) cap( z0, BACKWARD );
    if ( capBack ) cap( z1, FORWARD );

    pushQuad( pos, uv, [ x0, b, z0 ], [ x0, b, z1 ], [ x1, b, z1 ], [ x1, b, z0 ], 'xz', DOWN );
}

export function packFloor( top: Buffers, sides: Buffers ): THREE.BufferGeometry {
    const geo = packGeometry( top.pos.concat( sides.pos ), top.uv.concat( sides.uv ) );
    const topCount = top.pos.length / 3;
    geo.addGroup( 0, topCount, FLOOR_TOP_GROUP );
    geo.addGroup( topCount, sides.pos.length / 3, FLOOR_SIDE_GROUP );
    return geo;
}

export function buildSpanGeometry( x0: number, x1: number, z0: number, z1: number ): THREE.BufferGeometry {
    const top = buffers();
    const sides = buffers();
    emitSpan( top, sides, { x0, x1, y: 0 }, z0, z1, true, true );
    return packFloor( top, sides );
}

export function segmentCount( track: Track ): number {
    return Math.round( track.finishZ / SEG_LEN ) + Math.ceil( AHEAD / SEG_LEN );
}

export function buildFloorGeometry( track: Track ): THREE.BufferGeometry {
    const top = buffers();
    const sides = buffers();
    const last = segmentCount( track );

    for ( let i = -LEAD_SEGMENTS; i < last; i++ ) {
        const seg = track.segmentAt( i );
        const prev = i > -LEAD_SEGMENTS ? track.segmentAt( i - 1 ) : null;
        const next = i < last - 1 ? track.segmentAt( i + 1 ) : null;

        for ( const f of seg.floors ) {
            if ( import.meta.env.DEV && ( isOffGrid( f.x0 ) || isOffGrid( f.x1 ) ) ) {
                console.warn( `[track-floor] seg ${ i } span not CELL-aligned: ${ f.x0 }..${ f.x1 }` );
            }
            const e = spanEdges( seg, prev, next, f );
            emitSpan( top, sides, f, e.z0, e.z1, e.capFront, e.capBack );
        }
    }

    return packFloor( top, sides );
}
