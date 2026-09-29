import { useEffect } from 'react';
import { onAction } from '../../../game/input/actions';
import { isBareEnter } from '../../../ship/ship-keys';
import { MENU_FORM } from '../menu-form';

export function useEnterCreates() {
    // Syncs with the browser keyboard and the input action map: a bare Enter or start on the menu submits the create form.
    useEffect( () => {
        const create = () => {
            const form = document.getElementById( MENU_FORM );
            if ( form instanceof HTMLFormElement ) form.requestSubmit();
        };
        const onKey = ( e: KeyboardEvent ) => {
            if ( isBareEnter( e ) ) create();
        };
        const offAction = onAction( ( action ) => {
            if ( action === 'start' ) create();
        } );
        addEventListener( 'keydown', onKey );
        return () => {
            offAction();
            removeEventListener( 'keydown', onKey );
        };
    }, [] );
}
