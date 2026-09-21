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
    const track = useMemo( () => resolveTrack( procgenDescriptor( seed ) ), [ seed ] );

    return (
        <WorldProvider world={ world }>
            <Canvas style={ { position: 'fixed', inset: 0 } } camera={ { fov: 70, position: [ 0, 9, -14 ] } }>
                <SceneLighting />
                <ArtLabRig track={ track } />
                { import.meta.env.DEV && <SceneProbe /> }
                { layers.env ? <Environment config={ env } seed={ seed } /> : null }
                <color attach="background" args={ [ env.background ] } />
                <Suspense fallback={ null }>
                    <TunableSky backdrop={ layers.backdrop } />
                </Suspense>
                { layers.floor ? <TrackFloor track={ track } /> : null }
                { layers.boundary ? <TrackBoundary track={ track } /> : null }
                { layers.blocks ? <TrackBlocks track={ track } /> : null }
                { layers.finish ? <FinishGate track={ track } /> : null }
                { layers.ships ? <Ships /> : null }
                { layers.shipBox ? <ShipBox /> : null }
                { bloom ? (
                    <EffectComposer multisampling={ 0 }>
                        <TunedBloom config={ env.bloom } />
                    </EffectComposer>
                ) : (
                    <Fragment />
                ) }
                { import.meta.env.DEV && <FrameTap /> }
            </Canvas>
        </WorldProvider>
    );
}
