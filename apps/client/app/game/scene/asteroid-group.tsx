import { useCallback } from 'react';
import * as THREE from 'three';
import type { AsteroidPlacement } from './asteroid-field';
import { ASTEROID_ALBEDO, ASTEROID_METALNESS, ASTEROID_ROUGHNESS } from './asteroid-material';

const scratch = new THREE.Object3D();
const ROCK_GEOMETRY = new THREE.SphereGeometry( 0.5, 12, 8 );

function fill( mesh: THREE.InstancedMesh, placements: readonly AsteroidPlacement[] ): void {
    for ( let i = 0; i < placements.length; i++ ) {
        const p = placements[ i ];
        scratch.position.set( p.x, p.y, p.z );
        scratch.rotation.set( p.rotation[ 0 ], p.rotation[ 1 ], p.rotation[ 2 ] );
        scratch.scale.set( p.size * p.stretch[ 0 ], p.size * p.stretch[ 1 ], p.size * p.stretch[ 2 ] );
        scratch.updateMatrix();
        mesh.setMatrixAt( i, scratch.matrix );
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
}

export function AsteroidGroup( { placements }: { placements: readonly AsteroidPlacement[] } ) {
    const fillRocks = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            if ( mesh ) fill( mesh, placements );
        },
        [ placements ],
    );

    return (
        <instancedMesh
            key={ placements.length }
            ref={ fillRocks }
            geometry={ ROCK_GEOMETRY }
            args={ [ undefined, undefined, placements.length ] }
        >
            <meshStandardMaterial
                color={ ASTEROID_ALBEDO }
                metalness={ ASTEROID_METALNESS }
                roughness={ ASTEROID_ROUGHNESS }
            />
        </instancedMesh>
    );
}
