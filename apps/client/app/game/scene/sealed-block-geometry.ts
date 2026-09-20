import * as THREE from 'three';

export interface BlockDims {
    w: number;
    h: number;
    d: number;
}

/**
 * The seat for the silhouette treatment. Every feature added here is cut INWARD — the mesh is the physics
 * hull, so a detail outside the AABB kills the player on apparent empty air.
 */
export function sealedBlockGeometry( { w, h, d }: BlockDims ): THREE.BufferGeometry {
    return new THREE.BoxGeometry( w, h, d );
}
