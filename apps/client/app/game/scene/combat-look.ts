import * as THREE from 'three';

export const MAX_BOLTS = 64;
export const BOLT_EMISSIVE = '#8affff';
export const BOLT_INTENSITY = 4;

export const PICKUP_RADIUS = 0.9;
export const PICKUP_EMISSIVE = '#ffd24a';
export const PICKUP_INTENSITY = 3;

export function boltGeometry(): THREE.BufferGeometry {
    const g = new THREE.CapsuleGeometry( 0.055, 30, 4, 8 );
    g.rotateX( Math.PI / 2 );
    return g;
}
