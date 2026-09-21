import { HALF_WIDTH, type Track } from '@slur/shared';
import { useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useDebugTuning } from '../../dev/debug-tuning';
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
const scratch = new THREE.Object3D();

export function Monoliths( { track }: { track: Track } ) {
    const tuning = useDebugTuning();
    const dev = import.meta.env.DEV;
    const height = dev ? tuning.monolithHeight : MONOLITH_HEIGHT;
    const width = dev ? tuning.monolithWidth : MONOLITH_WIDTH;
    const depth = dev ? tuning.monolithDepth : MONOLITH_DEPTH;
    const gap = dev ? tuning.monolithGap : MONOLITH_GAP;
    const below = dev ? tuning.monolithBelow : MONOLITH_BELOW;
    const calm = dev ? tuning.monolithSpacingCalm : MONOLITH_SPACING_CALM;
    const intense = dev ? tuning.monolithSpacingIntense : MONOLITH_SPACING_INTENSE;
    const seamIntensity = dev ? tuning.monolithSeam : MONOLITH_SEAM_INTENSITY;

    const placements = useMemo( () => monolithField( track.finishZ, calm, intense ), [ track.finishZ, calm, intense ] );

    const fillBodies = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            if ( ! mesh ) return;
            for ( let i = 0; i < placements.length; i++ ) {
                const p = placements[ i ];
                scratch.position.set( p.side * ( RAIL_OUTER + gap + width / 2 ), ( height - below ) / 2, p.z );
                scratch.scale.set( width, height + below, depth );
                scratch.updateMatrix();
                mesh.setMatrixAt( i, scratch.matrix );
            }
            mesh.instanceMatrix.needsUpdate = true;
            mesh.computeBoundingSphere();
        },
        [ placements, gap, width, height, depth, below ],
    );

    const fillSeams = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            if ( ! mesh ) return;
            for ( let i = 0; i < placements.length; i++ ) {
                const p = placements[ i ];
                scratch.position.set( p.side * ( RAIL_OUTER + gap ), height / 2, p.z );
                scratch.scale.set( SEAM_WIDTH, height, depth * SEAM_DEPTH_FRACTION );
                scratch.updateMatrix();
                mesh.setMatrixAt( i, scratch.matrix );
            }
            mesh.instanceMatrix.needsUpdate = true;
            mesh.computeBoundingSphere();
        },
        [ placements, gap, height, depth ],
    );

    return (
        <group>
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
                    emissiveIntensity={ seamIntensity }
                />
            </instancedMesh>
        </group>
    );
}
