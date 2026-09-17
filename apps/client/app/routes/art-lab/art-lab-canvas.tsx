import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { procgenDescriptor, resolveTrack } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { Fragment, Suspense, useMemo } from 'react';
import { world } from '../../game/ecs/world';
import type { EnvConfig } from '../../game/scene/env-config';
import { Environment } from '../../game/scene/environment';
import { FinishGate } from '../../game/scene/finish-gate';
import { SceneBackdrop } from '../../game/scene/scene-backdrop';
import { Ships } from '../../game/scene/ship';
import { TrackFloor } from '../../game/scene/track-floor';
import { TrackView } from '../../game/scene/track-view';
import { ArtLabRig } from './art-lab-rig';
import type { LabLayers } from './lab-layers';

/**
 * The art lab's WebGL half: the REAL materialized track, the REAL ships, the REAL chase camera and the
 * REAL post stack — with no room, no server and no networking in the path. `resolveTrack` is a pure
 * function of the seed, and `simulate()` takes the track as an argument, so the whole gameplay-visual
 * surface is reachable offline. Nothing here is a lab-only approximation; that is the point, because an
 * art review against an approximation is worthless.
 *
 * Contrast with `/env-lab`, which flies the flat neon-grid `Track` and cannot show a single real hazard.
 *
 * `layers` mounts/unmounts the four scene halves so the lab can be stripped back to track-only (its
 * default) for a surface review. Nothing is deleted — every layer is one click away in the controls.
 */
export function ArtLabCanvas( {
    seed,
    env,
    bloom,
    layers,
}: {
    seed: number;
    env: EnvConfig;
    bloom: boolean;
    layers: LabLayers;
} ) {
    // Rebuilding on seed change is the intended structural re-render — a different seed IS a different
    // track. It is a pure function, so there is nothing to tear down.
    const track = useMemo( () => resolveTrack( procgenDescriptor( seed ) ), [ seed ] );

    return (
        <WorldProvider world={ world }>
            <Canvas style={ { position: 'fixed', inset: 0 } } camera={ { fov: 70, position: [ 0, 9, -14 ] } }>
                <ambientLight intensity={ 0.4 } />
                { /* A key light so the slab has a shading gradient to catch. With ambient alone every
                     surface renders flat and the grain/panel detail has nothing to modulate. */ }
                <directionalLight position={ [ 40, 80, -30 ] } intensity={ 1.1 } />
                { /* Mounted FIRST so its useFrame advances sim.z before TrackView/Environment read it. */ }
                <ArtLabRig track={ track } />
                { layers.env ? <Environment config={ env } seed={ seed } /> : null }
                { /* Backdrop is its own layer, independent of `env`: the nebula is the "Cold Space" half of
                     the north star and is worth judging the track against even with fog/stars/walls muted.
                     Mounted AFTER Environment deliberately — Environment also attaches a background, and
                     last attach wins, so this ordering lets the nebula override the flat void when both are
                     on. Suspense because `useTexture` loads async; the fallback holds the void colour so
                     there is no flash before the image arrives. */ }
                <Suspense fallback={ <color attach="background" args={ [ env.background ] } /> }>
                    { layers.backdrop ? (
                        <SceneBackdrop />
                    ) : (
                        /* Without a background three clears to the renderer default and the whole review
                           happens against an untinted black. */
                        <color attach="background" args={ [ env.background ] } />
                    ) }
                </Suspense>
                { layers.hazards ? <TrackView track={ track } showFloor={ ! layers.slab } /> : null }
                { /* The generated slab, side-by-side comparable with TrackView's instanced floor. */ }
                { layers.slab ? <TrackFloor track={ track } /> : null }
                { layers.finish ? <FinishGate track={ track } /> : null }
                { /* Ships OFF hides the MESH only — the rig, the shared simulate() and the chase camera
                     keep running, so you still fly the real track at the real speed. */ }
                { layers.ships ? <Ships /> : null }
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
