import { DEFAULT_SHIP } from '@slur/shared';
import type { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { Suspense } from 'react';
import { Net, Render } from '../ecs/traits';
import { ShipModel } from './ship-model';

export function ShipView( { entity }: { entity: Entity } ) {
    const group = entity.get( Render );
    const net = useTrait( entity, Net );
    if ( ! group ) return null;
    const shipId = net?.shipId ?? DEFAULT_SHIP;
    return (
        <primitive object={ group }>
            <Suspense fallback={ null }>
                <ShipModel key={ shipId } entity={ entity } shipId={ shipId } />
            </Suspense>
        </primitive>
    );
}
