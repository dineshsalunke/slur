import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const FACETS = 8;
const RADIUS = 0.6;
const HALF_LEN = 1.3;
const CHAMFER = 0.04;
const RECESS = 0.1;
const CORE_RADIUS = 0.34;
const BAND_RADIUS = 0.615;
const BAND_WIDTH = 0.08;
const BAND_AT = [ -0.6, 0.35 ];

function alongZ( g: THREE.BufferGeometry ): THREE.BufferGeometry {
    return g.rotateX( Math.PI / 2 );
}

export function seekerCanisterShellGeometry(): THREE.BufferGeometry {
    const rear = -HALF_LEN;
    const profile = [
        new THREE.Vector2( 0, rear + RECESS ),
        new THREE.Vector2( CORE_RADIUS + 0.02, rear + RECESS ),
        new THREE.Vector2( CORE_RADIUS + 0.04, rear ),
        new THREE.Vector2( RADIUS - CHAMFER, rear ),
        new THREE.Vector2( RADIUS, rear + CHAMFER ),
        new THREE.Vector2( RADIUS, 0.55 ),
        new THREE.Vector2( 0.44, 1.1 ),
        new THREE.Vector2( 0.14, HALF_LEN - CHAMFER ),
        new THREE.Vector2( 0.1, HALF_LEN ),
        new THREE.Vector2( 0, HALF_LEN ),
    ];
    return alongZ( new THREE.LatheGeometry( profile, FACETS ) );
}

export function seekerCanisterGlyphGeometry(): THREE.BufferGeometry {
    const parts = BAND_AT.map( ( y ) =>
        new THREE.CylinderGeometry( BAND_RADIUS, BAND_RADIUS, BAND_WIDTH, FACETS, 1, true ).translate( 0, y, 0 ),
    );
    const merged = alongZ( mergeGeometries( parts ) );
    for ( const p of parts ) p.dispose();
    return merged;
}

export function seekerCanisterCoreGeometry(): THREE.BufferGeometry {
    return new THREE.CircleGeometry( CORE_RADIUS, FACETS )
        .rotateY( Math.PI )
        .translate( 0, 0, -HALF_LEN + RECESS - 0.005 );
}
