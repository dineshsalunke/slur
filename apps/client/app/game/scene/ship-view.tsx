import { DEFAULT_SHIP, DEFAULT_SIM_CONFIG } from '@slur/shared';
import type { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { Fragment, Suspense } from 'react';
import { Net, Render } from '../ecs/traits';
import { ShieldDome } from './shield-dome/shield-dome';
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
                <ShieldDome entity={ entity } shipId={ shipId } windowS={ DEFAULT_SIM_CONFIG.shieldS } />
            </primitive>
            <ShipShadow entity={ entity } shipId={ shipId } />
        </Fragment>
    );
}
