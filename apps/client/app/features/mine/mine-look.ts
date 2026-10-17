import { DEFAULT_SIM_CONFIG } from '@slur/shared';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const MAX_MINES = 64;

export const MINE_ARMED_GLOW = 1;
export const MINE_ARMING_GLOW = 0.25;
export const MINE_PULSE_HZ = 1.2;
export const MINE_PULSE_DEPTH = 0.45;
export const MINE_DECAL_INTENSITY = 2.2;
export const MINE_CORE_INTENSITY = 5;

const PICKUP_SPIKE_BASE = 0.3;
const PICKUP_SPIKE_LEN = 0.85;
const PICKUP_SPIKE_R = 0.2;
const PICKUP_CORE_R = 0.42;
const SEAM_R = 0.55;
const SEAM_TUBE = 0.045;

const BODY_TOP_R = 0.75;
const BODY_BOTTOM_R = 0.95;
const BODY_H = 0.4;
const BODY_SPIKE_R = 0.13;
const BODY_SPIKE_LEN = 0.3;
const BODY_CORE_R = 0.28;
const BODY_CORE_H = 0.32;

const DECAL_Y = 0.03;
const SPOKES = 6;
const SPOKE_IN = 1.25;
const SPOKE_W = 0.14;
const RING_W = 0.12;

const UP = new THREE.Vector3( 0, 1, 0 );

function merged( parts: THREE.BufferGeometry[] ): THREE.BufferGeometry {
    const flat = parts.map( ( p ) => ( p.index ? p.toNonIndexed() : p ) );
    const out = mergeGeometries( flat );
    for ( const p of [ ...parts, ...flat ] ) p.dispose();
    return out;
}

function spikeAlong( dir: THREE.Vector3, base: number, len: number, radius: number ): THREE.BufferGeometry {
    const cone = new THREE.ConeGeometry( radius, len, 4, 1 );
    cone.translate( 0, base + len / 2, 0 );
    cone.applyQuaternion( new THREE.Quaternion().setFromUnitVectors( UP, dir.clone().normalize() ) );
    return cone;
}

function icosaDirections(): THREE.Vector3[] {
    const ico = new THREE.IcosahedronGeometry( 1, 0 );
    const pos = ico.getAttribute( 'position' );
    const seen = new Map< string, THREE.Vector3 >();
    for ( let i = 0; i < pos.count; i++ ) {
        const v = new THREE.Vector3().fromBufferAttribute( pos, i );
        seen.set( `${ v.x.toFixed( 3 ) },${ v.y.toFixed( 3 ) },${ v.z.toFixed( 3 ) }`, v );
    }
    ico.dispose();
    return [ ...seen.values() ];
}

export function minePickupShellGeometry(): THREE.BufferGeometry {
    return merged(
        icosaDirections().map( ( d ) => spikeAlong( d, PICKUP_SPIKE_BASE, PICKUP_SPIKE_LEN, PICKUP_SPIKE_R ) ),
    );
}

export function minePickupGlyphGeometry(): THREE.BufferGeometry {
    const equator = new THREE.TorusGeometry( SEAM_R, SEAM_TUBE, 6, 32 );
    equator.rotateX( Math.PI / 2 );
    const meridian = new THREE.TorusGeometry( SEAM_R, SEAM_TUBE, 6, 32 );
    return merged( [ equator, meridian ] );
}

export function minePickupCoreGeometry(): THREE.BufferGeometry {
    return new THREE.IcosahedronGeometry( PICKUP_CORE_R, 1 );
}

export function mineReach(): number {
    return PICKUP_SPIKE_BASE + PICKUP_SPIKE_LEN;
}

function hingedAt( g: THREE.BufferGeometry, hinge: THREE.Vector3 | null ): THREE.BufferGeometry {
    const pos = g.getAttribute( 'position' );
    const out = new Float32Array( pos.count * 3 );
    for ( let i = 0; i < pos.count; i++ ) {
        if ( hinge ) hinge.toArray( out, i * 3 );
        else out.set( [ pos.getX( i ), pos.getY( i ), pos.getZ( i ) ], i * 3 );
    }
    g.setAttribute( 'aHinge', new THREE.BufferAttribute( out, 3 ) );
    return g;
}

export function mineBodyGeometry(): THREE.BufferGeometry {
    const puck = new THREE.CylinderGeometry( BODY_TOP_R, BODY_BOTTOM_R, BODY_H, 6, 1 );
    puck.translate( 0, BODY_H / 2, 0 );
    const spikes: THREE.BufferGeometry[] = [];
    for ( let i = 0; i < SPOKES; i++ ) {
        const a = ( i / SPOKES ) * Math.PI * 2;
        const dir = new THREE.Vector3( Math.cos( a ), 0.35, Math.sin( a ) );
        const spike = spikeAlong( dir, BODY_TOP_R, BODY_SPIKE_LEN, BODY_SPIKE_R );
        spike.translate( 0, BODY_H * 0.55, 0 );
        const hinge = dir
            .normalize()
            .multiplyScalar( BODY_TOP_R )
            .add( new THREE.Vector3( 0, BODY_H * 0.55, 0 ) );
        spikes.push( hingedAt( spike, hinge ) );
    }
    return merged( [ hingedAt( puck, null ), ...spikes ] );
}

export function mineCoreGeometry(): THREE.BufferGeometry {
    const dome = new THREE.ConeGeometry( BODY_CORE_R, BODY_CORE_H, 6, 1 );
    dome.translate( 0, BODY_H + BODY_CORE_H / 2, 0 );
    return dome;
}

function flatStrip( a: number, r0: number, r1: number, w: number ): THREE.BufferGeometry {
    const g = new THREE.PlaneGeometry( r1 - r0, w );
    g.rotateX( -Math.PI / 2 );
    g.translate( ( r0 + r1 ) / 2, 0, 0 );
    g.rotateY( a );
    return g;
}

export function mineDecalGeometry( triggerR = DEFAULT_SIM_CONFIG.mineTriggerR ): THREE.BufferGeometry {
    const parts: THREE.BufferGeometry[] = [];
    for ( let i = 0; i < SPOKES; i++ ) {
        parts.push( flatStrip( ( ( i + 0.5 ) / SPOKES ) * Math.PI * 2, SPOKE_IN, triggerR - RING_W, SPOKE_W ) );
    }
    const ring = new THREE.RingGeometry( triggerR - RING_W, triggerR, 48, 1 );
    ring.rotateX( -Math.PI / 2 );
    parts.push( ring );
    const out = merged( parts );
    out.translate( 0, DECAL_Y, 0 );
    return out;
}

export function mineGlow( armed: boolean, t: number, phase: number ): number {
    if ( ! armed ) return MINE_ARMING_GLOW;
    const wave = 0.5 + 0.5 * Math.sin( ( t * MINE_PULSE_HZ + phase ) * Math.PI * 2 );
    return MINE_ARMED_GLOW - MINE_PULSE_DEPTH * wave;
}
