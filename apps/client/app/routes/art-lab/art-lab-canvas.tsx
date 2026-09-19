import { Canvas } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import { procgenDescriptor, resolveTrack } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { Fragment, Suspense, useMemo } from 'react';
import { FrameTap } from '../../dev/frame-tap';
import { TunedBloom } from '../../dev/tuned-bloom';
import { world } from '../../game/ecs/world';
import type { EnvConfig } from '../../game/scene/env-config';
import { Environment } from '../../game/scene/environment';
import { FinishGate } from '../../game/scene/finish-gate';
import { SceneLighting } from '../../game/scene/lighting';
import { Ships } from '../../game/scene/ship';
import { TrackBlocks } from '../../game/scene/track-blocks';
import { TrackBoundary } from '../../game/scene/track-boundary';
import { TrackFloor } from '../../game/scene/track-floor';
import { TunableSky } from '../iso-sky/tunable-sky';
import { ArtLabRig } from './art-lab-rig';
import type { LabLayers } from './lab-layers';
import { SceneProbe } from './scene-probe';
import { ShipBox } from './ship-box';

/**
 * The art lab's WebGL half: the shipped track, ships, chase camera and post stack, with no room, no
 * server and no networking in the path.
 *
 * Nothing here is a lab-only approximation — an art review against an approximation is worthless, which
 * is also why `/env-lab`'s flat neon-grid track is no substitute for this one.
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
                { /* NO lab-only lights: the sky rig and the track's own emissives, nothing else. A flat
                     ambient would contradict the direction's "no fill, shadow sides go black". */ }
                { /* Mounted FIRST so its useFrame advances sim.z before the track and Environment read it. */ }
                <SceneLighting />
                <ArtLabRig track={ track } />
                { import.meta.env.DEV && <SceneProbe /> }
                { layers.env ? <Environment config={ env } seed={ seed } /> : null }
                { /* The void colour and the sky's LIGHT rig both stay unconditional: with no lab lights
                     left, unmounting the sky with the toggle would make `backdrop` mean "pitch black". It
                     hides only the visible patch. Suspense because `useTexture` loads async. */ }
                <color attach="background" args={ [ env.background ] } />
                { /* TunableSky, not the frozen DEEP_SPACE: it reads the same SKY_TUNING singleton /iso-sky
                     writes, so the two labs cannot disagree about what ships. */ }
                <Suspense fallback={ null }>
                    <TunableSky backdrop={ layers.backdrop } />
                </Suspense>
                { /* Deck, boundary and blocks mount independently so each can be judged without the other
                     two in the shot. The game composes all three via TrackView. Boundary OFF leaves the
                     deck's corner unsurfaced on purpose — that is the A/B for what the strip is doing. */ }
                { layers.floor ? <TrackFloor track={ track } /> : null }
                { layers.boundary ? <TrackBoundary track={ track } /> : null }
                { layers.blocks ? <TrackBlocks track={ track } /> : null }
                { layers.finish ? <FinishGate track={ track } /> : null }
                { /* Ships OFF hides the MESH only — the rig, simulate() and the chase camera keep running,
                     so you still fly the real track at the real speed. */ }
                { layers.ships ? <Ships /> : null }
                { layers.shipBox ? <ShipBox /> : null }
                { bloom ? (
                    <EffectComposer multisampling={ 0 }>
                        <TunedBloom config={ env.bloom } />
                    </EffectComposer>
                ) : (
                    /* Bloom OFF is a first-class review mode: the direction requires that "readability
                       should survive with bloom disabled". */
                    <Fragment />
                ) }
                { /* Photographs this route from a tab nobody is looking at. Never on /game — it advances
                     the sim. The DEV gate keeps it OUT of the bundle, not merely inert in it. */ }
                { import.meta.env.DEV && <FrameTap /> }
            </Canvas>
        </WorldProvider>
    );
}
