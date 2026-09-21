import { HALF_WIDTH, SEG_LEN } from '@slur/shared';
import { useMemo } from 'react';
import { buildSpanGeometry } from '../../game/scene/track-floor';
import { floorSurface } from '../../game/scene/track-materials';

export function TrackSlabSubject() {
    const geo = useMemo( () => buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, -SEG_LEN / 2, SEG_LEN / 2 ), [] );

    return (
        <mesh geometry={ geo }>
            <meshStandardMaterial { ...floorSurface() } />
        </mesh>
    );
}
