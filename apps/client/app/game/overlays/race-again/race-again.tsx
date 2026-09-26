import { PHASE, RESTART_MESSAGE } from '@slur/shared';
import { Fragment, useEffect } from 'react';
import type { RunRoomLike } from '../../../net/run-room-like';
import { isBareEnter } from '../../../ship/ship-keys';
import { Button } from '../../../ui/button';
import { Chevron } from '../../../ui/chevron';
import { KeyHint } from '../../../ui/key-hint';
import { useHostId, useRunPlayers } from '../../net/run-view-store';
import { HOST_HINTS } from './race-again.constants';

export function RaceAgain( { room }: { room: RunRoomLike } ) {
    const hostId = useHostId( room );
    const players = useRunPlayers( room );
    const isHost = room.sessionId === hostId;
    const host = players.find( ( p ) => p.id === hostId );

    // Syncs with the browser keyboard: a bare Enter restarts the run for the host.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( room.state.phase !== PHASE.finished ) return;
            if ( ! isBareEnter( e ) ) return;
            if ( room.state.hostId === room.sessionId ) room.send( RESTART_MESSAGE );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [ room ] );

    return isHost ? (
        <Fragment>
            <Button type="button" className="w-full sm:w-auto" onClick={ () => room.send( RESTART_MESSAGE ) }>
                Race again
                <Chevron dir="right" />
            </Button>
            <KeyHint hints={ HOST_HINTS } className="hidden justify-end self-center lg:flex" />
        </Fragment>
    ) : (
        <div className="flex min-h-11 min-w-0 max-w-[11.5rem] flex-col justify-center sm:max-w-none">
            <p className="m-0 max-w-[22ch] truncate text-[15px] font-semibold text-readout">
                Waiting for { host?.name || 'the host' }
            </p>
            <p className="m-0 text-[12px] uppercase tracking-[0.16em] text-readout-dim">The host starts the next run</p>
        </div>
    );
}
