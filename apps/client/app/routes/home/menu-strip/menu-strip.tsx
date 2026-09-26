import { Form } from 'react-router';
import { KeyHint } from '../../../ui/key-hint';
import { CallSignField } from '../call-sign-field/call-sign-field';
import { HostButton } from '../host-button';
import { MenuError } from '../menu-error';
import { MENU_FORM } from '../menu-form';
import { HINTS } from './menu-strip.constants';

export function MenuStrip( { savedName }: { savedName: string } ) {
    return (
        <Form
            id={ MENU_FORM }
            method="post"
            className="border-t border-readout/15 bg-space px-5 py-4 shadow-strip sm:px-10 sm:py-5"
        >
            <div className="grid gap-4 sm:grid-cols-[minmax(0,15rem)_auto] sm:items-end sm:gap-6 lg:grid-cols-[15rem_auto_1fr]">
                <CallSignField savedName={ savedName } />
                <HostButton />
                <KeyHint hints={ HINTS } className="hidden justify-end self-center lg:flex" />
            </div>
            <MenuError />
        </Form>
    );
}
