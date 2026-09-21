import { useFrame } from '@react-three/fiber';
import { Bloom } from '@react-three/postprocessing';
import type { BloomEffect } from 'postprocessing';
import { useRef, useState } from 'react';
import type { BloomConfig } from '../game/scene/env-config';
import { DEBUG_TUNING } from './debug-tuning';

export function DevBloom( { config }: { config: BloomConfig } ) {
    const effect = useRef< BloomEffect >( null );

    useFrame( () => {
        const e = effect.current;
        if ( ! e ) return;
        e.intensity = DEBUG_TUNING.bloomIntensity;
        e.luminanceMaterial.threshold = DEBUG_TUNING.bloomThreshold;
        e.luminanceMaterial.smoothing = DEBUG_TUNING.bloomSmoothing;
        e.mipmapBlurPass.radius = DEBUG_TUNING.bloomRadius;
        e.mipmapBlurPass.levels = DEBUG_TUNING.bloomLevels;
    }, 0 );

    const [ bloom ] = useState( () => (
        <Bloom
            ref={ effect }
            mipmapBlur
            intensity={ config.intensity }
            luminanceThreshold={ config.threshold }
            luminanceSmoothing={ config.smoothing }
            radius={ config.radius }
            levels={ config.levels }
        />
    ) );

    return bloom;
}
