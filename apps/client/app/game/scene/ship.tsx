import { useQuery } from 'koota/react';
import { Fragment } from 'react';
import { Render } from '../ecs/traits';
import { ShipView } from './ship-view';

// Every ship mounts a view; this level re-renders only on spawn/despawn, never per frame. The per-ship
// Net subscription is colocated down in ShipView so a class hot-swap touches only that one ship.
export function Ships() {
    const ships = useQuery( Render );
    return (
        <Fragment>
            { ships.map( ( e ) => (
                <ShipView key={ e.id() } entity={ e } />
            ) ) }
        </Fragment>
    );
}
