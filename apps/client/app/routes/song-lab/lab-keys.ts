import { typingTarget } from '../../dev/typing-target';
import { restartReplay, stepSpeed, togglePlay } from './replay-state';

const ROUTE = '/song-lab';

const COMMANDS: Record< string, () => void > = {
    Space: togglePlay,
    KeyR: restartReplay,
    BracketLeft: () => stepSpeed( -1 ),
    BracketRight: () => stepSpeed( 1 ),
};

let installed = false;

function onKey( e: KeyboardEvent ): void {
    if ( location.pathname !== ROUTE || typingTarget( e.target ) || e.repeat ) return;
    const command = COMMANDS[ e.code ];
    if ( ! command ) return;
    e.preventDefault();
    command();
}

export function installLabKeys(): void {
    if ( installed ) return;
    installed = true;
    addEventListener( 'keydown', onKey );
}
