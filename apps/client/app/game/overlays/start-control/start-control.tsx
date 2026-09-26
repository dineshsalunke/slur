import { START_MESSAGE } from '@slur/shared';
import { Fragment } from 'react';
import type { RunRoomLike } from '../../../net/run-room-like';
import { Button } from '../../../ui/button';
import { Chevron } from '../../../ui/chevron';
import { KeyHint } from '../../../ui/key-hint';
import { useHostId, useRunPlayers } from '../../net/run-view-store';
import { GUEST_HINTS, HOST_HINTS } from './start-control.constants';

export function StartControl( { room }: { room: RunRoomLike } ) {
    const hostId = useHostId( room );
    const players = useRunPlayers( room );
    const isHost = room.sessionId === hostId;
    const host = players.find( ( p ) => p.id === hostId );

    return (
        <Fragment>
            { isHost ? (
                <Button type="button" className="w-full sm:w-auto" onClick={ () => room.send( START_MESSAGE ) }>
                    Go
                    <Chevron dir="right" />
                </Button>
            ) : (
                <div className="flex min-h-11 flex-col justify-center">
                    <p className="m-0 max-w-[22ch] truncate text-[15px] font-semibold text-readout">
                        Waiting for { host?.name || 'the host' }
                    </p>
                    <p className="m-0 text-[12px] uppercase tracking-[0.16em] text-readout-dim">
                        The host starts the run
                    </p>
                </div>
            ) }
            <KeyHint hints={ isHost ? HOST_HINTS : GUEST_HINTS } className="hidden justify-end self-center lg:flex" />
        </Fragment>
    );
}
