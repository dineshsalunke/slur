import { useFrame } from '@react-three/fiber';
import { Bloom } from '@react-three/postprocessing';
import type { BloomEffect } from 'postprocessing';
import { useRef, useState } from 'react';
import type { BloomConfig } from '../game/scene/env-config';
import { DEBUG_TUNING } from './debug-tuning';

/** DEV only: writes the panel's values onto the LIVE effect. Prop-driven knobs are inert — a prop change
 *  makes R3F reconstruct the BloomEffect, and EffectComposer's EffectPass keeps rendering the old, disposed
 *  one. All five are live setters in postprocessing 6.39.4, so radius/levels need no remount either. */
export function DevBloom( { config }: { config: BloomConfig } ) {
    const effect = useRef< BloomEffect >( null );

    // Priority 0: fiber drops its own render when any subscriber has priority > 0, which is what makes
    // EffectComposer (priority 1) the renderer. 0 also runs first, so the write lands in the same frame.
    useFrame( () => {
        const e = effect.current;
        if ( ! e ) return;
        e.intensity = DEBUG_TUNING.bloomIntensity;
        e.luminanceMaterial.threshold = DEBUG_TUNING.bloomThreshold;
        e.luminanceMaterial.smoothing = DEBUG_TUNING.bloomSmoothing;
        e.mipmapBlurPass.radius = DEBUG_TUNING.bloomRadius;
        e.mipmapBlurPass.levels = DEBUG_TUNING.bloomLevels;
    }, 0 );

    // Built once: postprocessing 3.0.4 memoises an effect's `args` on `JSON.stringify(props)` and React 19
    // passes `ref` as a prop, so re-rendering this throws on the mounted effect's circular `__r3f`.
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
