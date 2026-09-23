import { useFrame } from '@react-three/fiber';
import { Fragment, useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { useRebuildToken } from '../../dev/use-rebuild-token';
import { applyDeckFinish } from './deck-finish';
import type { MonolithShapeConfig } from './monolith-config';
import { type MonolithSize, monolithGeometry } from './monolith-geometry';
import { bodySpan, type MonolithTransform, shapeProfile } from './monolith-transforms';
import { patchRailGlow, type RailMask, railGlowUniforms, updateRailGlow } from './rail-glow';
import { floorSurface } from './track-materials';

const scratch = new THREE.Object3D();
const SEAM_GEOMETRY = monolithGeometry( { taper: 1, chamferX: 0, chamferZ: 0 } );

function fill( mesh: THREE.InstancedMesh, transforms: readonly MonolithTransform[] ): void {
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

export function MonolithGroup( {
    shape,
    bodies,
    seams,
    railMask,
}: {
    shape: MonolithShapeConfig;
    bodies: readonly MonolithTransform[];
    seams: readonly MonolithTransform[];
    railMask?: RailMask;
} ) {
    const rebuild = useRebuildToken();
    const surface = useMemo( floorSurface, [ rebuild ] );
    const glow = useMemo( railGlowUniforms, [] );

    const bodyRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const seamRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const size: MonolithSize = [ shape.width, bodySpan( shape ), shape.depth ];

    const attachBody = ( mat: THREE.MeshStandardMaterial | null ) => {
        bodyRef.current = mat;
        if ( mat ) patchRailGlow( mat, glow );
    };

    const fillBodies = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            if ( mesh ) fill( mesh, bodies );
        },
        [ bodies ],
    );

    const fillSeams = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            if ( mesh ) fill( mesh, seams );
        },
        [ seams ],
    );

    useFrame( () => {
        const body = bodyRef.current;
        if ( body ) {
            applyDeckFinish( body );
            if ( railMask ) updateRailGlow( glow, railMask.texture.current, railMask.count );
        }
        const seam = seamRef.current;
        if ( seam ) seam.emissiveIntensity = num( 'Monolith.seamEmissive' );
    } );

    return (
        <Fragment>
            <instancedMesh
                key={ `body-${ bodies.length }` }
                ref={ fillBodies }
                geometry={ monolithGeometry( shapeProfile( shape ), size ) }
                args={ [ undefined, undefined, bodies.length ] }
            >
                <meshStandardMaterial ref={ attachBody } { ...surface } />
            </instancedMesh>
            { seams.length > 0 && (
                <instancedMesh
                    key={ `seam-${ seams.length }` }
                    ref={ fillSeams }
                    geometry={ SEAM_GEOMETRY }
                    args={ [ undefined, undefined, seams.length ] }
                >
                    <meshStandardMaterial
                        ref={ seamRef }
                        color={ shape.seam.color }
                        emissive={ shape.seam.emissive }
                        emissiveIntensity={ shape.seam.intensity }
                    />
                </instancedMesh>
            ) }
        </Fragment>
    );
}
