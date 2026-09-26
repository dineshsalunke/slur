import * as THREE from 'three';

export function rockMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial( { metalness: 0, roughness: 1, fog: false } );
}
