import { TRACK_GEN_SEGMENTS, type TrackDescriptor, type TrackGen } from '@slur/shared';
import {
    TEST_LEVEL_BLOCK_DENSITY,
    TEST_LEVEL_GAP_CHANCE,
    TEST_LEVEL_SEED,
    TEST_LEVEL_SEGMENTS,
} from './test-level-canvas.constants';

export function testLevelDescriptor( gen: TrackGen ): TrackDescriptor {
    return {
        kind: 'procgen',
        seed: TEST_LEVEL_SEED,
        tier: 0,
        length: gen === 'phrase' ? TRACK_GEN_SEGMENTS.phrase : TEST_LEVEL_SEGMENTS,
        blockDensity: TEST_LEVEL_BLOCK_DENSITY,
        gapChance: TEST_LEVEL_GAP_CHANCE,
        gen,
    };
}
