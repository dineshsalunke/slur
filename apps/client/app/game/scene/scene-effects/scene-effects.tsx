import { useFrame } from '@react-three/fiber';
import { EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { useWorld } from 'koota/react';
import { BlendFunction, BloomEffect, type EffectComposer as ComposerImpl, ToneMappingMode } from 'postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import { num } from '../../../dev/tuning';
import { localBoostSurplus } from '../../camera/boost-surplus';
import { BoostBlurEffect } from '../boost-blur/boost-blur-effect';
import { msaaSamples } from './scene-effects.utils';

export function SceneEffects() {
    const world = useWorld();
    const composer = useRef< ComposerImpl >( null );
    const blur = useMemo( () => new BoostBlurEffect(), [] );
    const bloom = useMemo( () => new BloomEffect( { blendFunction: BlendFunction.ADD, mipmapBlur: true } ), [] );

    // GPU render targets outlive React's tree: the effects' GPU resources must be released by hand.
    useEffect(
        () => () => {
            blur.dispose();
            bloom.dispose();
        },
        [ blur, bloom ],
    );

    useFrame( ( state ) => {
        blur.strength = localBoostSurplus( world ) * num( 'Boost.blur' );
        if ( blur.strength > 0 ) blur.aimAhead( state.camera );
        bloom.intensity = num( 'Bloom.intensity' );
        bloom.luminanceMaterial.threshold = num( 'Bloom.threshold' );
        bloom.luminanceMaterial.smoothing = num( 'Bloom.smoothing' );
        const samples = msaaSamples( state.gl.getPixelRatio() );
        if ( composer.current && composer.current.multisampling !== samples ) composer.current.multisampling = samples;
    } );

    return (
        <EffectComposer ref={ composer } multisampling={ 0 }>
            <primitive object={ blur } />
            <primitive object={ bloom } />
            <ToneMapping mode={ ToneMappingMode.NEUTRAL } />
        </EffectComposer>
    );
}
