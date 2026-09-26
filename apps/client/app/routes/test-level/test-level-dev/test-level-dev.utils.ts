import { PHASE, SET_CLASS_MESSAGE, SHIP_ORDER, START_MESSAGE } from '@slur/shared';
import type { World } from 'koota';
import { typingTarget } from '../../../dev/typing-target';
import { finishWatch, localFinished, resetFinishWatch } from '../../../game/finish/finish-watch';
import type { LoopbackRoom } from '../../../net/loopback-room/loopback-room';
import { autoRestart } from './test-level-dev.state';

export function restartRun( room: LoopbackRoom, shipId?: string ): void {
    room.sim.resetToLobby();
    if ( shipId ) room.send( SET_CLASS_MESSAGE, shipId );
    room.send( START_MESSAGE );
}

export function stepAutoRestart( room: LoopbackRoom, world: World ): void {
    if ( ! autoRestart.pending ) {
        if ( ! finishWatch.cut ) return;
        restartRun( room );
        autoRestart.pending = true;
        return;
    }
    if ( room.state.phase !== PHASE.racing || localFinished( world ) ) return;
    resetFinishWatch( finishWatch );
    autoRestart.pending = false;
}

export function attachClassKeys( room: LoopbackRoom ): () => void {
    const onKey = ( e: KeyboardEvent ) => {
        if ( ! e.shiftKey || e.repeat || typingTarget( e.target ) || ! e.code.startsWith( 'Digit' ) ) return;
        const shipId = SHIP_ORDER[ Number( e.code.slice( 'Digit'.length ) ) - 1 ];
        if ( shipId ) restartRun( room, shipId );
    };
    addEventListener( 'keydown', onKey );
    return () => removeEventListener( 'keydown', onKey );
}
