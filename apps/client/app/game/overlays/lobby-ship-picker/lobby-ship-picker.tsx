import { PHASE, START_MESSAGE } from '@slur/shared';
import { useEffect } from 'react';
import type { RunRoomLike } from '../../../net/run-room-like';
import { isBareEnter, stepOf } from '../../../ship/ship-keys';
import { ShipStepper } from '../../../ship/ship-stepper/ship-stepper';
import { stepShip } from './lobby-ship-picker.utils';

export function LobbyShipPicker( { room }: { room: RunRoomLike } ) {
    // Syncs with the browser keyboard: A/D and the arrow keys cycle the ship, and Enter starts the run for the host.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( room.state.phase !== PHASE.lobby ) return;
            if ( isBareEnter( e ) ) {
                if ( room.state.hostId === room.sessionId ) room.send( START_MESSAGE );
                return;
            }
            const dir = stepOf( e );
            if ( ! dir ) return;
            e.preventDefault();
            stepShip( room, dir );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [ room ] );

    return (
        <ShipStepper
            classLegend="sm:[@media(min-height:481px)]:invisible"
            onStep={ ( dir ) => stepShip( room, dir ) }
        />
    );
}
