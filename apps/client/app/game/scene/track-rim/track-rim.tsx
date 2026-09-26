import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { useTrack } from '../../track-context/use-track';
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

    useFrame( () => {
        ( mesh.material as THREE.MeshStandardMaterial ).emissiveIntensity = num( 'Rail.rimEmissive' );
    } );

    // GPU buffers outlive React's tree: a mesh replaced by a track change must be released by hand.
    useEffect(
        () => () => {
            mesh.geometry.dispose();
            ( mesh.material as THREE.Material ).dispose();
            mesh.dispose();
        },
        [ mesh ],
    );

    return <primitive object={ mesh } />;
}
