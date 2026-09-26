import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { useRebuildToken } from '../../../dev/use-rebuild-token';
import { useTrack } from '../../track-context/use-track';
import { segmentCount } from '../track-floor/track-floor.utils';
import { BOUNDARY_SURFACE, cleanToMapRoughness, railBodySurface } from '../track-materials';
import { trackRails } from '../track-rails.state';
import { buildRailGeometry } from './track-rail.utils';

export function TrackRail() {
    const track = useTrack();
    const geo = useMemo( () => buildRailGeometry( trackRails( track, segmentCount( track ) ).runs ), [ track ] );
    const rebuild = useRebuildToken();
    const materials = useMemo( () => {
        return [
            new THREE.MeshStandardMaterial( railBodySurface() ),
            new THREE.MeshStandardMaterial( BOUNDARY_SURFACE ),
        ];
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

    useFrame( () => {
        const [ metal, strip ] = materials;
        const scale = num( 'Rail.normalScale' );
        metal.metalness = num( 'Rail.metalness' );
        metal.roughness = cleanToMapRoughness( num( 'Rail.roughness' ) );
        metal.envMapIntensity = num( 'Rail.envMapIntensity' );
        metal.normalScale.set( scale, scale );
        strip.emissiveIntensity = num( 'Rail.railEmissive' );
    } );

    return <mesh geometry={ geo } material={ materials } />;
}
