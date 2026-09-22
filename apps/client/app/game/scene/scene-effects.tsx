import { useFrame } from '@react-three/fiber';
import { EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { BlendFunction, BloomEffect, ToneMappingMode } from 'postprocessing';
import { useEffect, useMemo } from 'react';
import { num } from '../../dev/tuning';

export function SceneEffects() {
    const bloom = useMemo( () => new BloomEffect( { blendFunction: BlendFunction.ADD, mipmapBlur: true } ), [] );

    // GPU render targets outlive React's tree: the effect's mip chain must be released by hand.
    useEffect( () => () => bloom.dispose(), [ bloom ] );

    useFrame( () => {
        bloom.intensity = num( 'Bloom.intensity' );
        bloom.luminanceMaterial.threshold = num( 'Bloom.threshold' );
        bloom.luminanceMaterial.smoothing = num( 'Bloom.smoothing' );
    } );

    return (
        <EffectComposer multisampling={ 0 }>
            <primitive object={ bloom } />
            <ToneMapping mode={ ToneMappingMode.NEUTRAL } />
        </EffectComposer>
    );
}
