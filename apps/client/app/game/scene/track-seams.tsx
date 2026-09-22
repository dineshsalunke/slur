import { useFrame } from '@react-three/fiber';
import { HALF_WIDTH, type Track } from '@slur/shared';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tunables';
import { buildSeamGeometry, buildSeamInserts } from './seam-inserts';
import { segmentCount } from './track-floor';
import { SEAM_SURFACE } from './track-materials';

export function TrackSeams( { track }: { track: Track } ) {
    const geo = useMemo(
        () => buildSeamGeometry( buildSeamInserts( track, segmentCount( track ), HALF_WIDTH ) ),
        [ track ],
    );
    const material = useMemo( () => new THREE.MeshStandardMaterial( SEAM_SURFACE ), [] );

    // GPU buffers outlive React's tree: a geometry replaced by a new track must be released by hand.
    useEffect( () => () => geo.dispose(), [ geo ] );

    // GPU programs and textures outlive React's tree: a material dropped by a rebuild must be released by hand.
    useEffect( () => () => material.dispose(), [ material ] );

    useFrame( () => {
        material.emissiveIntensity = num( 'seam.emissive' );
    } );

    return <mesh geometry={ geo } material={ material } />;
}
