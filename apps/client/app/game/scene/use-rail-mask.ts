import { LEAD_SEGMENTS, type Track } from '@slur/shared';
import { useMemo } from 'react';
import type { RailMask } from './rail-glow';
import { segmentCount } from './track-floor/track-floor.utils';
import { trackRails } from './track-rails.state';

export function useRailMask( track: Track ): RailMask {
    return useMemo( () => {
        const rails = trackRails( track, segmentCount( track ) );
        return { texture: { current: rails.mask }, count: rails.segments + LEAD_SEGMENTS };
    }, [ track ] );
}
