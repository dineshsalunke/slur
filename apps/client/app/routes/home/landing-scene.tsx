import { Canvas } from '@react-three/fiber';
import { resolveTrack, type TrackDescriptor } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { world } from '../../game/ecs/world';
import { BackFill } from '../../game/scene/back-fill';
import { CANVAS_GL } from '../../game/scene/canvas-gl';
import { EngineLight } from '../../game/scene/engine-light';
import { ExhaustField } from '../../game/scene/exhaust-field';
import { GameEnvironment } from '../../game/scene/game-environment';
import { NearFill } from '../../game/scene/near-fill';
import { SceneEffects } from '../../game/scene/scene-effects';
import { SceneEnvironment } from '../../game/scene/scene-environment';
import { TrackView } from '../../game/scene/track-view';
import { LandingRig } from './landing-rig';
import { LandingShip } from './landing-ship';

const BACKDROP: TrackDescriptor = {
    kind: 'procgen',
    seed: 0x5107,
    tier: 0,
    length: 160,
    blockDensity: 0,
    gapChance: 0,
};
const LOOP_MARGIN = 400;
const track = resolveTrack( BACKDROP );

export function LandingScene() {
    return (
        <WorldProvider world={ world }>
            <Canvas
                gl={ CANVAS_GL }
                aria-hidden="true"
                style={ { position: 'fixed', inset: 0, zIndex: 0 } }
                camera={ { fov: 75, near: 1, far: 1000, position: [ 0, 5, -13 ] } }
            >
                <LandingRig loopZ={ track.finishZ - LOOP_MARGIN } />
                <GameEnvironment track={ track } />
                <SceneEnvironment />
                <BackFill />
                <NearFill />
                <EngineLight />
                <ExhaustField />
                <TrackView track={ track } />
                <LandingShip />
                <SceneEffects />
            </Canvas>
        </WorldProvider>
    );
}
