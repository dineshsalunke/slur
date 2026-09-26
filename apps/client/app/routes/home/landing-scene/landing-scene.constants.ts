import { resolveTrack, type TrackDescriptor } from '@slur/shared';

export const BACKDROP: TrackDescriptor = {
    kind: 'procgen',
    seed: 0x5107,
    tier: 0,
    length: 160,
    blockDensity: 0,
    gapChance: 0,
};
export const LOOP_MARGIN = 400;
export const track = resolveTrack( BACKDROP );
