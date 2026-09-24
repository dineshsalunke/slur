import type { ShipId } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { Hover, LocalPlayer, Net, Prev, Render, Sim } from '../../game/ecs/traits';
import { localRole } from '../../game/spectator';

export function ReplayShip( { shipId }: { shipId: ShipId } ) {
    const world = useWorld();

    // JUSTIFIED EFFECT — syncs with an external system: the koota ECS world (module singleton) that owns the replayed ship.
    useEffect( () => {
        localRole.spectating = false;
        const ship = world.spawn(
            Render,
            Hover,
            Net( { sessionId: 'song-lab', shipId, colorId: 0 } ),
            Sim,
            Prev,
            LocalPlayer,
        );
        return () => ship.destroy();
    }, [ world, shipId ] );

    return null;
}
