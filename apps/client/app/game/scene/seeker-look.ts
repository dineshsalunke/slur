import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface SeekerForm {
    half: number;
    halfLen: number;
    fins: boolean;
    faces: 1 | 2;
}

export const SEEKER_FLIGHT: SeekerForm = { half: 0.55, halfLen: 1.1, fins: true, faces: 1 };
export const SEEKER_PICKUP: SeekerForm = { half: 0.75, halfLen: 0.7, fins: false, faces: 2 };

const CHAMFER_SHARE = 0.28;
const BEVEL = 0.06;
const CORE_SHARE = 0.62;
const RIM_WIDTH = 0.09;
const BAND_DEPTH = 0.1;
const BAND_LIP = 0.018;
const BAND_AT = [ -0.55, 0.2 ];
const FIN_HEIGHT = 0.42;
const FIN_THICK = 0.06;
const FIN_SEAT = 0.02;
const FACE_LIFT = 0.006;

function outline( half: number ): THREE.Vector2[] {
    const c = half * CHAMFER_SHARE;
    return [
        new THREE.Vector2( half, -half + c ),
        new THREE.Vector2( half, half - c ),
        new THREE.Vector2( half - c, half ),
        new THREE.Vector2( -half + c, half ),
        new THREE.Vector2( -half, half - c ),
        new THREE.Vector2( -half, -half + c ),
        new THREE.Vector2( -half + c, -half ),
        new THREE.Vector2( half - c, -half ),
    ];
}

function ring( outer: number, inner: number ): THREE.Shape {
    const s = new THREE.Shape( outline( outer ) );
    s.holes.push( new THREE.Path( outline( inner ).reverse() ) );
    return s;
}

function merge( parts: THREE.BufferGeometry[] ): THREE.BufferGeometry {
    const merged = mergeGeometries( parts );
    for ( const p of parts ) p.dispose();
    return merged;
}

function onFaces( g: THREE.BufferGeometry, f: SeekerForm ): THREE.BufferGeometry {
    if ( f.faces === 1 ) return g;
    return merge( [ g, g.clone().rotateY( Math.PI ) ] );
}

function fins( f: SeekerForm ): THREE.BufferGeometry[] {
    const l = f.halfLen;
    const shape = new THREE.Shape( [
        new THREE.Vector2( -l, 0 ),
        new THREE.Vector2( -l * 0.1, 0 ),
        new THREE.Vector2( -l * 0.55, FIN_HEIGHT ),
        new THREE.Vector2( -l * 1.05, FIN_HEIGHT ),
    ] );
    return [ 0, Math.PI / 2, -Math.PI / 2 ].map( ( roll ) =>
        new THREE.ExtrudeGeometry( shape, { depth: FIN_THICK, bevelEnabled: false, curveSegments: 1 } )
            .translate( 0, f.half - FIN_SEAT, -FIN_THICK / 2 )
            .rotateY( -Math.PI / 2 )
            .rotateZ( roll ),
    );
}

export function seekerShellGeometry( f: SeekerForm ): THREE.BufferGeometry {
    const depth = 2 * ( f.halfLen - BEVEL );
    const body = new THREE.ExtrudeGeometry( new THREE.Shape( outline( f.half - BEVEL ) ), {
        depth,
        bevelEnabled: true,
        bevelThickness: BEVEL,
        bevelSize: BEVEL,
        bevelSegments: 1,
        curveSegments: 1,
    } ).translate( 0, 0, -depth / 2 );
    if ( ! f.fins ) return body;
    return merge( [ body, ...fins( f ) ] );
}

function coreHalf( f: SeekerForm ): number {
    return f.half * CORE_SHARE;
}

export function seekerGlyphGeometry( f: SeekerForm ): THREE.BufferGeometry {
    const inner = coreHalf( f );
    const rim = onFaces(
        new THREE.ShapeGeometry( ring( inner + RIM_WIDTH, inner ) )
            .toNonIndexed()
            .translate( 0, 0, f.halfLen + FACE_LIFT ),
        f,
    );
    const bands = BAND_AT.map( ( at ) =>
        new THREE.ExtrudeGeometry( ring( f.half + BAND_LIP, f.half - BEVEL ), {
            depth: BAND_DEPTH,
            bevelEnabled: false,
            curveSegments: 1,
        } ).translate( 0, 0, at * f.halfLen - BAND_DEPTH / 2 ),
    );
    return merge( [ rim, ...bands ] );
}

export function seekerCoreGeometry( f: SeekerForm ): THREE.BufferGeometry {
    return onFaces(
        new THREE.ShapeGeometry( new THREE.Shape( outline( coreHalf( f ) ) ) )
            .toNonIndexed()
            .translate( 0, 0, f.halfLen + FACE_LIFT * 2 ),
        f,
    );
}

export const MAX_SEEKERS = 16;
export const SEEKER_TRAIL_WIDTH = 0.75;
export const SEEKER_TRAIL_BRIGHT = 4;
export const SEEKER_EMBER_SPAN = 0.6;

export function seekerTrailSegmentGeometry(): THREE.BufferGeometry {
    return new THREE.CylinderGeometry( 1, 1, 1, 6, 1, true ).rotateX( Math.PI / 2 ).translate( 0, 0, 0.5 );
}
