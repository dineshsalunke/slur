import { useQuery } from 'koota/react';
import { Fragment } from 'react';
import { Render } from '../ecs/traits';
import { ShipView } from './ship-view';

// Query Render → every ship (local + remote) mounts a view; re-renders ONLY on spawn/despawn, never per
// frame. Each ShipView owns its own model + subscribes to its Net trait so a class hot-swap swaps just
// that ship's model (the per-ship reactivity is colocated at the leaf, per r3f.md).
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
