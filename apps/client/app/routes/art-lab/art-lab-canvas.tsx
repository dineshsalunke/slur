import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { procgenDescriptor, resolveTrack } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { Fragment, useMemo } from 'react';
import { world } from '../../game/ecs/world';
import type { EnvConfig } from '../../game/scene/env-config';
import { Environment } from '../../game/scene/environment';
import { FinishGate } from '../../game/scene/finish-gate';
import { Ships } from '../../game/scene/ship';
import { TrackView } from '../../game/scene/track-view';
import { ArtLabRig } from './art-lab-rig';

/**
 * The art lab's WebGL half: the REAL materialized track, the REAL ships, the REAL chase camera and the
 * REAL post stack — with no room, no server and no networking in the path. `resolveTrack` is a pure
 * function of the seed, and `simulate()` takes the track as an argument, so the whole gameplay-visual
 * surface is reachable offline. Nothing here is a lab-only approximation; that is the point, because an
 * art review against an approximation is worthless.
 *
 * Contrast with `/env-lab`, which flies the flat neon-grid `Track` and cannot show a single real hazard.
 */
export function ArtLabCanvas( { seed, env, bloom }: { seed: number; env: EnvConfig; bloom: boolean } ) {
    // Rebuilding on seed change is the intended structural re-render — a different seed IS a different
    // track. It is a pure function, so there is nothing to tear down.
    const track = useMemo( () => resolveTrack( procgenDescriptor( seed ) ), [ seed ] );

    return (
        <WorldProvider world={ world }>
            <Canvas style={ { position: 'fixed', inset: 0 } } camera={ { fov: 70, position: [ 0, 9, -14 ] } }>
                <ambientLight intensity={ 0.4 } />
                { /* Mounted FIRST so its useFrame advances sim.z before TrackView/Environment read it. */ }
                <ArtLabRig track={ track } />
                <Environment config={ env } seed={ seed } />
                <TrackView track={ track } />
                <FinishGate track={ track } />
                <Ships />
                { bloom ? (
                    <EffectComposer multisampling={ 0 }>
                        <Bloom
                            mipmapBlur
                            intensity={ env.bloom.intensity }
                            luminanceThreshold={ env.bloom.threshold }
                            luminanceSmoothing={ env.bloom.smoothing }
                        />
                    </EffectComposer>
                ) : (
                    /* Bloom OFF is a first-class review mode, not a debug afterthought: the handoff's
                       implementation notes require that "readability should survive with bloom disabled",
                       and that claim has never been checked. */
                    <Fragment />
                ) }
            </Canvas>
        </WorldProvider>
    );
}
