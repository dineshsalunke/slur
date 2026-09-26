import { Canvas } from '@react-three/fiber';
import { resolveTrack, type TrackGen } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { Fragment, useMemo } from 'react';
import { FrameTap } from '../../../dev/frame-tap';
import { TuningPanelMount } from '../../../dev/tuning-panel-mount';
import { world } from '../../../game/ecs/world';
import { FinishFade } from '../../../game/finish/finish-fade';
import { CANVAS_GL } from '../../../game/scene/canvas-gl';
import { MineShock } from '../../../game/scene/mine-shock';
import { RearView } from '../../../game/scene/rear-view';
import { WorldScene } from '../../../game/scene/world-scene';
import { TrackContext } from '../../../game/track-context/track-context.constants';
import { LocalBoltField } from '../local-bolt-field/local-bolt-field';
import { LocalLoop } from '../local-loop/local-loop';
import { LocalMineField } from '../local-mine-field/local-mine-field';
import { LocalPickupField } from '../local-pickup-field/local-pickup-field';
import { LocalSeekerField } from '../local-seeker-field/local-seeker-field';
import { LocalShip } from '../local-ship';
import { TestLevelHud } from '../test-level-hud';
import { testLevelDescriptor } from './test-level-canvas.utils';

export function TestLevelCanvas( { gen }: { gen: TrackGen } ) {
    const track = useMemo( () => resolveTrack( testLevelDescriptor( gen ) ), [ gen ] );

    return (
        <Fragment>
            <WorldProvider world={ world }>
                <TrackContext value={ track }>
                    <div className="fixed inset-0">
                        <Canvas gl={ CANVAS_GL } camera={ { fov: 75, near: 1, far: 1000, position: [ 0, 5, -13 ] } }>
                            <WorldScene>
                                <LocalShip />
                                <LocalLoop />
                                <LocalPickupField />
                                <LocalBoltField />
                                <LocalSeekerField />
                                <LocalMineField />
                                <MineShock />
                                <RearView />
                                <FrameTap />
                            </WorldScene>
                        </Canvas>
                    </div>
                    <TestLevelHud />
                    <FinishFade />
                </TrackContext>
            </WorldProvider>
            <TuningPanelMount />
        </Fragment>
    );
}
