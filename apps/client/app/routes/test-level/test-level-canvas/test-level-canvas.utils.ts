import { isTrackGen, phraseSegments, type TrackDescriptor, type TrackGen } from '@slur/shared';
import {
    TEST_LEVEL_BLOCK_DENSITY,
    TEST_LEVEL_GAP_CHANCE,
    TEST_LEVEL_GEN,
    TEST_LEVEL_SEED,
    TEST_LEVEL_SEED_MAX,
    TEST_LEVEL_SEGMENTS,
} from './test-level-canvas.constants';

export function genOf( param: string | null ): TrackGen {
    return isTrackGen( param ) ? param : TEST_LEVEL_GEN;
}

export function seedOf( param: string | null ): number {
    const seed = Number( param );
    return param !== null && Number.isInteger( seed ) && seed >= 1 && seed <= TEST_LEVEL_SEED_MAX
        ? seed
        : TEST_LEVEL_SEED;
}

export function randomSeed(): number {
    return 1 + Math.floor( Math.random() * TEST_LEVEL_SEED_MAX );
}

export function testLevelDescriptor( param: string | null, seed = TEST_LEVEL_SEED ): TrackDescriptor {
    const gen = genOf( param );
    return {
        kind: 'procgen',
        seed,
        tier: 0,
        length: gen === 'phrase' ? phraseSegments( seed ) : TEST_LEVEL_SEGMENTS,
        blockDensity: TEST_LEVEL_BLOCK_DENSITY,
        gapChance: TEST_LEVEL_GAP_CHANCE,
        gen,
    };
}
