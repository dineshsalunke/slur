import { END_RACE_MESSAGE } from '@slur/shared';
import { Fragment, useState } from 'react';
import type { RunRoomLike } from '../../../net/run-room-like';
import { GHOST, keepFocusOff } from '../../../ui/ghost';
import { useHostId } from '../../net/run-view-store';

export function EndRace( { room }: { room: RunRoomLike } ) {
    const hostId = useHostId( room );
    const [ armed, setArmed ] = useState( false );
    if ( room.sessionId !== hostId ) return null;

    if ( ! armed ) {
        return (
            <button
                type="button"
                className={ `${ GHOST } px-4` }
                onMouseDown={ keepFocusOff }
                onClick={ () => setArmed( true ) }
            >
                End race
            </button>
        );
    }
    return (
        <Fragment>
            <button
                type="button"
                className={ `${ GHOST } border-marigold/70 px-4 text-marigold` }
                onMouseDown={ keepFocusOff }
                onClick={ () => room.send( END_RACE_MESSAGE ) }
            >
                End for all?
            </button>
            <button
                type="button"
                className={ `${ GHOST } px-4` }
                onMouseDown={ keepFocusOff }
                onClick={ () => setArmed( false ) }
            >
                Cancel
            </button>
        </Fragment>
    );
}
