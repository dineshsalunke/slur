import { useFrame } from '@react-three/fiber';
import { BlendFunction, BloomEffect } from 'postprocessing';
import { useEffect, useMemo } from 'react';
import { num } from '../../dev/tunables';

export const BLOOM_LEVELS = 4;

export function SceneBloom() {
    const effect = useMemo(
        () => new BloomEffect( { blendFunction: BlendFunction.ADD, mipmapBlur: true, levels: BLOOM_LEVELS } ),
        [],
    );

    // JUSTIFIED EFFECT — syncs with an external system: the GPU render targets the bloom effect allocates outside React.
    useEffect( () => () => effect.dispose(), [ effect ] );

    useFrame( () => {
        effect.intensity = num( 'bloom.intensity' );
        effect.luminanceMaterial.threshold = num( 'bloom.threshold' );
        effect.luminanceMaterial.smoothing = num( 'bloom.smoothing' );
        effect.mipmapBlurPass.radius = num( 'bloom.radius' );
    } );

    return <primitive object={ effect } dispose={ null } />;
}
