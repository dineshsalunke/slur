import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { type BloomEffect, ToneMappingMode } from 'postprocessing';
import { useRef } from 'react';
import { num } from '../../dev/tuning';

export function SceneEffects() {
    const ref = useRef< BloomEffect | null >( null );

    useFrame( () => {
        const effect = ref.current;
        if ( ! effect ) return;

        effect.intensity = num( 'Bloom.intensity' );
        effect.luminanceMaterial.threshold = num( 'Bloom.threshold' );
        effect.luminanceMaterial.smoothing = num( 'Bloom.smoothing' );
    } );

    return (
        <EffectComposer multisampling={ 0 }>
            <Bloom ref={ ref } mipmapBlur />
            <ToneMapping mode={ ToneMappingMode.NEUTRAL } />
        </EffectComposer>
    );
}
