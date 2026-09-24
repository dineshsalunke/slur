import { copySimShip, spawnShip, type Track, tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import { blockWorld, clearBlockState } from '../../game/block-state';
import { sparkIfBounced } from '../../game/ecs/bounce-spark';
import { LocalPlayer, Net, Prev, Sim } from '../../game/ecs/traits';
import { endReplay, replay, replayView } from './replay-state';
import { replayLive, replayResult, stepReplay } from './replay-step';

export function replayFlightSystem( world: World, dt: number, track: Track ): void {
    world.query( Sim, Prev, Net, LocalPlayer ).updateEach( ( [ s, prev, net ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        const tuning = tuningForShip( net.shipId );
        const stunBefore = s.stunTimer;
        const vzBefore = s.vz;
        stepReplay( replay, s, dt, tuning, track, blockWorld );
        sparkIfBounced( s, stunBefore, vzBefore, dt, tuning );
    } );
    if ( ! replayLive( replay ) && replayView.get().replayed === null ) endReplay( replayResult( replay ) );
}

export function respawnReplayShip( world: World ): void {
    clearBlockState();
    world.query( Sim, Prev, LocalPlayer ).updateEach( ( [ s, prev ] ) => {
        copySimShip( s, spawnShip() );
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
    } );
}
