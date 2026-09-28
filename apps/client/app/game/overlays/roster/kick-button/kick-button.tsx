import { KICK_MESSAGE } from '@slur/shared';
import { useState } from 'react';
import type { RunRoomLike } from '../../../../net/run-room-like';
import { keepFocusOff } from '../../../../ui/ghost';
import { KICK, KICK_ARMED, KICK_IDLE } from './kick-button.constants';

export function KickButton( { room, targetId, name }: { room: RunRoomLike; targetId: string; name: string } ) {
    const [ armed, setArmed ] = useState( false );
    return (
        <button
            type="button"
            aria-label={ armed ? `Confirm: remove ${ name }` : `Remove ${ name }` }
            className={ `${ KICK } ${ armed ? KICK_ARMED : KICK_IDLE }` }
            onMouseDown={ keepFocusOff }
            onMouseLeave={ () => setArmed( false ) }
            onClick={ () => ( armed ? room.send( KICK_MESSAGE, targetId ) : setArmed( true ) ) }
        >
            { armed ? 'Remove?' : '✕' }
        </button>
    );
}
