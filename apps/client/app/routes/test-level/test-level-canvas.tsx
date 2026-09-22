import { Canvas } from '@react-three/fiber';
import { resolveTrack, type TrackDescriptor } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { useMemo } from 'react';
import * as THREE from 'three';
import { world } from '../../game/ecs/world';
import { WorldScene } from '../../game/scene/world-scene';
import { LocalLoop } from './local-loop';
import { LocalShip } from './local-ship';

const TEST_LEVEL_SEED = 20260921;
const TEST_LEVEL_SEGMENTS = 120;
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
        <WorldProvider world={ world }>
            <Canvas
                gl={ { toneMapping: THREE.NeutralToneMapping } }
                style={ { position: 'fixed', inset: 0 } }
                camera={ { fov: 75, near: 1, far: 1000, position: [ 0, 5, -13 ] } }
            >
                <WorldScene track={ track }>
                    <LocalShip />
                    <LocalLoop track={ track } />
                </WorldScene>
            </Canvas>
        </WorldProvider>
    );
}
