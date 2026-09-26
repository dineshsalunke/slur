import { copySimShip, spawnShip, type Track } from '@slur/shared';
import type { World } from 'koota';
import { LocalPlayer, Prev, Sim } from '../../../game/ecs/traits';
import { restartLocalCombat } from '../local-combat';
import { restartRunClock } from '../run-clock';

export function localFinished( world: World ): boolean {
    return world.queryFirst( LocalPlayer, Sim )?.get( Sim )?.finished ?? false;
}

export function restartTestRun( world: World, track: Track ): void {
    world.query( LocalPlayer, Sim, Prev ).updateEach( ( [ s, prev ] ) => {
        copySimShip( s, spawnShip() );
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
    } );
    restartLocalCombat( world, track );
    restartRunClock();
}
