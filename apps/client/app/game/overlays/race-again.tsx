import type { Room } from '@colyseus/sdk';
import { PHASE, RESTART_MESSAGE, type RunState } from '@slur/shared';
import { Fragment, useEffect } from 'react';
import { isBareEnter } from '../../ship/ship-keys';
import { Button } from '../../ui/button';
import { Chevron } from '../../ui/chevron';
import { KeyHint } from '../../ui/key-hint';
import { useRunView } from '../net/use-run-view';

const HOST_HINTS = [ { keys: [ 'Enter' ], does: 'Race again' } ] as const;

export function RaceAgain( { room }: { room: Room< RunState > } ) {
    const view = useRunView( room );
    const isHost = view.selfId === view.hostId;
    const host = view.players.find( ( p ) => p.id === view.hostId );

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
