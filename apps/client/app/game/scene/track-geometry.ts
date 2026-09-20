// Quad primitives for the track's generated meshes, plus the boundary dimensions both meshes read.

import { HALF_WIDTH } from '@slur/shared';
import * as THREE from 'three';
import { PANEL_L, PANEL_W } from './track-texture';

export type V3 = readonly [ number, number, number ];
export type UvPlane = 'xz' | 'zy' | 'xy';

// Intended outward normals. Forward is +z.
export const UP: V3 = [ 0, 1, 0 ];
export const DOWN: V3 = [ 0, -1, 0 ];
export const LEFT: V3 = [ -1, 0, 0 ];
export const RIGHT: V3 = [ 1, 0, 0 ];
export const FORWARD: V3 = [ 0, 0, 1 ];
export const BACKWARD: V3 = [ 0, 0, -1 ];

export const BOUNDARY_W = 1.0;
/** Wrap down the outer face, so the strip turns the corner instead of foreshortening away. */
export const BOUNDARY_H = 1.0;

/** A = inboard bevel (ships today), B = outboard flare, C = A with the marigold ramped inward,
 *  D = outboard rail in `[HALF_WIDTH, HALF_WIDTH + w]`, which the deck's width never pays for. */
export type BoundaryVariant = 'A' | 'B' | 'C' | 'D';
export const BOUNDARY_VARIANT: BoundaryVariant = 'A';

export const isOutboard = ( v: BoundaryVariant ): boolean => v === 'B' || v === 'D';

/** D's `h` lifts the band above the deck (0 = flush); the others carry it downward. */
export const isRaised = ( v: BoundaryVariant ): boolean => v === 'D';

/** 1 at the track edge, 0 by `w` inward. Of x alone, so it survives `pushQuad` reordering vertices. */
export function inwardFalloff( w: number ): ( x: number ) => number {
    return ( x ) => Math.min( 1, Math.max( 0, 1 - ( HALF_WIDTH - Math.abs( x ) ) / w ) );
}

/** True at the track's own outer edge, where the boundary lives. Interior span edges are gap rims —
 *  board 24 panel 04 treats those as a separate element. */
export function isOuterEdge( x: number ): boolean {
    return Math.abs( Math.abs( x ) - HALF_WIDTH ) < 1e-4;
}

/** World position over PANEL size, so sides and caps match the top's grain instead of stretching. */
export function uvFor( p: V3, plane: UvPlane ): [ number, number ] {
    const [ x, y, z ] = p;
    if ( plane === 'xz' ) return [ x / PANEL_W, z / PANEL_L ];
    if ( plane === 'zy' ) return [ z / PANEL_L, y / PANEL_W ];
    return [ x / PANEL_W, y / PANEL_W ];
}

/** Two triangles wound so the face points along `normal` — computed, never hand-ordered: a hand-ordered
 *  inversion disappears under backface culling with every gate still green. */
export function pushQuad( pos: number[], uv: number[], a: V3, b: V3, c: V3, d: V3, plane: UvPlane, normal: V3 ): void {
    const ab: V3 = [ b[ 0 ] - a[ 0 ], b[ 1 ] - a[ 1 ], b[ 2 ] - a[ 2 ] ];
    const ac: V3 = [ c[ 0 ] - a[ 0 ], c[ 1 ] - a[ 1 ], c[ 2 ] - a[ 2 ] ];
    const cross: V3 = [
        ab[ 1 ] * ac[ 2 ] - ab[ 2 ] * ac[ 1 ],
        ab[ 2 ] * ac[ 0 ] - ab[ 0 ] * ac[ 2 ],
        ab[ 0 ] * ac[ 1 ] - ab[ 1 ] * ac[ 0 ],
    ];
    const dot = cross[ 0 ] * normal[ 0 ] + cross[ 1 ] * normal[ 1 ] + cross[ 2 ] * normal[ 2 ];
    const order = dot >= 0 ? [ a, b, c, a, c, d ] : [ a, d, c, a, c, b ];
    for ( const p of order ) {
        pos.push( p[ 0 ], p[ 1 ], p[ 2 ] );
        const [ u, v ] = uvFor( p, plane );
        uv.push( u, v );
    }
}

export function packGeometry( pos: number[], uv: number[], falloff?: ( x: number ) => number ): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute( 'position', new THREE.Float32BufferAttribute( pos, 3 ) );
    geo.setAttribute( 'uv', new THREE.Float32BufferAttribute( uv, 2 ) );
    if ( falloff ) {
        // `uv1` is the name `emissiveMap.channel = 1` reads; a custom attribute would need a shader patch.
        const ramp: number[] = [];
        for ( let i = 0; i < pos.length; i += 3 ) ramp.push( falloff( pos[ i ] ), 0.5 );
        geo.setAttribute( 'uv1', new THREE.Float32BufferAttribute( ramp, 2 ) );
    }
    geo.computeVertexNormals();
    return geo;
}
