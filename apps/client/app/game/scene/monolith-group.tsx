import { Fragment, useCallback } from 'react';
import * as THREE from 'three';
import type { MonolithShapeConfig } from './monolith-config';
import type { MonolithPlacement } from './monolith-field';
import { monolithGeometry } from './monolith-geometry';
import { bodyTransform, type MonolithTransform, seamTransform, shapeProfile } from './monolith-transforms';

const scratch = new THREE.Object3D();
const SEAM_GEOMETRY = monolithGeometry( { taper: 1, chamferX: 0, chamferZ: 0 } );

function fill(
    mesh: THREE.InstancedMesh,
    placements: readonly MonolithPlacement[],
    transform: ( placement: MonolithPlacement ) => MonolithTransform,
): void {
    for ( let i = 0; i < placements.length; i++ ) {
        const t = transform( placements[ i ] );
        scratch.position.set( ...t.position );
        scratch.scale.set( ...t.scale );
        scratch.rotation.set( 0, t.rotationY, t.rotationZ );
        scratch.updateMatrix();
        mesh.setMatrixAt( i, scratch.matrix );
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
}

export function MonolithGroup( {
    shape,
    placements,
}: {
    shape: MonolithShapeConfig;
    placements: readonly MonolithPlacement[];
} ) {
    const fillBodies = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            if ( mesh ) fill( mesh, placements, ( p ) => bodyTransform( shape, p ) );
        },
        [ placements, shape ],
    );

    const fillSeams = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            if ( mesh ) fill( mesh, placements, ( p ) => seamTransform( shape, p ) );
        },
        [ placements, shape ],
    );

    return (
        <Fragment>
            <instancedMesh
                key={ `body-${ placements.length }` }
                ref={ fillBodies }
                geometry={ monolithGeometry( shapeProfile( shape ) ) }
                args={ [ undefined, undefined, placements.length ] }
            >
                <meshStandardMaterial
                    color={ shape.surface.color }
                    roughness={ shape.surface.roughness }
                    metalness={ shape.surface.metalness }
                    envMapIntensity={ shape.surface.envMapIntensity }
                />
            </instancedMesh>
            <instancedMesh
                key={ `seam-${ placements.length }` }
                ref={ fillSeams }
                geometry={ SEAM_GEOMETRY }
                args={ [ undefined, undefined, placements.length ] }
            >
                <meshStandardMaterial
                    color={ shape.seam.color }
                    emissive={ shape.seam.emissive }
                    emissiveIntensity={ shape.seam.intensity }
                />
            </instancedMesh>
        </Fragment>
    );
}
