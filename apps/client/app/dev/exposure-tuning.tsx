import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { ExposureEffect } from './exposure-effect';
import { num } from './tunables';

export function ExposureTuning() {
    const exposure = useMemo( () => new ExposureEffect(), [] );

    // JUSTIFIED EFFECT — syncs with an external system: the GPU resources the effect allocates outside React.
    useEffect( () => () => exposure.dispose(), [ exposure ] );

    useFrame( () => {
        exposure.exposure = num( 'tone.exposure' );
    } );

    return <primitive object={ exposure } dispose={ null } />;
}
