import { Canvas } from '@react-three/fiber';
import { WorldProvider } from 'koota/react';
import { Suspense } from 'react';
import { RenderScale } from '../../../dev/render-scale';
import { renderDpr } from '../../../dev/render-scale.utils';
import { world } from '../../../game/ecs/world';
import { CANVAS_GL } from '../../../game/scene/canvas-gl';
import { ExhaustField } from '../../../game/scene/exhaust-field/exhaust-field';
import { GameEnvironment } from '../../../game/scene/game-environment';
import { SceneEffects } from '../../../game/scene/scene-effects/scene-effects';
import { SceneEnvironment } from '../../../game/scene/scene-environment';
import { TrackView } from '../../../game/scene/track-view';
import { TrackContext } from '../../../game/track-context/track-context.constants';
import { LandingReveal } from '../landing-reveal/landing-reveal';
import type { Reveal } from '../landing-reveal/landing-reveal.utils';
import { LandingRig } from '../landing-rig/landing-rig';
import { LandingShip } from '../landing-ship/landing-ship';
import { LOOP_MARGIN, track } from './landing-scene.constants';
import { prepareLanding } from './prepare-landing';

export function LandingScene( { reveal }: { reveal: Reveal } ) {
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
                    <Suspense fallback={ null }>
                        <TrackContext value={ track }>
                            <LandingRig loopZ={ track.finishZ - LOOP_MARGIN } />
                            <GameEnvironment />
                            <SceneEnvironment />
                            <RenderScale />
                            <ExhaustField />
                            <TrackView />
                            <LandingShip />
                            <SceneEffects />
                            <LandingReveal reveal={ reveal } />
                        </TrackContext>
                    </Suspense>
                </Canvas>
            </div>
        </WorldProvider>
    );
}
