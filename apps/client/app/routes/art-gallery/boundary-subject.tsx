import { HALF_WIDTH, SEG_LEN } from '@slur/shared';
import { useMemo } from 'react';
import { buildBoundarySpanGeometry } from '../../game/scene/track-boundary';
import { buildSpanGeometry } from '../../game/scene/track-floor';
import { BOUNDARY_SURFACE, floorSurface } from '../../game/scene/track-materials';

const DECK_W = 8;

/**
 * Deck and strip both, because the strip alone is a floating 0.5u ribbon — what is under review is where
 * it sits. Built at true world X so the deck's panel UVs land where they do in game; the group re-centres
 * it for the gallery slot instead of moving the geometry.
 */
export function BoundarySubject() {
    const x0 = HALF_WIDTH - DECK_W;
    const deck = useMemo( () => buildSpanGeometry( x0, HALF_WIDTH, -SEG_LEN / 2, SEG_LEN / 2 ), [ x0 ] );
    const strip = useMemo( () => buildBoundarySpanGeometry( x0, HALF_WIDTH, -SEG_LEN / 2, SEG_LEN / 2 ), [ x0 ] );

    return (
        <group position={ [ -( HALF_WIDTH - DECK_W / 2 ), 0, 0 ] }>
            <mesh geometry={ deck }>
                <meshStandardMaterial { ...floorSurface() } />
            </mesh>
            <mesh geometry={ strip }>
                <meshStandardMaterial { ...BOUNDARY_SURFACE } />
            </mesh>
        </group>
    );
}
