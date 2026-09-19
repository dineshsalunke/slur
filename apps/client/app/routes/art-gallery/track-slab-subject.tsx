import { HALF_WIDTH, SEG_LEN } from '@slur/shared';
import { useMemo } from 'react';
import { buildSpanGeometry } from '../../game/scene/track-floor';
import { floorSurface } from '../../game/scene/track-materials';

/**
 * The track slab as the game actually renders it: one capped span at true width and true thickness,
 * carrying the shipped material.
 *
 * A COMPONENT rather than an inline node in `SUBJECTS` because `floorSurface()` reaches for
 * `trackSurfaceTexture()`, which needs `document` — and `SUBJECTS` is imported at module scope by the
 * sidebar and the camera rig for its metadata alone.
 */
export function TrackSlabSubject() {
    const geo = useMemo( () => buildSpanGeometry( -HALF_WIDTH, HALF_WIDTH, -SEG_LEN / 2, SEG_LEN / 2 ), [] );

    return (
        <mesh geometry={ geo }>
            <meshStandardMaterial { ...floorSurface() } />
        </mesh>
    );
}
