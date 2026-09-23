import type { Room } from '@colyseus/sdk';
import { PHASE, type RunState, SET_CLASS_MESSAGE, START_MESSAGE } from '@slur/shared';
import { useEffect } from 'react';
import { currentShip, cycleShip } from '../../ship/ship-choice';
import { isBareEnter, stepOf } from '../../ship/ship-keys';
import { ShipStepper } from '../../ship/ship-stepper';

function stepShip( room: Room< RunState >, dir: -1 | 1 ) {
    cycleShip( dir );
    room.send( SET_CLASS_MESSAGE, currentShip().id );
}

export function LobbyShipPicker( { room }: { room: Room< RunState > } ) {
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

    return <ShipStepper classLegend="sm:invisible" onStep={ ( dir ) => stepShip( room, dir ) } />;
}
