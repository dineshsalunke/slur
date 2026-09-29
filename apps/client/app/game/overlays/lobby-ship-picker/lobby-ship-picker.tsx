import { PHASE, START_MESSAGE } from '@slur/shared';
import { useEffect } from 'react';
import type { RunRoomLike } from '../../../net/run-room-like';
import { isBareEnter, stepOf } from '../../../ship/ship-keys';
import { ShipStepper } from '../../../ship/ship-stepper/ship-stepper';
import { onAction } from '../../input/actions';
import { stepShip } from './lobby-ship-picker.utils';

export function LobbyShipPicker( { room }: { room: RunRoomLike } ) {
    // Syncs with the browser keyboard and the input action map: arrows cycle the ship; Enter or start runs GO for the host.
    useEffect( () => {
        const start = () => {
            if ( room.state.phase === PHASE.lobby && room.state.hostId === room.sessionId ) room.send( START_MESSAGE );
        };
        const onKey = ( e: KeyboardEvent ) => {
            if ( room.state.phase !== PHASE.lobby ) return;
            if ( isBareEnter( e ) ) {
                start();
                return;
            }
            const dir = stepOf( e );
            if ( ! dir ) return;
            e.preventDefault();
            stepShip( room, dir );
        };
        const offAction = onAction( ( action ) => {
            if ( action === 'start' ) start();
        } );
        addEventListener( 'keydown', onKey );
        return () => {
            offAction();
            removeEventListener( 'keydown', onKey );
        };
    }, [ room ] );

    return (
        <ShipStepper
            classLegend="sm:[@media(min-height:481px)]:invisible"
            onStep={ ( dir ) => stepShip( room, dir ) }
        />
    );
}
