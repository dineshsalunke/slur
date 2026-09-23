import type { Room } from '@colyseus/sdk';
import { type RunState, START_MESSAGE } from '@slur/shared';
import { Fragment } from 'react';
import { Button } from '../../ui/button';
import { Chevron } from '../../ui/chevron';
import { KeyHint } from '../../ui/key-hint';
import { useRunView } from '../net/use-run-view';

const SHIP_HINT = { keys: [ 'A', 'D' ], does: 'Ship' } as const;
const HOST_HINTS = [ SHIP_HINT, { keys: [ 'Enter' ], does: 'Go' } ] as const;
const GUEST_HINTS = [ SHIP_HINT ] as const;

export function StartControl( { room }: { room: Room< RunState > } ) {
    const view = useRunView( room );
    const isHost = view.selfId === view.hostId;
    const host = view.players.find( ( p ) => p.id === view.hostId );

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
