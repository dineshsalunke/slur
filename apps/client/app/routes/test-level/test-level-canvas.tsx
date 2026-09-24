import { Canvas } from '@react-three/fiber';
import { resolveTrack, type TrackDescriptor } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { Fragment, useMemo } from 'react';
import { FrameTap } from '../../dev/frame-tap';
import { TuningPanelMount } from '../../dev/tuning-panel-mount';
import { world } from '../../game/ecs/world';
import { FinishFade } from '../../game/finish/finish-fade';
import { CANVAS_GL } from '../../game/scene/canvas-gl';
import { RearView } from '../../game/scene/rear-view';
import { WorldScene } from '../../game/scene/world-scene';
import { LocalBoltField } from './local-bolt-field';
import { LocalLoop } from './local-loop';
import { LocalPickupField } from './local-pickup-field';
import { LocalSeekerField } from './local-seeker-field';
import { LocalShip } from './local-ship';
import { TestLevelHud } from './test-level-hud';

const TEST_LEVEL_SEED = 20260921;
const TEST_LEVEL_SEGMENTS = 420;
const TEST_LEVEL_BLOCK_DENSITY = 0.6;
const TEST_LEVEL_GAP_CHANCE = 1;

function testLevelDescriptor(): TrackDescriptor {
    return {
        kind: 'procgen',
        seed: TEST_LEVEL_SEED,
        tier: 0,
        length: TEST_LEVEL_SEGMENTS,
        blockDensity: TEST_LEVEL_BLOCK_DENSITY,
        gapChance: TEST_LEVEL_GAP_CHANCE,
    };
}

export function TestLevelCanvas() {
    const track = useMemo( () => resolveTrack( testLevelDescriptor() ), [] );

    return (
        <Fragment>
            <WorldProvider world={ world }>
                <Canvas
                    gl={ CANVAS_GL }
                    style={ { position: 'fixed', inset: 0 } }
                    camera={ { fov: 75, near: 1, far: 1000, position: [ 0, 5, -13 ] } }
                >
                    <WorldScene track={ track }>
                        <LocalShip />
                        <LocalLoop track={ track } />
                        <LocalPickupField track={ track } />
                        <LocalBoltField />
                        <LocalSeekerField />
                        <RearView />
                        <FrameTap />
                    </WorldScene>
                </Canvas>
                <TestLevelHud track={ track } />
                <FinishFade />
            </WorldProvider>
            <TuningPanelMount />
        </Fragment>
    );
}
