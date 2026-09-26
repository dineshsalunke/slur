import { START_MESSAGE, type TrackGen } from '@slur/shared';
import { simFreeze } from '../../dev/sim-freeze';
import { finishWatch, resetFinishWatch } from '../../game/finish/finish-watch';
import { LoopbackRoom } from '../../net/loopback-room/loopback-room';
import { testLevelDescriptor } from './test-level-canvas/test-level-canvas.utils';
import { autoRestart } from './test-level-dev/test-level-dev.state';
import { tunedSimConfig } from './tuned-sim-config';

let stopCurrent: ( () => void ) | null = null;

export function openTestLevelRoom( gen: TrackGen ): LoopbackRoom {
    stopCurrent?.();
    autoRestart.pending = false;
    resetFinishWatch( finishWatch );
    const room = new LoopbackRoom( testLevelDescriptor( gen ), {
        name: 'You',
        countdownSeconds: 0,
        config: tunedSimConfig(),
    } );
    room.send( START_MESSAGE );
    stopCurrent = room.run( () => simFreeze.on );
    return room;
}
