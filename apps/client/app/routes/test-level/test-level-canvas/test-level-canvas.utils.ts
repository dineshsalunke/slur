import { DEFAULT_TRACK_GEN, isTrackGen, phraseSegments, type TrackDescriptor } from '@slur/shared';
import {
    TEST_LEVEL_BLOCK_DENSITY,
    TEST_LEVEL_GAP_CHANCE,
    TEST_LEVEL_SEED,
    TEST_LEVEL_SEGMENTS,
} from './test-level-canvas.constants';

export function testLevelDescriptor( param: string | null ): TrackDescriptor {
    const gen = isTrackGen( param ) ? param : DEFAULT_TRACK_GEN;
    return {
        kind: 'procgen',
        seed: TEST_LEVEL_SEED,
        tier: 0,
        length: gen === 'phrase' ? phraseSegments( TEST_LEVEL_SEED ) : TEST_LEVEL_SEGMENTS,
        blockDensity: TEST_LEVEL_BLOCK_DENSITY,
        gapChance: TEST_LEVEL_GAP_CHANCE,
        gen,
    };
}
