import { Canvas } from '@react-three/fiber';
import { resolveTrack, type TrackDescriptor } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { DebugPanel } from '../../dev/debug-panel';
import { world } from '../../game/ecs/world';
import { WorldScene } from '../../game/scene/world-scene';
import { LocalLoop } from './local-loop';
import { LocalShip } from './local-ship';

const TEST_LEVEL_SEED = 20260921;
const TEST_LEVEL_SEGMENTS = 40;

const descriptor: TrackDescriptor = {
    kind: 'procgen',
    seed: TEST_LEVEL_SEED,
    tier: 0,
    length: TEST_LEVEL_SEGMENTS,
};

const track = resolveTrack( descriptor );

export function TestLevelCanvas() {
    return (
        <WorldProvider world={ world }>
            <Canvas style={ { position: 'fixed', inset: 0 } } camera={ { fov: 75, position: [ 0, 5, -13 ] } }>
                <WorldScene track={ track } blocks={ false }>
                    <LocalShip />
                    <LocalLoop track={ track } />
                </WorldScene>
            </Canvas>
            <DebugPanel />
        </WorldProvider>
    );
}
