import { DEFAULT_SHIP, type Track } from '@slur/shared';
import type { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { Fragment, Suspense } from 'react';
import { Net, Render } from '../ecs/traits';
import { ShipModel } from './ship-model';
import { ShipShadow } from './ship-shadow';

export function ShipView( { entity, track }: { entity: Entity; track: Track } ) {
    const group = entity.get( Render );
    const net = useTrait( entity, Net );
    if ( ! group ) return null;
    const shipId = net?.shipId ?? DEFAULT_SHIP;
    return (
        <Fragment>
            <primitive object={ group }>
                <Suspense fallback={ null }>
                    <ShipModel key={ shipId } entity={ entity } shipId={ shipId } />
                </Suspense>
            </primitive>
            <ShipShadow entity={ entity } shipId={ shipId } track={ track } />
        </Fragment>
    );
}
