import { ROOM_CODE_LENGTH } from '@slur/shared';
import { useRef } from 'react';
import { useNavigation } from 'react-router';
import { FieldLabel } from '../../../ui/field-label/field-label';
import { SECONDARY_BUTTON } from '../quick-play/quick-play.constants';

export function JoinCodeField() {
    const join = useRef< HTMLButtonElement >( null );
    const navigation = useNavigation();
    const busy = navigation.state !== 'idle';
    const joining = busy && navigation.formData?.get( 'intent' ) === 'join';

    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <FieldLabel htmlFor="run-code">Run code</FieldLabel>
            <div className="flex">
                <input
                    id="run-code"
                    name="code"
                    type="text"
                    maxLength={ ROOM_CODE_LENGTH }
                    placeholder="K7QXM"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={ false }
                    onKeyDown={ ( e ) => {
                        if ( e.key !== 'Enter' ) return;
                        e.preventDefault();
                        join.current?.click();
                    } }
                    className="h-11 w-32 min-w-0 flex-1 border border-r-0 border-readout/20 bg-deep px-3.5 text-[16px] uppercase tracking-[0.3em] text-readout caret-marigold outline-none transition-colors duration-150 placeholder:tracking-[0.3em] placeholder:text-readout-dim hover:border-readout/40 focus-visible:border-marigold lg:flex-none"
                />
                <button
                    ref={ join }
                    type="submit"
                    name="intent"
                    value="join"
                    disabled={ busy }
                    className={ SECONDARY_BUTTON }
                >
                    { joining ? 'Joining…' : 'Join' }
                </button>
            </div>
        </div>
    );
}
