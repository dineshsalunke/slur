import { HALF_WIDTH, type Track } from '@slur/shared';
import { Fragment, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { monolithField } from './monolith-field';
import { BOUNDARY_W } from './track-geometry';
import { MARIGOLD_EMISSIVE } from './track-materials';

export const MONOLITH_COLOR = '#242e36';
export const MONOLITH_ROUGHNESS = 0.82;
export const MONOLITH_METALNESS = 0;

export const MONOLITH_HEIGHT = 50;
export const MONOLITH_WIDTH = 12;
export const MONOLITH_DEPTH = 12;
export const MONOLITH_GAP = 0;
export const MONOLITH_BELOW = 60;
export const MONOLITH_SPACING_CALM = 400;
export const MONOLITH_SPACING_INTENSE = 200;

export const MONOLITH_SEAM_INTENSITY = 2;

export const SEAM_COLOR = '#0b0d0f';
export const SEAM_WIDTH = 0.25;
export const SEAM_DEPTH_FRACTION = 0.12;

const RAIL_OUTER = HALF_WIDTH + BOUNDARY_W;
const BODY_X = RAIL_OUTER + MONOLITH_GAP + MONOLITH_WIDTH / 2;
const BODY_Y = ( MONOLITH_HEIGHT - MONOLITH_BELOW ) / 2;
const BODY_H = MONOLITH_HEIGHT + MONOLITH_BELOW;
const SEAM_X = RAIL_OUTER + MONOLITH_GAP;
const scratch = new THREE.Object3D();

export function Monoliths( { track }: { track: Track } ) {
    const placements = useMemo(
        () => monolithField( track.finishZ, MONOLITH_SPACING_CALM, MONOLITH_SPACING_INTENSE ),
        [ track.finishZ ],
    );

    const fillBodies = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            if ( ! mesh ) return;
            for ( let i = 0; i < placements.length; i++ ) {
                const p = placements[ i ];
                scratch.position.set( p.side * BODY_X, BODY_Y, p.z );
                scratch.scale.set( MONOLITH_WIDTH, BODY_H, MONOLITH_DEPTH );
                scratch.updateMatrix();
                mesh.setMatrixAt( i, scratch.matrix );
            }
            mesh.instanceMatrix.needsUpdate = true;
            mesh.computeBoundingSphere();
        },
        [ placements ],
    );

    const fillSeams = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            if ( ! mesh ) return;
            for ( let i = 0; i < placements.length; i++ ) {
                const p = placements[ i ];
                scratch.position.set( p.side * SEAM_X, MONOLITH_HEIGHT / 2, p.z );
                scratch.scale.set( SEAM_WIDTH, MONOLITH_HEIGHT, MONOLITH_DEPTH * SEAM_DEPTH_FRACTION );
                scratch.updateMatrix();
                mesh.setMatrixAt( i, scratch.matrix );
            }
            mesh.instanceMatrix.needsUpdate = true;
            mesh.computeBoundingSphere();
        },
        [ placements ],
    );

    return (
        <Fragment>
            <instancedMesh
                key={ `body-${ placements.length }` }
                ref={ fillBodies }
                args={ [ undefined, undefined, placements.length ] }
            >
                <boxGeometry />
                <meshStandardMaterial
                    color={ MONOLITH_COLOR }
                    roughness={ MONOLITH_ROUGHNESS }
                    metalness={ MONOLITH_METALNESS }
                />
            </instancedMesh>
            <instancedMesh
                key={ `seam-${ placements.length }` }
                ref={ fillSeams }
                args={ [ undefined, undefined, placements.length ] }
            >
                <boxGeometry />
                <meshStandardMaterial
                    color={ SEAM_COLOR }
                    emissive={ MARIGOLD_EMISSIVE }
                    emissiveIntensity={ MONOLITH_SEAM_INTENSITY }
                />
            </instancedMesh>
        </Fragment>
    );
}
