import { useFrame } from '@react-three/fiber';
import { EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { BlendFunction, BloomEffect, type EffectComposer as ComposerImpl, ToneMappingMode } from 'postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import { num } from '../../dev/tuning';

const AUTO_MSAA_MAX_DPR = 2;
const AUTO_MSAA_SAMPLES = 4;

function msaaSamples( dpr: number ): number {
    const manual = num( 'Render.msaa' );
    if ( manual >= 0 ) return manual;
    return dpr < AUTO_MSAA_MAX_DPR ? AUTO_MSAA_SAMPLES : 0;
}

export function SceneEffects() {
    const composer = useRef< ComposerImpl >( null );
    const bloom = useMemo( () => new BloomEffect( { blendFunction: BlendFunction.ADD, mipmapBlur: true } ), [] );

    // GPU render targets outlive React's tree: the effect's mip chain must be released by hand.
    useEffect( () => () => bloom.dispose(), [ bloom ] );

    useFrame( ( state ) => {
        bloom.intensity = num( 'Bloom.intensity' );
        bloom.luminanceMaterial.threshold = num( 'Bloom.threshold' );
        bloom.luminanceMaterial.smoothing = num( 'Bloom.smoothing' );
        const samples = msaaSamples( state.gl.getPixelRatio() );
        if ( composer.current && composer.current.multisampling !== samples ) composer.current.multisampling = samples;
    } );

    return (
        <EffectComposer ref={ composer } multisampling={ 0 }>
            <primitive object={ bloom } />
            <ToneMapping mode={ ToneMappingMode.NEUTRAL } />
        </EffectComposer>
    );
}
