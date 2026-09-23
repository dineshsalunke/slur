import { useFrame } from '@react-three/fiber';
import { Fragment, useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { col, num } from '../../dev/tuning';
import { useRebuildToken } from '../../dev/use-rebuild-token';
import type { MonolithShapeConfig } from './monolith-config';
import { type MonolithSize, monolithGeometry } from './monolith-geometry';
import { bodySpan, type MonolithTransform, shapeProfile } from './monolith-transforms';
import { patchRailGlow, type RailMask, railGlowUniforms, updateRailGlow } from './rail-glow';
import { useSealedBlockMaps } from './sealed-block-texture';
import { cleanToMapRoughness, floorSurface } from './track-materials';
import { TEX_SPAN_X } from './track-texture';

const SURFACE_FLAT = 1;
const SURFACE_DECK = 2;

const scratch = new THREE.Object3D();
const SEAM_GEOMETRY = monolithGeometry( { taper: 1, chamferX: 0, chamferZ: 0 } );

export const unattached = () => () => undefined;

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

function applyMonolithFinish( mat: THREE.MeshStandardMaterial ): void {
    mat.metalness = num( 'Monolith.metalness' );
    mat.roughness = num( 'Monolith.roughness' );
    mat.envMapIntensity = num( 'Monolith.envMapIntensity' );
    const normalScale = num( 'Monolith.normalScale' );
    mat.normalScale.set( normalScale, normalScale );
    const repeat = TEX_SPAN_X / Math.max( num( 'Monolith.textureSpan' ), 1e-3 );
    for ( const tex of [ mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap ] ) {
        tex?.repeat.set( repeat, repeat );
    }
}

function chosenSurface(
    metal: THREE.MeshStandardMaterial,
    flat: THREE.MeshStandardMaterial,
    deck: THREE.MeshStandardMaterial,
): THREE.MeshStandardMaterial {
    const mode = Math.round( num( 'Monolith.surface' ) );
    if ( mode === SURFACE_DECK ) return deck;
    return mode === SURFACE_FLAT ? flat : metal;
}

function applyDeckFinish( mat: THREE.MeshStandardMaterial ): void {
    mat.metalness = num( 'Deck.metalness' );
    mat.roughness = cleanToMapRoughness( num( 'Deck.roughness' ) );
    mat.envMapIntensity = num( 'Deck.envMapIntensity' );
    const scale = num( 'Deck.normalScale' );
    mat.normalScale.set( scale, scale );
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
    const flatSurface = useMemo(
        () => ( {
            normalMap: cloneMap( maps.normalMap ),
            roughnessMap: cloneMap( maps.roughnessMap ),
            metalnessMap: cloneMap( maps.metalnessMap ),
        } ),
        [ maps ],
    );
    const rebuild = useRebuildToken();
    const deckSurface = useMemo( floorSurface, [ rebuild ] );
    const glow = useMemo( railGlowUniforms, [] );

    const bodyMeshRef = useRef< THREE.InstancedMesh | null >( null );
    const metalRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const flatRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const deckRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const seamRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const size: MonolithSize = [ shape.width, bodySpan( shape ), shape.depth ];

    const attachDeck = ( mat: THREE.MeshStandardMaterial | null ) => {
        deckRef.current = mat;
        if ( mat ) patchRailGlow( mat, glow );
    };

    const fillBodies = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            bodyMeshRef.current = mesh;
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
        const mesh = bodyMeshRef.current;
        const metal = metalRef.current;
        const flat = flatRef.current;
        const deck = deckRef.current;
        if ( mesh && metal && flat && deck ) {
            const chosen = chosenSurface( metal, flat, deck );
            if ( mesh.material !== chosen ) mesh.material = chosen;

            metal.color.set( col( 'Metal.mapTint' ) );
            applyMonolithFinish( metal );
            flat.color.set( col( 'Metal.baseColor' ) );
            applyMonolithFinish( flat );
            applyDeckFinish( deck );
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
                <meshStandardMaterial ref={ metalRef } { ...surface } />
                <meshStandardMaterial ref={ flatRef } attach={ unattached } { ...flatSurface } />
                <meshStandardMaterial ref={ attachDeck } attach={ unattached } { ...deckSurface } />
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
