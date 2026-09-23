import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const MAX_BOLTS = 64;

export const BOLT_HOT = '#FFE0A0';
export const BOLT_STREAK_LENGTH = 42;
export const BOLT_HEAD_RADIUS = 0.3;
export const BOLT_TAIL_RADIUS = 0.05;
export const BOLT_STREAK_INTENSITY = 7;
export const BOLT_SHEATH_GIRTH = 4;
export const BOLT_SHEATH_INTENSITY = 0.9;

export const PICKUP_SHELL_COLOR = '#161b21';
export const PICKUP_SHELL_ROUGHNESS = 0.3;
export const PICKUP_GLYPH_INTENSITY = 3;
export const PICKUP_CORE_INTENSITY = 4.5;
export const PICKUP_HOVER = 2.4;
export const PICKUP_BOB = 0.22;
export const PICKUP_BOB_HZ = 0.55;
export const PICKUP_SPIN = 1.4;
export const PICKUP_POOL_RADIUS = 3.2;
export const PICKUP_POOL_INTENSITY = 0.55;

const HALF_W = 0.7;
const HALF_H = 1.3;
const SLAB = 0.26;
const BEVEL_DEPTH = 0.26;
const BEVEL_SIZE = 0.18;
const FACE_Z = SLAB / 2 + BEVEL_DEPTH;

function rhombus( hw: number, hh: number ): THREE.Shape {
    const s = new THREE.Shape();
    s.moveTo( 0, hh );
    s.lineTo( hw, 0 );
    s.lineTo( 0, -hh );
    s.lineTo( -hw, 0 );
    s.closePath();
    return s;
}

function rhombusHole( hw: number, hh: number ): THREE.Path {
    const p = new THREE.Path();
    p.moveTo( 0, hh );
    p.lineTo( -hw, 0 );
    p.lineTo( 0, -hh );
    p.lineTo( hw, 0 );
    p.closePath();
    return p;
}

function rhombusRing( outer: number, inner: number ): THREE.Shape {
    const s = rhombus( HALF_W * outer, HALF_H * outer );
    s.holes.push( rhombusHole( HALF_W * inner, HALF_H * inner ) );
    return s;
}

function onBothFaces( shape: THREE.Shape ): THREE.BufferGeometry[] {
    const front = new THREE.ShapeGeometry( shape ).toNonIndexed();
    front.translate( 0, 0, FACE_Z + 0.012 );
    const back = new THREE.ShapeGeometry( shape ).toNonIndexed();
    back.rotateY( Math.PI );
    back.translate( 0, 0, -FACE_Z - 0.012 );
    return [ front, back ];
}

export function boltPickupShellGeometry(): THREE.BufferGeometry {
    const g = new THREE.ExtrudeGeometry( rhombus( HALF_W, HALF_H ), {
        depth: SLAB,
        bevelEnabled: true,
        bevelThickness: BEVEL_DEPTH,
        bevelSize: BEVEL_SIZE,
        bevelSegments: 1,
        curveSegments: 1,
    } );
    g.translate( 0, 0, -SLAB / 2 );
    return g;
}

export function boltPickupGlyphGeometry(): THREE.BufferGeometry {
    const girdleOuter = 1 + ( BEVEL_SIZE + 0.05 ) / HALF_W;
    const girdle = new THREE.ExtrudeGeometry( rhombusRing( girdleOuter, 1 + BEVEL_SIZE / HALF_W - 0.02 ), {
        depth: 0.08,
        bevelEnabled: false,
        curveSegments: 1,
    } );
    girdle.translate( 0, 0, -0.04 );
    const parts = [ ...onBothFaces( rhombusRing( 0.82, 0.66 ) ), girdle ];
    const merged = mergeGeometries( parts );
    for ( const p of parts ) p.dispose();
    return merged;
}

export function boltPickupCoreGeometry(): THREE.BufferGeometry {
    const parts = onBothFaces( rhombus( HALF_W * 0.3, HALF_H * 0.42 ) );
    const merged = mergeGeometries( parts );
    for ( const p of parts ) p.dispose();
    return merged;
}

export function boltStreakGeometry(): THREE.BufferGeometry {
    const g = new THREE.CylinderGeometry( BOLT_HEAD_RADIUS, BOLT_TAIL_RADIUS, 1, 10, 6, false );
    g.rotateX( Math.PI / 2 );
    g.translate( 0, 0, -0.5 );
    const pos = g.getAttribute( 'position' );
    const axial = new Float32Array( pos.count );
    for ( let i = 0; i < pos.count; i++ ) axial[ i ] = -pos.getZ( i );
    g.setAttribute( 'aAxial', new THREE.BufferAttribute( axial, 1 ) );
    return g;
}
