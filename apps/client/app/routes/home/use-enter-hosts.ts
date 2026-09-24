import { useEffect } from 'react';
import { isBareEnter } from '../../ship/ship-keys';
import { MENU_FORM } from './menu-form';

export function useEnterHosts() {
    // Syncs with the browser keyboard: a bare Enter anywhere on the menu submits the host form.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( ! isBareEnter( e ) ) return;
            const form = document.getElementById( MENU_FORM );
            if ( form instanceof HTMLFormElement ) form.requestSubmit();
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [] );
}
