import * as THREE from 'three';
import type { MineShock as Shock } from '../mine-shock-events';
import type { Ring } from './mine-shock';
import { LOOKS, MAX } from './mine-shock.constants';

export function buildLook() {
    return {
        geometry: new THREE.RingGeometry( 0.86, 1, 64, 1 ).rotateX( -Math.PI / 2 ),
        material: new THREE.MeshBasicMaterial( {
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
        } ),
    };
}

export function spawn( rings: Ring[], e: Shock ): void {
    if ( rings.length >= MAX ) rings.shift();
    rings.push( { x: e.x, y: e.y, z: e.z, look: LOOKS[ e.kind ], age: 0 } );
}

export function spread( r: Ring, f: number ): number {
    const ease = 1 - ( 1 - f ) * ( 1 - f );
    return r.look.reach * ( r.look.collapse ? 1 - ease : ease );
}
