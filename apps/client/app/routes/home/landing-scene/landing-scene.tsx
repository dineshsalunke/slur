import { Canvas } from '@react-three/fiber';
import { WorldProvider } from 'koota/react';
import { RenderScale } from '../../../dev/render-scale';
import { renderDpr } from '../../../dev/render-scale.utils';
import { world } from '../../../game/ecs/world';
import { CANVAS_GL } from '../../../game/scene/canvas-gl';
import { EngineLight } from '../../../game/scene/engine-light/engine-light';
import { ExhaustField } from '../../../game/scene/exhaust-field/exhaust-field';
import { GameEnvironment } from '../../../game/scene/game-environment';
import { PlainRender } from '../../../game/scene/plain-render/plain-render';
import { SceneEffects } from '../../../game/scene/scene-effects/scene-effects';
import { SceneEnvironment } from '../../../game/scene/scene-environment';
import { TrackView } from '../../../game/scene/track-view';
import { TrackContext } from '../../../game/track-context/track-context.constants';
import { QualityGate } from '../../../quality/quality-gate/quality-gate';
import { LandingRig } from '../landing-rig/landing-rig';
import { LandingShip } from '../landing-ship/landing-ship';
import { LOOP_MARGIN, track } from './landing-scene.constants';
import { prepareLanding } from './prepare-landing';

export function LandingScene() {
    return (
        <WorldProvider world={ world }>
            <div className="fixed inset-0 z-0">
                <Canvas
                    gl={ CANVAS_GL }
                    dpr={ renderDpr() }
                    onCreated={ prepareLanding }
                    aria-hidden="true"
                    camera={ { fov: 75, near: 1, far: 1000, position: [ 0, 5, -13 ] } }
                >
                    <TrackContext value={ track }>
                        <LandingRig loopZ={ track.finishZ - LOOP_MARGIN } />
                        <GameEnvironment />
                        <SceneEnvironment />
                        <RenderScale />
                        <EngineLight />
                        <ExhaustField />
                        <TrackView />
                        <LandingShip />
                        <QualityGate feature="post" fallback={ <PlainRender /> }>
                            <SceneEffects />
                        </QualityGate>
                    </TrackContext>
                </Canvas>
            </div>
        </WorldProvider>
    );
}
