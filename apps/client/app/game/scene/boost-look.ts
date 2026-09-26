import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const BOOST_STREAK_LENGTH = 16;
export const BOOST_STREAK_WIDTH = 0.9;
export const BOOST_STREAK_INTENSITY = 5;
export const BOOST_STREAK_LIFT = 0.35;
export const BOOST_STREAK_SPREAD = 0.5;

const HALF_H = 1;
const DRIFT = 0.8;
const STROKE = 0.5;
const PITCH = 0.9;
const SLAB = 0.26;
const BEVEL_DEPTH = 0.2;
const BEVEL_SIZE = 0.1;
const FACE_Z = SLAB / 2 + BEVEL_DEPTH;
const CENTRES = [ -PITCH / 2, PITCH / 2 ];

function chevron( c: number, scale: number, stroke: number ): THREE.Shape {
    const h = HALF_H * scale;
    const d = ( DRIFT * scale ) / 2;
    const s = stroke / 2;
    const shape = new THREE.Shape();
    shape.moveTo( c - d + s, h );
    shape.lineTo( c + d + s, 0 );
    shape.lineTo( c - d + s, -h );
    shape.lineTo( c - d - s, -h );
    shape.lineTo( c + d - s, 0 );
    shape.lineTo( c - d - s, h );
    shape.closePath();
    return shape;
}

function pair( scale: number, stroke: number ): THREE.Shape[] {
    return CENTRES.map( ( c ) => chevron( c, scale, stroke ) );
}

function onBothFaces( shapes: THREE.Shape[] ): THREE.BufferGeometry {
    const front = new THREE.ShapeGeometry( shapes ).toNonIndexed();
    front.translate( 0, 0, FACE_Z + 0.012 );
    const back = new THREE.ShapeGeometry( shapes ).toNonIndexed();
    back.rotateY( Math.PI );
    back.translate( 0, 0, -FACE_Z - 0.012 );
    const merged = mergeGeometries( [ front, back ] );
    front.dispose();
    back.dispose();
    return merged;
}

export function boostPickupShellGeometry(): THREE.BufferGeometry {
    const g = new THREE.ExtrudeGeometry( pair( 1, STROKE ), {
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

export function boostPickupGlyphGeometry(): THREE.BufferGeometry {
    return onBothFaces( pair( 0.92, STROKE * 0.62 ) );
}

export function boostPickupCoreGeometry(): THREE.BufferGeometry {
    return onBothFaces( pair( 0.82, STROKE * 0.22 ) );
}

export function boostStreakGeometry(): THREE.BufferGeometry {
    const g = new THREE.PlaneGeometry( 1, 1, 1, 8 );
    g.rotateX( -Math.PI / 2 );
    g.translate( 0, 0, -0.5 );
    return g;
}
