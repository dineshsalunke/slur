import { copySimShip, FIXED_DT, spawnShip, type Track } from '@slur/shared';
import type { World } from 'koota';
import { labResult, labStep } from '../../../song-lab/bundle';
import { blockWorld, clearBlockState } from '../../game/block-state';
import { sparkIfBounced } from '../../game/ecs/bounce-spark';
import { LocalPlayer, Prev, Sim } from '../../game/ecs/traits';
import { endReplay, replay, replayLive, replayView } from './replay-state';

export function replayFlightSystem( world: World, track: Track ): void {
    world.query( Sim, Prev, LocalPlayer ).updateEach( ( [ s, prev ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        if ( replayLive() ) {
            const stunBefore = s.stunTimer;
            const vzBefore = s.vz;
            labStep( s, replay.inputs[ replay.tally.ticks ], replay.tuning, track, blockWorld, replay.tally );
            sparkIfBounced( s, stunBefore, vzBefore, FIXED_DT, replay.tuning );
        } else if ( replayView.get().replayed === null ) {
            endReplay( labResult( { ship: s, world: blockWorld, tally: replay.tally, trace: [] } ) );
        }
    } );
}

export function respawnReplayShip( world: World ): void {
    clearBlockState();
    world.query( Sim, Prev, LocalPlayer ).updateEach( ( [ s, prev ] ) => {
        copySimShip( s, spawnShip( 0, 0 ) );
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
    } );
}
