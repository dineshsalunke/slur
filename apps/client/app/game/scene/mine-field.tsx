import { useWorld } from 'koota/react';
import { useCallback } from 'react';
import { NetMine } from '../ecs/traits';
import { MineBodies, type MineSink } from './mine-bodies';

export function MineField() {
    const world = useWorld();

    const collect = useCallback(
        ( sink: MineSink ) => {
            world.query( NetMine ).readEach( ( [ m ] ) => sink( m.x, m.y, m.z, m.armed ) );
        },
        [ world ],
    );

    return <MineBodies collect={ collect } />;
}
