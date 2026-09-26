import type * as THREE from 'three';
import type { MonolithTransform } from '../monolith-transforms';
import { scratch } from './monolith-group.constants';

export function fill( mesh: THREE.InstancedMesh, transforms: readonly MonolithTransform[] ): void {
    for ( let i = 0; i < transforms.length; i++ ) {
        const t = transforms[ i ];
        scratch.position.set( ...t.position );
        scratch.scale.set( ...t.scale );
        scratch.rotation.set( 0, t.rotationY, t.rotationZ );
        scratch.updateMatrix();
        mesh.setMatrixAt( i, scratch.matrix );
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
}
