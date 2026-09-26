import { useCallback } from 'react';
import type * as THREE from 'three';
import type { MonolithTransform } from '../monolith-transforms';
import { STRIP_GEOMETRY, scratch } from './finish-outline.constants';

export function FinishOutline( {
    strips,
    emissive,
    intensity,
}: {
    strips: readonly MonolithTransform[];
    emissive: string;
    intensity: number;
} ) {
    const fillStrips = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            if ( ! mesh ) return;
            for ( let i = 0; i < strips.length; i++ ) {
                const s = strips[ i ];
                scratch.position.set( ...s.position );
                scratch.scale.set( ...s.scale );
                scratch.rotation.set( 0, s.rotationY, s.rotationZ );
                scratch.updateMatrix();
                mesh.setMatrixAt( i, scratch.matrix );
            }
            mesh.instanceMatrix.needsUpdate = true;
            mesh.computeBoundingSphere();
        },
        [ strips ],
    );

    return (
        <instancedMesh
            key={ `outline-${ strips.length }` }
            ref={ fillStrips }
            geometry={ STRIP_GEOMETRY }
            args={ [ undefined, undefined, strips.length ] }
        >
            <meshStandardMaterial color="#0b0d0f" emissive={ emissive } emissiveIntensity={ intensity } fog={ false } />
        </instancedMesh>
    );
}
