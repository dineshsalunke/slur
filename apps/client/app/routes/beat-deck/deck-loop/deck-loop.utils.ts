import { copySimShip, spawnShip } from '@slur/shared';
import type { World } from 'koota';
import { LocalPlayer, Net, Prev, Sim } from '../../../game/ecs/traits';
import { deckState } from '../take-recorder';

export function restartDeckRun( world: World ): void {
    world.query( LocalPlayer, Sim, Prev ).updateEach( ( [ s, prev ] ) => {
        copySimShip( s, spawnShip() );
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
    } );
}

export function applyShipChoice( world: World ): void {
    const ship = world.queryFirst( LocalPlayer, Net );
    const cur = ship?.get( Net );
    const shipId = deckState().shipId;
    if ( ship && cur && cur.shipId !== shipId ) ship.set( Net, { ...cur, shipId } );
}

export function deckFinished( world: World ): boolean {
    return world.queryFirst( LocalPlayer, Sim )?.get( Sim )?.finished ?? false;
}
