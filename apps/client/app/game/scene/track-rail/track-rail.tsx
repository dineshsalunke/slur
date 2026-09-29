import { useCallback, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { useRebuildToken } from '../../../dev/use-rebuild-token';
import { useTrack } from '../../track-context/use-track';
import { accent } from '../accent';
import { registerDialSync } from '../dial-sync/dial-sync.state';
import { segmentCount } from '../track-floor/track-floor.utils';
import { BOUNDARY_SURFACE, cleanToMapRoughness, railBodySurface } from '../track-materials';
import { trackRails } from '../track-rails.state';
import { buildRailGeometry } from './track-rail.utils';

export function TrackRail() {
    const track = useTrack();
    const geo = useMemo( () => buildRailGeometry( trackRails( track, segmentCount( track ) ).runs ), [ track ] );
    const rebuild = useRebuildToken();
    const materials = useMemo( () => {
        const strip = new THREE.MeshStandardMaterial( BOUNDARY_SURFACE );
        strip.emissive = accent();
        return [ new THREE.MeshStandardMaterial( railBodySurface() ), strip ];
    }, [ rebuild ] );

    // GPU buffers outlive React's tree: a geometry replaced by a new track must be released by hand.
    useEffect( () => () => geo.dispose(), [ geo ] );

    // GPU programs and textures outlive React's tree: a material replaced by a rebuild must be released by hand.
    useEffect(
        () => () => {
            for ( const m of materials ) m.dispose();
        },
        [ materials ],
    );

    const syncDials = useCallback(
        () =>
            registerDialSync( () => {
                const [ metal, strip ] = materials;
                const scale = num( 'Rail.normalScale' );
                metal.metalness = num( 'Rail.metalness' );
                metal.roughness = cleanToMapRoughness( num( 'Rail.roughness' ) );
                metal.normalScale.set( scale, scale );
                strip.emissiveIntensity = num( 'Rail.railEmissive' );
            } ),
        [ materials ],
    );

    return <mesh ref={ syncDials } geometry={ geo } material={ materials } />;
}
