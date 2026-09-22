import { useFrame } from '@react-three/fiber';
import { Fragment, useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { MonolithShapeConfig } from './monolith-config';
import type { MonolithPlacement } from './monolith-field';
import { type MonolithSize, monolithGeometry } from './monolith-geometry';
import { bodySpan, bodyTransform, type MonolithTransform, seamTransform, shapeProfile } from './monolith-transforms';
import { cleanToMapRoughness, monolithBodySurface } from './track-materials';

const scratch = new THREE.Object3D();
const SEAM_GEOMETRY = monolithGeometry( { taper: 1, chamferX: 0, chamferZ: 0 } );

const MONO_METALNESS = 0.9;
const MONO_ROUGHNESS = 0.35;
const MONO_ENV_MAP_INTENSITY = 1.55;
const MONO_SEAM_EMISSIVE = 10;

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
    const surface = useMemo( monolithBodySurface, [] );
    const bodyRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const seamRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const size: MonolithSize = [ shape.width, bodySpan( shape ), shape.depth ];

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

    useFrame( () => {
        const body = bodyRef.current;
        if ( body ) {
            body.metalness = MONO_METALNESS;
            body.roughness = cleanToMapRoughness( MONO_ROUGHNESS );
            body.envMapIntensity = MONO_ENV_MAP_INTENSITY;
        }
        const seam = seamRef.current;
        if ( seam ) seam.emissiveIntensity = MONO_SEAM_EMISSIVE;
    } );

    return (
        <Fragment>
            <instancedMesh
                key={ `body-${ placements.length }` }
                ref={ fillBodies }
                geometry={ monolithGeometry( shapeProfile( shape ), size ) }
                args={ [ undefined, undefined, placements.length ] }
            >
                <meshStandardMaterial ref={ bodyRef } { ...surface } />
            </instancedMesh>
            <instancedMesh
                key={ `seam-${ placements.length }` }
                ref={ fillSeams }
                geometry={ SEAM_GEOMETRY }
                args={ [ undefined, undefined, placements.length ] }
            >
                <meshStandardMaterial
                    ref={ seamRef }
                    color={ shape.seam.color }
                    emissive={ shape.seam.emissive }
                    emissiveIntensity={ shape.seam.intensity }
                />
            </instancedMesh>
        </Fragment>
    );
}
