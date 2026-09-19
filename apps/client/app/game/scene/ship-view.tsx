import { DEFAULT_SHIP } from '@slur/shared';
import type { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { Suspense } from 'react';
import { colorHex } from '../colors';
import { Net, Render } from '../ecs/traits';
import { ShipModel } from './ship-model';

// One ship's view. The Net subscription lives here, at the leaf, so a shipId/colorId change re-renders just
// this ship and not its siblings. Solo ships have no Net and fall back to the default model and colour.
// Per-frame transforms go straight into the entity's Render group; React is never in the movement path.
export function ShipView( { entity }: { entity: Entity } ) {
    const group = entity.get( Render );
    const net = useTrait( entity, Net );
    if ( ! group ) return null;
    const color = colorHex( net?.colorId ?? 0 );
    const shipId = net?.shipId ?? DEFAULT_SHIP;
    return (
        <primitive object={ group }>
            <Suspense fallback={ null }>
                <ShipModel key={ shipId } entity={ entity } shipId={ shipId } color={ color } />
            </Suspense>
        </primitive>
    );
}
