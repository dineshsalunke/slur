import type * as THREE from 'three';

export function commitInstances( mesh: THREE.InstancedMesh, count: number ): void {
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
}
