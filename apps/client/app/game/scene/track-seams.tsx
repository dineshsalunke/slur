import { HALF_WIDTH } from '@slur/shared';
import { useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { useTrack } from '../track-context/use-track';
import { accent } from './accent';
import { registerDialSync } from './dial-sync/dial-sync.state';
import { buildSeamGeometry, buildSeamInserts } from './seam-inserts';
import { segmentCount } from './track-floor/track-floor.utils';
import { SEAM_SURFACE } from './track-materials';

export function TrackSeams() {
    const track = useTrack();
    const geo = useMemo(
        () => buildSeamGeometry( buildSeamInserts( track, segmentCount( track ), HALF_WIDTH ) ),
        [ track ],
    );
    const material = useMemo( () => {
        const m = new THREE.MeshStandardMaterial( SEAM_SURFACE );
        m.emissive = accent();
        return m;
    }, [] );

    // GPU buffers outlive React's tree: a geometry replaced by a new track must be released by hand.
    useEffect( () => () => geo.dispose(), [ geo ] );

    // GPU programs and textures outlive React's tree: a material dropped by a rebuild must be released by hand.
    useEffect( () => () => material.dispose(), [ material ] );

    const syncDials = useCallback(
        () =>
            registerDialSync( () => {
                material.emissiveIntensity = num( 'Deck.seamEmissive' );
            } ),
        [ material ],
    );

    return <mesh ref={ syncDials } geometry={ geo } material={ material } />;
}
