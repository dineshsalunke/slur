import * as THREE from 'three';
import { TEX_SPAN_X } from './track-texture';

export interface MonolithProfile {
    taper: number;
    chamferX: number;
    chamferZ: number;
}

export type MonolithSize = readonly [ number, number, number ];

type Point = readonly [ number, number ];
type Vertex = readonly [ number, number, number, number, number ];

const HALF = 0.5;
const UNIT_SIZE: MonolithSize = [ 1, 1, 1 ];

export function crossSection( chamferX: number, chamferZ: number ): Point[] {
    const cx = Math.min( Math.max( chamferX, 0 ), HALF );
    const cz = Math.min( Math.max( chamferZ, 0 ), HALF );
    if ( cx === 0 || cz === 0 ) {
        return [
            [ HALF, HALF ],
            [ -HALF, HALF ],
            [ -HALF, -HALF ],
            [ HALF, -HALF ],
        ];
    }
    return [
        [ HALF, HALF - cz ],
        [ HALF - cx, HALF ],
        [ -( HALF - cx ), HALF ],
        [ -HALF, HALF - cz ],
        [ -HALF, -( HALF - cz ) ],
        [ -( HALF - cx ), -HALF ],
        [ HALF - cx, -HALF ],
        [ HALF, -( HALF - cz ) ],
    ];
}

function pushTriangle(
    pos: number[],
    uv: number[],
    a: Vertex,
    b: Vertex,
    c: Vertex,
    outward: readonly number[],
): void {
    const ab = [ b[ 0 ] - a[ 0 ], b[ 1 ] - a[ 1 ], b[ 2 ] - a[ 2 ] ];
    const ac = [ c[ 0 ] - a[ 0 ], c[ 1 ] - a[ 1 ], c[ 2 ] - a[ 2 ] ];
    const n = [
        ab[ 1 ] * ac[ 2 ] - ab[ 2 ] * ac[ 1 ],
        ab[ 2 ] * ac[ 0 ] - ab[ 0 ] * ac[ 2 ],
        ab[ 0 ] * ac[ 1 ] - ab[ 1 ] * ac[ 0 ],
    ];
    const facing = n[ 0 ] * outward[ 0 ] + n[ 1 ] * outward[ 1 ] + n[ 2 ] * outward[ 2 ];
    const order = facing >= 0 ? [ a, b, c ] : [ a, c, b ];
    for ( const p of order ) {
        pos.push( p[ 0 ], p[ 1 ], p[ 2 ] );
        uv.push( p[ 3 ], p[ 4 ] );
    }
}

export function monolithProfileGeometry(
    profile: MonolithProfile,
    size: MonolithSize = UNIT_SIZE,
): THREE.BufferGeometry {
    const ring = crossSection( profile.chamferX, profile.chamferZ );
    const { taper } = profile;
    const [ sx, sy, sz ] = size;
    const pos: number[] = [];
    const uv: number[] = [];
    let along = 0;

    for ( let i = 0; i < ring.length; i++ ) {
        const [ x0, z0 ] = ring[ i ];
        const [ x1, z1 ] = ring[ ( i + 1 ) % ring.length ];
        const outward = [ z1 - z0, 0, -( x1 - x0 ) ];
        if ( outward[ 0 ] * ( x0 + x1 ) + outward[ 2 ] * ( z0 + z1 ) < 0 ) {
            outward[ 0 ] = -outward[ 0 ];
            outward[ 2 ] = -outward[ 2 ];
        }
        const u0 = along / TEX_SPAN_X;
        along += Math.hypot( ( x1 - x0 ) * sx, ( z1 - z0 ) * sz );
        const u1 = along / TEX_SPAN_X;
        const vTop = sy / TEX_SPAN_X;

        const b0: Vertex = [ x0, -HALF, z0, u0, 0 ];
        const b1: Vertex = [ x1, -HALF, z1, u1, 0 ];
        const t0: Vertex = [ x0 * taper, HALF, z0 * taper, u0, vTop ];
        const t1: Vertex = [ x1 * taper, HALF, z1 * taper, u1, vTop ];
        pushTriangle( pos, uv, b0, b1, t1, outward );
        pushTriangle( pos, uv, b0, t1, t0, outward );
    }

    for ( let i = 1; i < ring.length - 1; i++ ) {
        const cap = ( p: Point, y: number, s: number ): Vertex => [
            p[ 0 ] * s,
            y,
            p[ 1 ] * s,
            ( p[ 0 ] * s * sx ) / TEX_SPAN_X,
            ( p[ 1 ] * s * sz ) / TEX_SPAN_X,
        ];
        pushTriangle(
            pos,
            uv,
            cap( ring[ 0 ], HALF, taper ),
            cap( ring[ i ], HALF, taper ),
            cap( ring[ i + 1 ], HALF, taper ),
            [ 0, 1, 0 ],
        );
        pushTriangle(
            pos,
            uv,
            cap( ring[ 0 ], -HALF, 1 ),
            cap( ring[ i ], -HALF, 1 ),
            cap( ring[ i + 1 ], -HALF, 1 ),
            [ 0, -1, 0 ],
        );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( pos, 3 ) );
    geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( uv, 2 ) );
    geometry.computeVertexNormals();
    return geometry;
}

const cache = new Map< string, THREE.BufferGeometry >();

export function monolithGeometry( profile: MonolithProfile, size: MonolithSize = UNIT_SIZE ): THREE.BufferGeometry {
    const key = `${ profile.taper }:${ profile.chamferX }:${ profile.chamferZ }:${ size.join( ',' ) }`;
    const hit = cache.get( key );
    if ( hit ) return hit;
    const geometry = monolithProfileGeometry( profile, size );
    cache.set( key, geometry );
    return geometry;
}
