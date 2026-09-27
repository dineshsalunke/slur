import { PHASE, type RespawnPoint, SET_CLASS_MESSAGE, SHIP_ORDER, START_MESSAGE } from '@slur/shared';
import type { World } from 'koota';
import type { NavigateFunction } from 'react-router';
import { typingTarget } from '../../../dev/typing-target';
import { finishWatch, localFinished, resetFinishWatch } from '../../../game/finish/finish-watch';
import type { LoopbackRoom } from '../../../net/loopback-room/loopback-room';
import { startOf, withStart } from '../start-point/start-point.utils';
import { editorOpen } from '../test-level-canvas/pause-while-editing/pause-while-editing.state';
import { autoRestart } from './test-level-dev.state';

export function spawnAtStart( room: LoopbackRoom, start: RespawnPoint | null ): void {
    if ( start !== null ) room.sim.spawnAt( room.sessionId, start.x, start.z );
}

export function restartRun( room: LoopbackRoom, start: RespawnPoint | null, shipId?: string ): void {
    room.sim.resetToLobby();
    if ( shipId ) room.send( SET_CLASS_MESSAGE, shipId );
    room.send( START_MESSAGE );
    spawnAtStart( room, start );
}

export function resetRun( room: LoopbackRoom, start: RespawnPoint | null ): void {
    restartRun( room, start );
    resetFinishWatch( finishWatch );
    autoRestart.pending = false;
}

export function stepAutoRestart( room: LoopbackRoom, world: World ): void {
    if ( ! autoRestart.pending ) {
        if ( ! finishWatch.cut ) return;
        restartRun( room, startOf( location.search ) );
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
        if ( shipId ) restartRun( room, startOf( location.search ), shipId );
    };
    addEventListener( 'keydown', onKey );
    return () => removeEventListener( 'keydown', onKey );
}

export function attachResetKeys( room: LoopbackRoom, navigate: NavigateFunction ): () => void {
    const onKey = ( e: KeyboardEvent ) => {
        if ( e.code !== 'Backspace' || e.repeat || e.metaKey || e.ctrlKey || e.altKey ) return;
        if ( editorOpen.on || typingTarget( e.target ) ) return;
        e.preventDefault();
        if ( e.shiftKey ) {
            void navigate(
                { search: withStart( location.search, null ) },
                { replace: true, preventScrollReset: true },
            );
        }
        resetRun( room, e.shiftKey ? null : startOf( location.search ) );
    };
    addEventListener( 'keydown', onKey );
    return () => removeEventListener( 'keydown', onKey );
}
