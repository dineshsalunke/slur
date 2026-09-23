import { useFrame } from '@react-three/fiber';
import { Fragment, useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { col, num } from '../../dev/tuning';
import type { MonolithShapeConfig } from './monolith-config';
import { type MonolithSize, monolithGeometry } from './monolith-geometry';
import { bodySpan, type MonolithTransform, shapeProfile } from './monolith-transforms';
import { useSealedBlockMaps } from './sealed-block-texture';
import { TEX_SPAN_X } from './track-texture';

const scratch = new THREE.Object3D();
const SEAM_GEOMETRY = monolithGeometry( { taper: 1, chamferX: 0, chamferZ: 0 } );

function cloneMap( tex: THREE.Texture ): THREE.Texture {
    const clone = tex.clone();
    clone.needsUpdate = true;
    return clone;
}

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
}: {
    shape: MonolithShapeConfig;
    bodies: readonly MonolithTransform[];
    seams: readonly MonolithTransform[];
} ) {
    const maps = useSealedBlockMaps();
    const surface = useMemo(
        () => ( {
            color: '#ffffff',
            map: cloneMap( maps.map ),
            normalMap: cloneMap( maps.normalMap ),
            roughnessMap: cloneMap( maps.roughnessMap ),
            metalnessMap: cloneMap( maps.metalnessMap ),
        } ),
        [ maps ],
    );
    const bodyRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const seamRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const size: MonolithSize = [ shape.width, bodySpan( shape ), shape.depth ];

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
            body.color.set( col( 'Metal.mapTint' ) );
            body.metalness = num( 'Monolith.metalness' );
            body.roughness = num( 'Monolith.roughness' );
            body.envMapIntensity = num( 'Monolith.envMapIntensity' );
            const normalScale = num( 'Monolith.normalScale' );
            body.normalScale.set( normalScale, normalScale );
            const repeat = TEX_SPAN_X / Math.max( num( 'Monolith.textureSpan' ), 1e-3 );
            for ( const tex of [ body.map, body.normalMap, body.roughnessMap, body.metalnessMap ] ) {
                tex?.repeat.set( repeat, repeat );
            }
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
                <meshStandardMaterial ref={ bodyRef } { ...surface } />
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
