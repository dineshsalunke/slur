import { useFrame } from '@react-three/fiber';
import { Fragment, useCallback, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { useRebuildToken } from '../../../dev/use-rebuild-token';
import { blotchWearUniforms, updateBlotchWear } from '../deck-breakup';
import { applyDeckFinish } from '../deck-finish';
import type { MonolithShapeConfig } from '../monolith-config';
import { type MonolithSize, monolithGeometry, patchWallSpan } from '../monolith-geometry';
import { bodySpan, type MonolithTransform, shapeProfile } from '../monolith-transforms';
import { patchRailGlow, type RailMask, railGlowUniforms, updateRailGlow } from '../rail-glow';
import { graphiteSurface } from '../track-materials';
import { patchWallBreakup } from '../wall-breakup';
import { SEAM_GEOMETRY } from './monolith-group.constants';
import { fill } from './monolith-group.utils';

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
    const surface = useMemo( graphiteSurface, [ rebuild ] );
    const glow = useMemo( railGlowUniforms, [] );
    const span = useMemo( () => ( { value: 1 } ), [] );
    const breakup = useMemo( blotchWearUniforms, [] );

    const bodyRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const seamRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const size: MonolithSize = [ shape.width, bodySpan( shape ), shape.depth ];

    const attachBody = ( mat: THREE.MeshStandardMaterial | null ) => {
        bodyRef.current = mat;
        if ( ! mat ) return;
        patchRailGlow( mat, glow );
        patchWallSpan( mat, span );
        patchWallBreakup( mat, breakup );
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
            span.value = size[ 1 ];
            updateBlotchWear( breakup );
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
