import { Form } from 'react-router';
import { KeyHint } from '../../../ui/key-hint';
import { CallSignField } from '../call-sign-field/call-sign-field';
import { CreateButton } from '../create-button/create-button';
import { JoinCodeField } from '../join-code-field/join-code-field';
import { MenuError } from '../menu-error';
import { MENU_FORM } from '../menu-form';
import { QuickPlay } from '../quick-play/quick-play';
import { HINTS } from './menu-strip.constants';

export function MenuStrip( { savedName }: { savedName: string } ) {
    return (
        <Form
            id={ MENU_FORM }
            method="post"
            className="border-t border-readout/15 bg-space px-5 py-4 shadow-strip sm:px-10 sm:py-5"
        >
            <div className="grid gap-4 sm:grid-cols-2 sm:items-end sm:gap-x-6 lg:grid-cols-[15rem_auto_auto_auto_1fr]">
                <CallSignField savedName={ savedName } />
                <CreateButton />
                <QuickPlay />
                <JoinCodeField />
                <KeyHint hints={ HINTS } className="hidden justify-end self-center lg:flex" />
            </div>
            <MenuError />
        </Form>
    );
}
