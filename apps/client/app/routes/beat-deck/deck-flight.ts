import { DEFAULT_SIM_CONFIG, emptyInput, simulate, type Track, tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import { blockWorld } from '../../game/block-state';
import { LocalPlayer, Net, Prev, Sim } from '../../game/ecs/traits';
import { currentInput } from '../../game/input/current-input';
import { recording, recordTick } from './take-recorder';

const held = emptyInput();

export function deckFlightSystem( world: World, dt: number, track: Track, perfNow: number ): void {
    const raw = currentInput();
    held.seq = raw.seq;
    held.throttle = recording() ? 1 : 0;
    held.brake = 0;
    held.strafe = raw.strafe;
    held.jump = raw.jump;
    world.query( Sim, Prev, Net, LocalPlayer ).updateEach( ( [ s, prev, net ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        simulate( s, held, dt, tuningForShip( net.shipId ), track, DEFAULT_SIM_CONFIG, blockWorld );
        recordTick( raw, s, perfNow );
    } );
}
