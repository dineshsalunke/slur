import { useCallback, useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { useTrack } from '../../track-context/use-track';
import { registerDialSync } from '../dial-sync/dial-sync.state';
import { buildCordMesh } from './track-rim.utils';

export interface Cord {
    x: number;
    y: number;
    z: number;
    length: number;
    alongZ: boolean;
}

export interface Run {
    from: number;
    to: number;
}

export function TrackRim() {
    const track = useTrack();
    const mesh = useMemo( () => buildCordMesh( track ), [ track ] );

    const syncDials = useCallback(
        () =>
            registerDialSync( () => {
                ( mesh.material as THREE.MeshStandardMaterial ).emissiveIntensity = num( 'Rail.rimEmissive' );
            } ),
        [ mesh ],
    );

    // GPU buffers outlive React's tree: a mesh replaced by a track change must be released by hand.
    useEffect(
        () => () => {
            mesh.geometry.dispose();
            ( mesh.material as THREE.Material ).dispose();
            mesh.dispose();
        },
        [ mesh ],
    );

    return <primitive ref={ syncDials } object={ mesh } />;
}
