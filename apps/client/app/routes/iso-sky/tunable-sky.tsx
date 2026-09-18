import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { ProceduralSky } from '../../game/scene/procedural-sky';
import { DEEP_SPACE, nebulaFrequency, starDirection } from '../../game/scene/sky-config';
import { SKY_TUNING, type SkyTuningColour } from './sky-tuning';

/** Which tuning colour feeds which dome uniform. */
const COLOUR_UNIFORMS: readonly ( readonly [ SkyTuningColour, string ] )[] = [
    [ 'zenith', 'uZenith' ],
    [ 'horizon', 'uHorizon' ],
    [ 'nadir', 'uNadir' ],
    [ 'ramp0', 'uRamp0' ],
    [ 'ramp1', 'uRamp1' ],
    [ 'ramp2', 'uRamp2' ],
];

/**
 * The real shipped `<ProceduralSky>`, with the tuning panel's live values pushed into its dome uniforms every
 * frame. It renders the game's own component rather than a lab copy, so what is being tuned here IS what ships.
 *
 * WHY `useFrame` AND NOT PROPS: the alternative was slider → React state → prop → `<ProceduralSky>`, which
 * reconciles the scene subtree on every tick of a drag. Options weighed were props-from-route state (banned
 * outright — a route entry module rendering a Canvas must call zero hooks, `scripts/check-canvas-isolation.mjs`),
 * `useSyncExternalStore` at the dome leaf (one React render per tick, better but still per-tick), drei `<Html>`
 * controls inside the Canvas, and `addEffect` (for out-of-Canvas work — this is in-Canvas). `useFrame` writing
 * uniforms imperatively is the stack's purpose-built answer and costs zero re-renders.
 */
export function TunableSky() {
    const material = useRef< THREE.ShaderMaterial | null >( null );
    const octaves = useRef( SKY_TUNING.octaves );
    // Colours arrive as hex STRINGS and `Color.set` re-parses one on every call, so track what is already on
    // the GPU and only push a changed stop.
    const applied = useRef< Record< SkyTuningColour, string > >( {
        zenith: '',
        horizon: '',
        nadir: '',
        ramp0: '',
        ramp1: '',
        ramp2: '',
    } );

    useFrame( () => {
        const m = material.current;
        if ( ! m ) return;
        const u = m.uniforms;
        const a = applied.current;

        for ( let i = 0; i < COLOUR_UNIFORMS.length; i++ ) {
            const [ key, uniform ] = COLOUR_UNIFORMS[ i ];
            const next = SKY_TUNING[ key ];
            if ( a[ key ] === next ) continue;
            a[ key ] = next;
            u[ uniform ].value.set( next );
        }

        u.uFrequency.value = nebulaFrequency( SKY_TUNING.featureSizeDeg );
        u.uWarp.value = SKY_TUNING.warp;
        u.uRidge.value = SKY_TUNING.ridge;
        u.uThreshold.value = SKY_TUNING.threshold;
        u.uSoftness.value = SKY_TUNING.softness;
        u.uOpacity.value = SKY_TUNING.opacity;
        u.uGain.value = SKY_TUNING.gain;

        u.uMaskFrequency.value = nebulaFrequency( SKY_TUNING.maskFeatureSizeDeg );
        u.uMaskThreshold.value = SKY_TUNING.maskThreshold;
        u.uMaskSoftness.value = SKY_TUNING.maskSoftness;
        u.uDustFrequency.value = nebulaFrequency( SKY_TUNING.dustFeatureSizeDeg );
        u.uDustThreshold.value = SKY_TUNING.dustThreshold;
        u.uDustSoftness.value = SKY_TUNING.dustSoftness;
        u.uDustStrength.value = SKY_TUNING.dustStrength;
        u.uLightContrast.value = SKY_TUNING.lightContrast;
        u.uCoreOnset.value = SKY_TUNING.coreOnset;
        u.uStarDir.value.set( ...starDirection( SKY_TUNING.starBearingDeg, SKY_TUNING.starElevationDeg ) );

        // OCTAVES is a #define, so it needs a program recompile — guarded to fire only on an actual change.
        if ( octaves.current !== SKY_TUNING.octaves ) {
            octaves.current = SKY_TUNING.octaves;
            m.defines.OCTAVES = SKY_TUNING.octaves;
            m.needsUpdate = true;
        }
    } );

    return <ProceduralSky config={ DEEP_SPACE } domeMaterialRef={ material } />;
}
