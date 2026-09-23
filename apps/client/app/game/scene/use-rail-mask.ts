import { LEAD_SEGMENTS, type Track } from '@slur/shared';
import { useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { type RailMask, type RailMaskData, railMaskData } from './rail-glow';
import { segmentCount } from './track-floor';
import { buildRailRuns } from './track-rails';

export function useRailMask( track: Track ): { data: RailMaskData; railMask: RailMask } {
    const data = useMemo( () => {
        const segments = segmentCount( track );
        return railMaskData( buildRailRuns( track, segments ), segments );
    }, [ track ] );
    const count = segmentCount( track ) + LEAD_SEGMENTS;
    const texture = useRef< THREE.DataTexture | null >( null );
    const railMask = useMemo< RailMask >( () => ( { texture, count } ), [ count ] );
    return { data, railMask };
}
