import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const CUTS = 6;

function hash( n: number ): number {
    let h = Math.imul( n ^ 0x2c1b_3c6d, 0x297a_2d39 );
    h ^= h >>> 15;
    h = Math.imul( h, 0x85eb_ca6b );
    h ^= h >>> 13;
    return ( h >>> 0 ) / 0x1_0000_0000;
}

function lattice( seed: number, x: number, y: number, z: number ): number {
    return hash( seed ^ Math.imul( x, 0x1b87_3593 ) ^ Math.imul( y, 0x19b1_7e5d ) ^ Math.imul( z, 0x0cc9_e2d1 ) );
}

function smooth( t: number ): number {
    return t * t * ( 3 - 2 * t );
}

function valueNoise( seed: number, x: number, y: number, z: number ): number {
    const xi = Math.floor( x );
    const yi = Math.floor( y );
    const zi = Math.floor( z );
    const u = smooth( x - xi );
    const v = smooth( y - yi );
    const w = smooth( z - zi );
    let sum = 0;
    for ( let c = 0; c < 8; c++ ) {
        const dx = c & 1;
        const dy = ( c >> 1 ) & 1;
        const dz = ( c >> 2 ) & 1;
        const weight = ( dx ? u : 1 - u ) * ( dy ? v : 1 - v ) * ( dz ? w : 1 - w );
        sum += weight * lattice( seed, xi + dx, yi + dy, zi + dz );
    }
    return sum * 2 - 1;
}

function billow( seed: number, x: number, y: number, z: number ): number {
    let sum = 0;
    let amp = 0.5;
    let freq = 1;
    for ( let o = 0; o < 5; o++ ) {
        sum += amp * ( 1 - Math.abs( valueNoise( seed + o * 101, x * freq, y * freq, z * freq ) ) );
        amp *= 0.5;
        freq *= 2.1;
    }
    return sum;
}

interface Cut {
    nx: number;
    ny: number;
    nz: number;
    depth: number;
}

function cutsFor( seed: number ): Cut[] {
    const cuts: Cut[] = [];
    for ( let i = 0; i < CUTS; i++ ) {
        const theta = hash( seed + i * 17 ) * Math.PI * 2;
        const phi = Math.acos( hash( seed + i * 17 + 5 ) * 2 - 1 );
        cuts.push( {
            nx: Math.sin( phi ) * Math.cos( theta ),
            ny: Math.cos( phi ),
            nz: Math.sin( phi ) * Math.sin( theta ),
            depth: 0.62 + hash( seed + i * 17 + 9 ) * 0.22,
        } );
    }
    return cuts;
}

export function asteroidGeometry( seed: number, detail: number ): THREE.BufferGeometry {
    const ico = new THREE.IcosahedronGeometry( 1, detail );
    ico.deleteAttribute( 'normal' );
    ico.deleteAttribute( 'uv' );
    const geometry = mergeVertices( ico );
    ico.dispose();

    const cuts = cutsFor( seed );
    const position = geometry.getAttribute( 'position' ) as THREE.BufferAttribute;
    const v = new THREE.Vector3();

    for ( let i = 0; i < position.count; i++ ) {
        v.fromBufferAttribute( position, i ).normalize();
        const lumps = billow( seed, v.x * 1.6 + 3, v.y * 1.6 + 7, v.z * 1.6 + 11 );
        v.multiplyScalar( 0.72 + lumps * 0.5 );
        for ( const cut of cuts ) {
            const d = v.x * cut.nx + v.y * cut.ny + v.z * cut.nz;
            if ( d > cut.depth ) {
                const push = ( d - cut.depth ) * 0.85;
                v.set( v.x - cut.nx * push, v.y - cut.ny * push, v.z - cut.nz * push );
            }
        }
        position.setXYZ( i, v.x, v.y, v.z );
    }

    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
}
