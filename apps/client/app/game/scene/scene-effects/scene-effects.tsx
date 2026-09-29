import { useFrame } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { useWorld } from 'koota/react';
import {
    BlendFunction,
    BloomEffect,
    type EffectComposer as ComposerImpl,
    ToneMappingEffect,
    ToneMappingMode,
} from 'postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import { num } from '../../../dev/tuning';
import { localBoostSurplus } from '../../camera/boost-surplus';
import { FRAME_PHASE } from '../../frame/frame-phase.constants';
import { BoostBlurEffect } from '../boost-blur/boost-blur-effect';
import { composerToneMode, toneExposure, toneMode } from '../tone-mapping';
import { msaaSamples } from './scene-effects.utils';

export function SceneEffects() {
    const world = useWorld();
    const composer = useRef< ComposerImpl >( null );
    const blur = useMemo( () => new BoostBlurEffect(), [] );
    const bloom = useMemo( () => new BloomEffect( { blendFunction: BlendFunction.ADD, mipmapBlur: true } ), [] );
    const tone = useMemo( () => new ToneMappingEffect( { mode: ToneMappingMode.NEUTRAL } ), [] );

    // GPU render targets outlive React's tree: the effects' GPU resources must be released by hand.
    useEffect(
        () => () => {
            blur.dispose();
            bloom.dispose();
            tone.dispose();
        },
        [ blur, bloom, tone ],
    );

    useFrame( ( state ) => {
        blur.strength = localBoostSurplus( world ) * num( 'Boost.blur' );
        if ( blur.strength > 0 ) blur.aimAhead( state.camera );
        bloom.intensity = num( 'Bloom.intensity' );
        bloom.luminanceMaterial.threshold = num( 'Bloom.threshold' );
        bloom.luminanceMaterial.smoothing = num( 'Bloom.smoothing' );
        state.gl.toneMappingExposure = toneExposure();
        const mode = composerToneMode( toneMode() );
        const blend = mode === undefined ? BlendFunction.DST : BlendFunction.SRC;
        if ( tone.blendMode.blendFunction !== blend ) tone.blendMode.blendFunction = blend;
        if ( mode !== undefined ) tone.mode = mode;
        const samples = msaaSamples( state.gl.getPixelRatio() );
        if ( composer.current && composer.current.multisampling !== samples ) composer.current.multisampling = samples;
    } );

    return (
        <EffectComposer ref={ composer } multisampling={ 0 } renderPriority={ FRAME_PHASE.render }>
            <primitive object={ blur } />
            <primitive object={ bloom } />
            <primitive object={ tone } />
        </EffectComposer>
    );
}
