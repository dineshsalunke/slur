import { Form } from 'react-router';
import { CallSignField } from './call-sign-field';
import { HostButton } from './host-button';
import { KeyHint } from './key-hint';
import { MenuError } from './menu-error';
import { MENU_FORM } from './menu-form';
import { ShipPicker } from './ship-picker';

export function MenuStrip( { savedName }: { savedName: string } ) {
    return (
        <Form
            id={ MENU_FORM }
            method="post"
            className="border-t border-readout/15 bg-space px-5 py-4 shadow-strip sm:px-10 sm:py-5"
        >
            <div className="grid gap-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,17rem)_auto] sm:items-end sm:gap-6 lg:grid-cols-[15rem_17rem_auto_1fr]">
                <CallSignField savedName={ savedName } />
                <ShipPicker />
                <HostButton />
                <KeyHint className="hidden justify-end self-center lg:flex" />
            </div>
            <MenuError />
        </Form>
    );
}
