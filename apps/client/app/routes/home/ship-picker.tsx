import { useEffect } from 'react';
import { cycleShip } from '../../ship/ship-choice';
import { isBareEnter, stepOf } from '../../ship/ship-keys';
import { ShipStepper } from '../../ship/ship-stepper';
import { MENU_FORM } from './menu-form';

export function ShipPicker() {
    // Syncs with the browser keyboard: A/D and the arrow keys cycle the ship, and Enter hosts, anywhere on the menu.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( isBareEnter( e ) ) {
                const form = document.getElementById( MENU_FORM );
                if ( form instanceof HTMLFormElement ) form.requestSubmit();
                return;
            }
            const dir = stepOf( e );
            if ( ! dir ) return;
            e.preventDefault();
            cycleShip( dir );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [] );

    return <ShipStepper onStep={ cycleShip } />;
}
