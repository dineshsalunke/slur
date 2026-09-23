import type { Track } from '@slur/shared';
import { useQuery } from 'koota/react';
import { Fragment } from 'react';
import { Render } from '../ecs/traits';
import { ShipView } from './ship-view';

export function Ships( { track }: { track: Track } ) {
    const ships = useQuery( Render );
    return (
        <Fragment>
            { ships.map( ( e ) => (
                <ShipView key={ e.id() } entity={ e } track={ track } />
            ) ) }
        </Fragment>
    );
}
