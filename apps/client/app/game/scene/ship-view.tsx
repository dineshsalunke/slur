import { DEFAULT_SHIP } from '@slur/shared';
import type { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { Fragment, Suspense } from 'react';
import { FeatureShipViews } from '../../engine/feature-ship-views/feature-ship-views';
import { Net, Render } from '../ecs/traits';
import { ShipModel } from './ship-model/ship-model';
import { ShipShadow } from './ship-shadow/ship-shadow';

export function ShipView( { entity }: { entity: Entity } ) {
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
                <FeatureShipViews entity={ entity } shipId={ shipId } />
            </primitive>
            <ShipShadow entity={ entity } shipId={ shipId } />
        </Fragment>
    );
}
