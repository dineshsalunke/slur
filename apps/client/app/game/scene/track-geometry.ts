import { HALF_WIDTH } from '@slur/shared';
import * as THREE from 'three';
import { TEX_SPAN_X, TEX_SPAN_Z } from './track-texture';

export type V3 = readonly [ number, number, number ];
export type UvPlane = 'xz' | 'zy' | 'xy';

export const UP: V3 = [ 0, 1, 0 ];
export const DOWN: V3 = [ 0, -1, 0 ];
export const LEFT: V3 = [ -1, 0, 0 ];
export const RIGHT: V3 = [ 1, 0, 0 ];
export const FORWARD: V3 = [ 0, 0, 1 ];
export const BACKWARD: V3 = [ 0, 0, -1 ];

export const SLAB_THICKNESS = 24;

export const RAIL_W = 2.0;
export const RAIL_EMISSIVE_SHARE = 0.125;
export const RAIL_MARGIN = ( RAIL_W * ( 1 - RAIL_EMISSIVE_SHARE ) ) / 2;

export function isOuterEdge( x: number ): boolean {
    return Math.abs( Math.abs( x ) - HALF_WIDTH ) < 1e-4;
}

export function uvFor( p: V3, plane: UvPlane ): [ number, number ] {
    const [ x, y, z ] = p;
    if ( plane === 'xz' ) return [ x / TEX_SPAN_X, z / TEX_SPAN_Z ];
    if ( plane === 'zy' ) return [ z / TEX_SPAN_Z, y / TEX_SPAN_X ];
    return [ x / TEX_SPAN_X, y / TEX_SPAN_X ];
}

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
