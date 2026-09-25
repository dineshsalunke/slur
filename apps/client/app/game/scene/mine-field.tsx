import { useWorld } from 'koota/react';
import { useCallback } from 'react';
import { MineBodies, type MineSink } from './mine-bodies';
import { collectMineBodies } from './mine-shots';

export function MineField() {
    const world = useWorld();

    const collect = useCallback( ( sink: MineSink ) => collectMineBodies( world, sink ), [ world ] );

    return <MineBodies collect={ collect } />;
}
