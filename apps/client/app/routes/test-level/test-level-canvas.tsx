import { Canvas } from '@react-three/fiber';
import { resolveTrack, type TrackDescriptor } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { Fragment } from 'react';
import { TuningPanel } from '../../dev/tuning-panel';
import { world } from '../../game/ecs/world';
import { WorldScene } from '../../game/scene/world-scene';
import { LocalLoop } from './local-loop';
import { LocalShip } from './local-ship';

const TEST_LEVEL_SEED = 20260921;
const TEST_LEVEL_SEGMENTS = 120;

const descriptor: TrackDescriptor = {
    kind: 'procgen',
    seed: TEST_LEVEL_SEED,
    tier: 0,
    length: TEST_LEVEL_SEGMENTS,
    blockDensity: 0,
    gapChance: 1,
};

const track = resolveTrack( descriptor );

export function TestLevelCanvas() {
    return (
        <Fragment>
            <WorldProvider world={ world }>
                <Canvas
                    flat
                    style={ { position: 'fixed', inset: 0 } }
                    camera={ { fov: 75, near: 1, far: 1000, position: [ 0, 5, -13 ] } }
                >
                    <WorldScene track={ track }>
                        <LocalShip />
                        <LocalLoop track={ track } />
                    </WorldScene>
                </Canvas>
            </WorldProvider>
            { import.meta.env.DEV ? <TuningPanel /> : null }
        </Fragment>
    );
}
