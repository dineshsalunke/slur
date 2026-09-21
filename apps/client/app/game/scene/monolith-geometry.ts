import * as THREE from 'three';

export interface MonolithProfile {
    taper: number;
    chamferX: number;
    chamferZ: number;
}

type Point = readonly [ number, number ];

const HALF = 0.5;

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
    out: number[],
    a: readonly number[],
    b: readonly number[],
    c: readonly number[],
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
    for ( const p of order ) out.push( p[ 0 ], p[ 1 ], p[ 2 ] );
}

export function monolithProfileGeometry( profile: MonolithProfile ): THREE.BufferGeometry {
    const ring = crossSection( profile.chamferX, profile.chamferZ );
    const { taper } = profile;
    const out: number[] = [];

    for ( let i = 0; i < ring.length; i++ ) {
        const [ x0, z0 ] = ring[ i ];
        const [ x1, z1 ] = ring[ ( i + 1 ) % ring.length ];
        const outward = [ z1 - z0, 0, -( x1 - x0 ) ];
        if ( outward[ 0 ] * ( x0 + x1 ) + outward[ 2 ] * ( z0 + z1 ) < 0 ) {
            outward[ 0 ] = -outward[ 0 ];
            outward[ 2 ] = -outward[ 2 ];
        }
        const b0 = [ x0, -HALF, z0 ];
        const b1 = [ x1, -HALF, z1 ];
        const t0 = [ x0 * taper, HALF, z0 * taper ];
        const t1 = [ x1 * taper, HALF, z1 * taper ];
        pushTriangle( out, b0, b1, t1, outward );
        pushTriangle( out, b0, t1, t0, outward );
    }

    for ( let i = 1; i < ring.length - 1; i++ ) {
        const cap = ( p: Point, y: number, s: number ) => [ p[ 0 ] * s, y, p[ 1 ] * s ];
        pushTriangle(
            out,
            cap( ring[ 0 ], HALF, taper ),
            cap( ring[ i ], HALF, taper ),
            cap( ring[ i + 1 ], HALF, taper ),
            [ 0, 1, 0 ],
        );
        pushTriangle(
            out,
            cap( ring[ 0 ], -HALF, 1 ),
            cap( ring[ i ], -HALF, 1 ),
            cap( ring[ i + 1 ], -HALF, 1 ),
            [ 0, -1, 0 ],
        );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( out, 3 ) );
    geometry.computeVertexNormals();
    return geometry;
}

const cache = new Map< string, THREE.BufferGeometry >();

export function monolithGeometry( profile: MonolithProfile ): THREE.BufferGeometry {
    const key = `${ profile.taper }:${ profile.chamferX }:${ profile.chamferZ }`;
    const hit = cache.get( key );
    if ( hit ) return hit;
    const geometry = monolithProfileGeometry( profile );
    cache.set( key, geometry );
    return geometry;
}
