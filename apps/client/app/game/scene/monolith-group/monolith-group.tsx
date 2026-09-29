import { Fragment, useCallback, useMemo } from 'react';
import type * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { useRebuildToken } from '../../../dev/use-rebuild-token';
import { blotchWearUniforms, updateBlotchWear } from '../deck-breakup';
import { applyDeckFinish } from '../deck-finish';
import { registerDialSync } from '../dial-sync/dial-sync.state';
import type { MonolithShapeConfig } from '../monolith-config';
import { type MonolithSize, monolithGeometry, patchWallSpan } from '../monolith-geometry';
import { bodySpan, type MonolithTransform, shapeProfile } from '../monolith-transforms';
import { graphiteSurface } from '../track-materials';
import { patchWallBreakup } from '../wall-breakup';
import { SEAM_GEOMETRY } from './monolith-group.constants';
import { fill } from './monolith-group.utils';

export function MonolithGroup( {
    shape,
    bodies,
    seams,
}: {
    shape: MonolithShapeConfig;
    bodies: readonly MonolithTransform[];
    seams: readonly MonolithTransform[];
} ) {
    const rebuild = useRebuildToken();
    const surface = useMemo( graphiteSurface, [ rebuild ] );
    const span = useMemo( () => ( { value: 1 } ), [] );
    const breakup = useMemo( blotchWearUniforms, [] );
    const size: MonolithSize = [ shape.width, bodySpan( shape ), shape.depth ];

    const attachBody = useCallback(
        ( mat: THREE.MeshStandardMaterial | null ) => {
            if ( ! mat ) return;
            span.value = bodySpan( shape );
            patchWallSpan( mat, span );
            patchWallBreakup( mat, breakup );
            return registerDialSync( () => {
                updateBlotchWear( breakup );
                applyDeckFinish( mat );
            } );
        },
        [ span, breakup, shape, surface ],
    );

    const attachSeam = useCallback(
        ( mat: THREE.MeshStandardMaterial | null ) => {
            if ( ! mat ) return;
            return registerDialSync( () => {
                mat.emissive.copy( shape.seam.emissive );
                mat.emissiveIntensity = num( 'Monolith.seamEmissive' );
            } );
        },
        [ shape ],
    );

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
                        ref={ attachSeam }
                        color={ shape.seam.color }
                        emissive={ shape.seam.emissive }
                        emissiveIntensity={ shape.seam.intensity }
                    />
                </instancedMesh>
            ) }
        </Fragment>
    );
}
