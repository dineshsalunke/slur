// Quad primitives for the track's generated meshes, and the corner contract between the deck and its
// boundary strip: the deck omits exactly the facets the strip fills, so both must read the same numbers
// and the same edge rule. A contract shared by two files belongs in neither of them.

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
/** Wrap down the outer face, so the strip turns the corner instead of lying flat and foreshortening
 *  away at the chase angle. */
export const BOUNDARY_H = 1.0;

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

/**
 * Two triangles for a quad, wound so the face points along `normal` — computed, never hand-ordered:
 * a hand-ordered inversion disappears under backface culling with every gate still green.
 */
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

export function packGeometry( pos: number[], uv: number[] ): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute( 'position', new THREE.Float32BufferAttribute( pos, 3 ) );
    geo.setAttribute( 'uv', new THREE.Float32BufferAttribute( uv, 2 ) );
    geo.computeVertexNormals();
    return geo;
}
