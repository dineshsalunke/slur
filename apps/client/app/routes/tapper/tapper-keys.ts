import { typingTarget } from '../../dev/typing-target';
import { cancelRecording, recordKey, seekBars, togglePlay, toggleRecord } from './recorder';
import { undo } from './takes-store';
import { clockStore, setClick } from './tapper-clock';

const NOTE_KEYS = new Set( [ 'KeyA', 'KeyD', 'Space', 'KeyS' ] );
const ROUTE = '/tapper';

const COMMANDS: Record< string, () => void > = {
    Enter: togglePlay,
    KeyR: toggleRecord,
    ArrowLeft: () => seekBars( -1 ),
    ArrowRight: () => seekBars( 1 ),
    KeyM: () => setClick( ! clockStore.get().click ),
    Escape: cancelRecording,
};

let installed = false;

function handle( e: KeyboardEvent, down: boolean ): void {
    if ( location.pathname !== ROUTE || typingTarget( e.target ) ) return;
    if ( NOTE_KEYS.has( e.code ) ) {
        e.preventDefault();
        if ( ! e.repeat ) recordKey( e.code, e.shiftKey, down, e.timeStamp );
        return;
    }
    if ( ! down || e.repeat ) return;
    if ( e.code === 'KeyZ' && ( e.metaKey || e.ctrlKey ) ) {
        e.preventDefault();
        undo();
        return;
    }
    const cmd = COMMANDS[ e.code ];
    if ( cmd ) {
        e.preventDefault();
        cmd();
    }
}

export function installTapperKeys(): void {
    if ( installed ) return;
    installed = true;
    addEventListener( 'keydown', ( e ) => handle( e, true ) );
    addEventListener( 'keyup', ( e ) => handle( e, false ) );
}
