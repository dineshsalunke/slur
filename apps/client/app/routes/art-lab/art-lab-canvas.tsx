import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { procgenDescriptor, resolveTrack } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { Fragment, Suspense, useMemo } from 'react';
import { world } from '../../game/ecs/world';
import type { EnvConfig } from '../../game/scene/env-config';
import { Environment } from '../../game/scene/environment';
import { FinishGate } from '../../game/scene/finish-gate';
import { Ships } from '../../game/scene/ship';
import { TrackBlocks } from '../../game/scene/track-blocks';
import { TrackFloor } from '../../game/scene/track-floor';
import { TrackRibbon } from '../../game/scene/track-ribbon';
import { TunableSky } from '../iso-sky/tunable-sky';
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
                { /* NO lab-only lights. The lab is lit by the shipped sky rig and the track's own emissives,
                     and by nothing else — a flat ambient would also contradict the direction's "no fill,
                     shadow sides go black". A review under lighting the game does not have is worthless. */ }
                { /* Mounted FIRST so its useFrame advances sim.z before TrackView/Environment read it. */ }
                <ArtLabRig track={ track } />
                { layers.env ? <Environment config={ env } seed={ seed } /> : null }
                { /* Backdrop is its own layer, independent of `env`: the nebula is the "Cold Space" half of
                     the north star and is worth judging the track against even with fog/stars/walls muted.
                     The void colour is now UNCONDITIONAL — the sky used to be `scene.background` and the two
                     fought over which attached last, whereas `DeepSpaceSky` is geometry on a camera-locked
                     patch and simply sits in front of the void. Suspense because `useTexture` loads async.
                     The RIG is unconditional too: `backdrop` hides only the visible patch, because with no
                     lab lights left, unmounting the whole sky would make the toggle mean "pitch black". */ }
                <color attach="background" args={ [ env.background ] } />
                { /* TunableSky, not the frozen DEEP_SPACE: framing (pan/tilt/fov) is a chase-camera
                     judgement with a track in frame, which /iso-sky's free orbit cannot make. It reads the
                     same SKY_TUNING singleton, so the two labs cannot disagree about what ships. */ }
                <Suspense fallback={ null }>
                    <TunableSky backdrop={ layers.backdrop } />
                </Suspense>
                { /* Ribbon and blocks mount independently — the rail is this task's subject and must be
                     judgeable without untextured boxes in the shot. The game composes both via TrackView. */ }
                { layers.rails ? <TrackRibbon track={ track } showFloor={ ! layers.slab } /> : null }
                { layers.blocks ? <TrackBlocks track={ track } /> : null }
                { /* The generated slab, side-by-side comparable with the instanced floor quads. */ }
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
