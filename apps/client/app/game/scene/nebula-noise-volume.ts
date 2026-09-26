import * as THREE from 'three';

const SIZE = 64;
const PERIOD = 16;
const OCTAVES = 3;
const CHANNELS = 4;

function hash( x: number, y: number, z: number, seed: number ): number {
    let h = ( x * 374761393 + y * 668265263 + z * 2147483647 + seed * 1274126177 ) | 0;
    h = Math.imul( h ^ ( h >>> 13 ), 1274126177 );
    h ^= h >>> 16;
    return ( h >>> 0 ) / 4294967296;
}

function fade( t: number ): number {
    return t * t * t * ( t * ( t * 6 - 15 ) + 10 );
}

function valueNoise( x: number, y: number, z: number, period: number, seed: number ): number {
    const x0 = Math.floor( x );
    const y0 = Math.floor( y );
    const z0 = Math.floor( z );
    const fx = fade( x - x0 );
    const fy = fade( y - y0 );
    const fz = fade( z - z0 );
    const at = ( dx: number, dy: number, dz: number ) =>
        hash( ( x0 + dx ) % period, ( y0 + dy ) % period, ( z0 + dz ) % period, seed ) * 2 - 1;
    const lerp = ( a: number, b: number, t: number ) => a + ( b - a ) * t;
    return lerp(
        lerp( lerp( at( 0, 0, 0 ), at( 1, 0, 0 ), fx ), lerp( at( 0, 1, 0 ), at( 1, 1, 0 ), fx ), fy ),
        lerp( lerp( at( 0, 0, 1 ), at( 1, 0, 1 ), fx ), lerp( at( 0, 1, 1 ), at( 1, 1, 1 ), fx ), fy ),
        fz,
    );
}

function fbm( x: number, y: number, z: number, seed: number ): number {
    let sum = 0;
    let amp = 0.5;
    let period = PERIOD;
    for ( let i = 0; i < OCTAVES; i++ ) {
        const s = period / SIZE;
        sum += amp * valueNoise( x * s, y * s, z * s, period, seed + i * 17 );
        amp *= 0.5;
        period *= 2;
    }
    return sum;
}

let shared: THREE.Data3DTexture | null = null;

export function noiseVolume(): THREE.Data3DTexture {
    shared ??= createNoiseVolume();
    return shared;
}

function createNoiseVolume(): THREE.Data3DTexture {
    const data = new Uint8Array( SIZE * SIZE * SIZE * CHANNELS );
    let i = 0;
    for ( let z = 0; z < SIZE; z++ ) {
        for ( let y = 0; y < SIZE; y++ ) {
            for ( let x = 0; x < SIZE; x++ ) {
                for ( let c = 0; c < CHANNELS; c++ ) {
                    data[ i++ ] = Math.round(
                        THREE.MathUtils.clamp( fbm( x, y, z, c * 101 ) * 0.5 + 0.5, 0, 1 ) * 255,
                    );
                }
            }
        }
    }
    const texture = new THREE.Data3DTexture( data, SIZE, SIZE, SIZE );
    texture.format = THREE.RGBAFormat;
    texture.type = THREE.UnsignedByteType;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapR = THREE.RepeatWrapping;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
}
