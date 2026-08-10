import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { WorldProvider } from 'koota/react';
import { useEffect, useState } from 'react';
import { world } from '../../game/ecs/world';
import { ENV_VARIANTS } from '../../game/scene/env-config';
import { Environment } from '../../game/scene/environment';
import { Track } from '../../game/scene/track';
import { EnvRig } from './env-rig';

// Throwaway atmosphere lab: a slow flythrough down a stretch of the real neon ribbon (Track) with the
// parameterised Environment layered behind it. Keys 1/2/3 switch between the three variant configs live.
// Isolated on purpose — does NOT touch net-canvas / game-canvas / the existing scene files.
export function EnvLabCanvas() {
    const [ active, setActive ] = useState( 0 );

    // JUSTIFIED EFFECT — external sync: DOM keyboard (window keydown) → variant switch. A discrete keypress
    // is a global input stream, not derivable from render; the listeners ARE the handler and only need a
    // mount-scoped lifetime. setActive drives a STRUCTURAL change (swap the config), not a per-frame update.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            const n = Number( e.key );
            if ( n >= 1 && n <= ENV_VARIANTS.length ) setActive( n - 1 );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [] );

    const config = ENV_VARIANTS[ active ];

    return (
        <WorldProvider world={ world }>
            <div
                style={ {
                    position: 'fixed',
                    top: 16,
                    left: 16,
                    zIndex: 1,
                    pointerEvents: 'none',
                    fontFamily: 'monospace',
                    color: '#8ff',
                    textShadow: '0 0 6px #0af',
                    fontSize: 14,
                    lineHeight: 1.6,
                } }
            >
                <div>{ config.name }</div>
                <div style={ { opacity: 0.7 } }>
                    { ENV_VARIANTS.map( ( v, i ) => `${ i + 1 }:${ v.name.slice( 0, 1 ) }` ).join( '  ' ) } — press
                    1/2/3
                </div>
            </div>

            <Canvas style={ { position: 'fixed', inset: 0 } } camera={ { fov: 75, position: [ 0, 5, -13 ] } }>
                <ambientLight intensity={ 0.4 } />
                <EnvRig />
                <Environment config={ config } seed={ 1234 } />
                <Track />
                <EffectComposer multisampling={ 0 }>
                    <Bloom
                        mipmapBlur
                        intensity={ config.bloom.intensity }
                        luminanceThreshold={ config.bloom.threshold }
                        luminanceSmoothing={ config.bloom.smoothing }
                    />
                </EffectComposer>
            </Canvas>
        </WorldProvider>
    );
}
