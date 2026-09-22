import * as THREE from 'three';
import { hash01 } from './asteroid-field';

const TAU = Math.PI * 2;
const UNIT_RADIUS = 0.5;
const OCTAVES = 4;
const BASE_FREQUENCY = 3.7;
const FREQUENCY_STEP = 2.1;
const AMPLITUDE_FALLOFF = 0.5;
const DISPLACEMENT = 0.34;

const cache = new Map< string, THREE.BufferGeometry >();

function lumpiness( x: number, y: number, z: number, seed: number ): number {
    let sum = 0;
    let weight = 0;
    let amplitude = 1;
    let frequency = BASE_FREQUENCY;

    for ( let octave = 0; octave < OCTAVES; octave++ ) {
        sum +=
            amplitude *
            Math.sin( frequency * x + hash01( seed, octave * 3 + 1 ) * TAU ) *
            Math.sin( frequency * y + hash01( seed, octave * 3 + 2 ) * TAU ) *
            Math.sin( frequency * z + hash01( seed, octave * 3 + 3 ) * TAU );
        weight += amplitude;
        amplitude *= AMPLITUDE_FALLOFF;
        frequency *= FREQUENCY_STEP;
    }

    return sum / weight;
}

function build( variant: number, detail: number ): THREE.BufferGeometry {
    const geometry = new THREE.IcosahedronGeometry( UNIT_RADIUS, detail );
    const position = geometry.attributes.position;
    const seed = Math.imul( variant + 1, 0x27d4_eb2d ) ^ Math.imul( detail + 1, 0x1656_67b1 );

    for ( let i = 0; i < position.count; i++ ) {
        const x = position.getX( i );
        const y = position.getY( i );
        const z = position.getZ( i );
        const unit = 1 / UNIT_RADIUS;
        const scale = 1 + DISPLACEMENT * lumpiness( x * unit, y * unit, z * unit, seed );
        position.setXYZ( i, x * scale, y * scale, z * scale );
    }

    geometry.computeVertexNormals();
    return geometry;
}

export function asteroidGeometry( variant: number, detail: number ): THREE.BufferGeometry {
    const key = `${ variant }:${ detail }`;
    const hit = cache.get( key );
    if ( hit ) return hit;

    const made = build( variant, detail );
    cache.set( key, made );
    return made;
}
