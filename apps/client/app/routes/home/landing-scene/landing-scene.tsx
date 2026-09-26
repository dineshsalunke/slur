import { Canvas } from '@react-three/fiber';
import { WorldProvider } from 'koota/react';
import { world } from '../../../game/ecs/world';
import { BackFill } from '../../../game/scene/back-fill/back-fill';
import { CANVAS_GL } from '../../../game/scene/canvas-gl';
import { EngineLight } from '../../../game/scene/engine-light/engine-light';
import { ExhaustField } from '../../../game/scene/exhaust-field/exhaust-field';
import { GameEnvironment } from '../../../game/scene/game-environment';
import { NearFill } from '../../../game/scene/near-fill/near-fill';
import { SceneEffects } from '../../../game/scene/scene-effects';
import { SceneEnvironment } from '../../../game/scene/scene-environment';
import { TrackView } from '../../../game/scene/track-view';
import { TrackContext } from '../../../game/track-context/track-context.constants';
import { LandingRig } from '../landing-rig/landing-rig';
import { LandingShip } from '../landing-ship/landing-ship';
import { LOOP_MARGIN, track } from './landing-scene.constants';

export function LandingScene() {
    return (
        <WorldProvider world={ world }>
            <div className="fixed inset-0 z-0">
                <Canvas
                    gl={ CANVAS_GL }
                    aria-hidden="true"
                    camera={ { fov: 75, near: 1, far: 1000, position: [ 0, 5, -13 ] } }
                >
                    <TrackContext value={ track }>
                        <LandingRig loopZ={ track.finishZ - LOOP_MARGIN } />
                        <GameEnvironment />
                        <SceneEnvironment />
                        <BackFill />
                        <NearFill />
                        <EngineLight />
                        <ExhaustField />
                        <TrackView />
                        <LandingShip />
                        <SceneEffects />
                    </TrackContext>
                </Canvas>
            </div>
        </WorldProvider>
    );
}
